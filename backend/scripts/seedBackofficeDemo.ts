require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

// Données de démo pour que les espaces admin et compagnie soient lisibles :
// voyageurs, trajets passés/du jour, réservations (actives, terminées,
// annulées, guichet), colis, litiges, demandes de partenariat, avis.
// Idempotent : ne fait rien si les réservations de démo existent déjà.

const TRAVELERS = [
  ["Aïcha Sossou", "aicha.sossou"],
  ["Koffi Adjovi", "koffi.adjovi"],
  ["Fatou Bio", "fatou.bio"],
  ["Rodrigue Houngbo", "rodrigue.houngbo"],
  ["Nadège Tossou", "nadege.tossou"],
  ["Séraphin Agbo", "seraphin.agbo"],
  ["Mariam Yayi", "mariam.yayi"],
  ["Prince Dossou", "prince.dossou"],
  ["Chantal Gbaguidi", "chantal.gbaguidi"],
  ["Ibrahim Moussa", "ibrahim.moussa"],
];

const COMPANY_LOGINS = [
  { company: "Confort Lines", email: "company-confort@ticketbus-demo.com" },
  { company: "TransBenin", email: "company-transbenin@ticketbus-demo.com" },
];

const ROUTES = [
  ["Cotonou", "Parakou", 8500],
  ["Cotonou", "Porto-Novo", 2500],
  ["Cotonou", "Bohicon", 4000],
  ["Parakou", "Cotonou", 8200],
  ["Cotonou", "Ouidah", 1500],
  ["Natitingou", "Djougou", 3500],
];

const seatLabel = (i) => `${"ABCD"[i % 4]}${Math.floor(i / 4) + 1}`;
const dayAt = (offset) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

async function main() {
  if (await prisma.booking.findFirst({ where: { transactionId: { startsWith: "demo-" } } })) {
    console.log("Données de démo backoffice déjà présentes, rien à faire.");
    await prisma.$disconnect();
    return;
  }

  const companies = await prisma.company.findMany({
    where: { status: "VERIFIED" },
    orderBy: { createdAt: "asc" },
  });
  const buses = await prisma.bus.findMany();
  const stations = await prisma.station.findMany();
  const passwordHash = await bcrypt.hash("DemoTraveler2026!", 12);

  // Comptes compagnie supplémentaires
  for (const login of COMPANY_LOGINS) {
    const company = companies.find((c) => c.companyName === login.company);
    if (!company) continue;
    await prisma.user.upsert({
      where: { email: login.email },
      update: {},
      create: {
        email: login.email,
        password: await bcrypt.hash("DemoCompany2026!", 12),
        userType: "COMPANY_MEMBER",
        status: "ACTIVE",
        companyMember: { create: { companyId: company.id, role: "OWNER" } },
      },
    });
  }

  // Voyageurs
  const users = [];
  for (const [name, slug] of TRAVELERS) {
    users.push(
      await prisma.user.upsert({
        where: { email: `${slug}@ticketbus-demo.com` },
        update: {},
        create: {
          email: `${slug}@ticketbus-demo.com`,
          password: passwordHash,
          userType: "TRAVELER",
          status: "ACTIVE",
          travelerProfile: { create: { name, phone: "+229 97 00 00 0" + users.length } },
        },
      })
    );
  }

  // Trajets passés (15 derniers jours) + du jour + à venir proche, par compagnie
  const tripsByCompany = new Map();
  for (const company of companies) {
    const companyBuses = buses.filter((b) => b.companyId === company.id);
    const stationOf = (city) => stations.find((s) => s.companyId === company.id && s.city === city);
    const created = [];
    let n = 0;
    for (const offset of [-14, -10, -7, -5, -3, -2, -1, 0, 0, 1, 2]) {
      const [from, to, price] = ROUTES[(n + companies.indexOf(company)) % ROUTES.length];
      const dep = stationOf(from);
      const arr = stationOf(to);
      if (!dep || !arr) continue;
      created.push(
        await prisma.trip.create({
          data: {
            from,
            to,
            date: dayAt(offset),
            departureTime: offset === 0 ? (n % 2 ? "18:30" : "22:00") : n % 2 ? "07:00" : "13:30",
            price,
            companyId: company.id,
            busId: companyBuses[n % companyBuses.length].id,
            departureStationId: dep.id,
            arrivalStationId: arr.id,
          },
        })
      );
      n++;
    }
    tripsByCompany.set(company.id, created);
  }

  // Réservations
  let bookingCount = 0;
  const completedBookings = [];
  const cancelledBookings = [];
  for (const company of companies) {
    const trips = tripsByCompany.get(company.id) || [];
    let seatCursor = 0;
    for (const [ti, trip] of trips.entries()) {
      const isPast = trip.date < dayAt(0);
      const bookingsOnTrip = 2 + ((ti + companies.indexOf(company)) % 4);
      for (let b = 0; b < bookingsOnTrip; b++) {
        const user = users[(ti * 3 + b + bookingCount) % users.length];
        const seatsCount = 1 + ((b + ti) % 3 === 0 ? 1 : 0);
        const seats = Array.from({ length: seatsCount }, () => seatLabel(seatCursor++));
        const cancelled = !isPast && b === bookingsOnTrip - 1 && ti % 3 === 0;
        const status = cancelled ? "CANCELLED" : isPast ? "COMPLETED" : "ACTIVE";
        const tx = `demo-${company.companyName.slice(0, 3)}-${ti}-${b}`;

        const request = await prisma.bookingRequest.create({
          data: { seats, transactionId: tx, status: "CONFIRMED", userId: user.id, tripId: trip.id },
        });
        const booking = await prisma.booking.create({
          data: {
            seats,
            status,
            channel: b % 4 === 3 ? "COUNTER" : "ONLINE",
            transactionId: tx,
            userId: user.id,
            tripId: trip.id,
            companyId: company.id,
            createdAt: new Date(trip.date.getTime() - (2 + b) * 86400000),
          },
        });
        await prisma.bookingRequest.update({
          where: { id: request.id },
          data: { bookingId: booking.id },
        });
        if (!cancelled) {
          await prisma.bookingSeat.createMany({
            data: seats.map((seat) => ({ tripId: trip.id, seat, bookingRequestId: request.id })),
          });
        }
        (cancelled ? cancelledBookings : status === "COMPLETED" ? completedBookings : []).push(
          booking
        );
        bookingCount++;
      }
    }
  }

  // Avis sur des trajets terminés (un seul par réservation)
  const reviewTexts = [
    [5, "Départ à l'heure, bus propre et climatisé. Très bon voyage."],
    [4, "Chauffeur prudent, arrivée un peu en retard mais confortable."],
    [5, "Réservation simple, siège garanti. Je recommande."],
    [3, "Correct, mais le wifi ne fonctionnait pas pendant le trajet."],
  ];
  for (const [i, [rating, content]] of reviewTexts.entries()) {
    const booking = completedBookings[i * 3];
    if (!booking) continue;
    await prisma.review.create({
      data: { rating, content, userId: booking.userId, companyId: booking.companyId, bookingId: booking.id },
    });
  }

  // Colis
  const statuses = ["REGISTERED", "IN_TRANSIT", "IN_TRANSIT", "AWAITING_PICKUP", "DELIVERED", "DELIVERED"];
  for (let i = 0; i < 8; i++) {
    const company = companies[i % companies.length];
    const [from, to] = ROUTES[i % ROUTES.length];
    await prisma.parcel.create({
      data: {
        trackingCode: `ALG-${String(1000 + i)}`,
        from,
        to,
        senderName: TRAVELERS[i % TRAVELERS.length][0],
        senderPhone: `+229 96 00 00 ${10 + i}`,
        status: statuses[i % statuses.length],
        companyId: company.id,
        senderId: users[i % users.length].id,
      },
    });
  }

  // Litiges
  const disputes = [
    ["Remboursement non reçu après annulation", "Le client a annulé mais n'a pas été remboursé.", "HIGH", "OPEN"],
    ["Bus arrivé avec 3h de retard", "Retard important non signalé aux voyageurs.", "NORMAL", "OPEN"],
    ["Bagage endommagé", "Valise abîmée pendant le transport.", "LOW", "OPEN"],
    ["Double débit Mobile Money", "Débité deux fois pour la même réservation.", "HIGH", "RESOLVED"],
  ];
  for (const [i, [subject, description, priority, status]] of disputes.entries()) {
    const booking = cancelledBookings[i] || completedBookings[i];
    await prisma.dispute.create({
      data: {
        reference: `LIT-${2026}-${String(i + 1).padStart(3, "0")}`,
        subject,
        description,
        priority,
        status,
        companyId: booking.companyId,
        userId: booking.userId,
        bookingId: booking.id,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });
  }

  // Demandes de partenariat en attente (visibles dans l'admin)
  const pending = [
    ["Atlantique Express", "contact@atlantique-express-demo.com", "Marc Kpodo", "+229 95 11 22 33", "Cotonou - Lomé, Cotonou - Ouidah"],
    ["Nord Voyages", "contact@nord-voyages-demo.com", "Salamatou Idrissou", "+229 95 44 55 66", "Parakou - Natitingou, Parakou - Djougou"],
  ];
  for (const [companyName, email, contactName, contactPhone, routesNote] of pending) {
    await prisma.company.create({
      data: {
        companyName,
        email,
        status: "PENDING",
        contactName,
        contactPhone,
        routesNote,
        rccm: "RB/COT/26 B 0000",
        ifu: "3202600000000",
      },
    });
  }

  console.log(
    `${users.length} voyageurs, ${bookingCount} réservations, ${reviewTexts.length} avis, 8 colis, ${disputes.length} litiges, ${pending.length} demandes de partenariat.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
