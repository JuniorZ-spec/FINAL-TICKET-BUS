import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

// 50 utilisateurs, 40 sieges disponibles sur le trajet de demo
// (backend/scripts/seedDemoData.ts). Chaque VU vise le siege
// ((VU-1) % 40) + 1 : les VU 1-40 obtiennent chacun un siege unique
// (40 CONFIRMED attendus), les VU 41-50 retombent sur les sieges 1-10,
// deja pris (10 REJECTED attendus). Objectif du projet : 40 confirmations,
// 10 refus propres, ZERO doublon - la preuve que BookingSeat.@@unique
// tient sous charge concurrente reelle, pas seulement sur 2 requetes.

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const EMAIL = __ENV.DEMO_EMAIL || "traveler-demo@ticketbus-demo.com";
const PASSWORD = __ENV.DEMO_PASSWORD || "DemoTraveler2026!";
const SEAT_COUNT = 40;

const confirmed = new Counter("booking_confirmed");
const rejected = new Counter("booking_rejected");
const timedOut = new Counter("booking_timed_out");
const enqueueErrors = new Counter("booking_enqueue_errors");

export const options = {
  scenarios: {
    booking_race: {
      executor: "per-vu-iterations",
      vus: 50,
      iterations: 1,
      maxDuration: "2m",
    },
  },
  thresholds: {
    booking_confirmed: [`count==${SEAT_COUNT}`],
    booking_rejected: [`count==${50 - SEAT_COUNT}`],
    booking_enqueue_errors: ["count==0"],
    booking_timed_out: ["count==0"],
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (loginRes.status !== 200) {
    throw new Error(`Login echoue (${loginRes.status}) : ${loginRes.body}`);
  }
  const token = loginRes.json("data.accessToken");

  const tripsRes = http.get(`${BASE_URL}/api/trips/get-all-trips`);
  // Un trajet entierement libre (availableSeats === 40), pas juste le
  // premier "DEMO-A" trouve - sinon un run precedent fausse le resultat.
  const trip = tripsRes
    .json("data")
    .find((t) => t.from === "DEMO-A" && t.availableSeats === SEAT_COUNT);
  if (!trip) {
    throw new Error(
      "Aucun trajet de demo entierement libre - lancer seedFreshTrip.ts avant de rejouer le test"
    );
  }

  return { token, tripId: trip.id };
}

export default function (data) {
  const seat = String(((__VU - 1) % SEAT_COUNT) + 1);
  const transactionId = `k6-vu-${__VU}-${__ITER}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.token}`,
  };

  const bookRes = http.post(
    `${BASE_URL}/api/bookings/book-seat`,
    JSON.stringify({ tripId: data.tripId, seats: [seat], transactionId }),
    { headers }
  );

  const enqueued = check(bookRes, {
    "enqueue accepte (202/200)": (r) => r.status === 200 || r.status === 202,
  });

  if (!enqueued) {
    enqueueErrors.add(1);
    console.error(`VU ${__VU} siege ${seat} : enqueue echoue (${bookRes.status}) ${bookRes.body}`);
    return;
  }

  const bookingRequestId = bookRes.json("data.bookingRequestId");

  // La Lambda traite les messages d'un meme trip en serie (SQS FIFO,
  // MessageGroupId = tripId) : sous 50 requetes simultanees, la queue
  // peut prendre plusieurs secondes a vider. On poll avec un budget large.
  let status = "PENDING";
  for (let i = 0; i < 30 && status === "PENDING"; i++) {
    sleep(1);
    const pollRes = http.get(`${BASE_URL}/api/bookings/requests/${bookingRequestId}`, {
      headers,
    });
    if (pollRes.status === 200) {
      status = pollRes.json("data.status");
    }
  }

  if (status === "CONFIRMED") {
    confirmed.add(1);
  } else if (status === "REJECTED") {
    rejected.add(1);
  } else {
    timedOut.add(1);
    console.error(`VU ${__VU} siege ${seat} : toujours PENDING apres 30s (requete ${bookingRequestId})`);
  }
}
