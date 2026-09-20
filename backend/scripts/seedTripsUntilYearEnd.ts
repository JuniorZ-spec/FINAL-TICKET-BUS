require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const prisma = require("../prismaClient");

// Ajoute des trajets de démo, jour par jour, de demain jusqu'au 31/12/2026,
// sur les compagnies/gares/bus créés par seedBeninDemo.ts. Idempotent : un
// trajet identique (compagnie, ligne, date, heure) n'est jamais recréé.

const END_DATE = new Date("2026-12-31T12:00:00.000Z");

// every = un départ tous les N jours (1 = quotidien)
const TEMPLATES: { from: string; to: string; time: string; price: number; every: number }[] = [
  { from: "Cotonou", to: "Parakou", time: "07:00", price: 8500, every: 1 },
  { from: "Cotonou", to: "Parakou", time: "14:00", price: 8000, every: 2 },
  { from: "Parakou", to: "Cotonou", time: "07:30", price: 8200, every: 1 },
  { from: "Porto-Novo", to: "Cotonou", time: "09:00", price: 2500, every: 1 },
  { from: "Cotonou", to: "Porto-Novo", time: "16:00", price: 2500, every: 1 },
  { from: "Cotonou", to: "Bohicon", time: "11:00", price: 4000, every: 1 },
  { from: "Bohicon", to: "Cotonou", time: "18:00", price: 4200, every: 2 },
  { from: "Cotonou", to: "Ouidah", time: "10:00", price: 1500, every: 2 },
  { from: "Ouidah", to: "Parakou", time: "06:00", price: 9500, every: 3 },
  { from: "Natitingou", to: "Djougou", time: "08:00", price: 3500, every: 2 },
  { from: "Djougou", to: "Cotonou", time: "05:30", price: 9000, every: 3 },
  { from: "Parakou", to: "Natitingou", time: "09:30", price: 5000, every: 3 },
];

async function main() {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: "asc" } });
  if (!companies.length) {
    console.error("Aucune compagnie - lancer seedBeninDemo.ts d'abord");
    process.exit(1);
  }

  const stations = await prisma.station.findMany();
  const buses = await prisma.bus.findMany({ orderBy: { createdAt: "asc" } });
  const station = (companyId, city) =>
    stations.find((s) => s.companyId === companyId && s.city === city);

  const existing = await prisma.trip.findMany({
    select: { companyId: true, from: true, to: true, date: true, departureTime: true },
  });
  const seen = new Set(
    existing.map(
      (t) =>
        `${t.companyId}|${t.from}|${t.to}|${t.date.toISOString().slice(0, 10)}|${t.departureTime}`
    )
  );

  const rows = [];
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + 1);

  TEMPLATES.forEach((tpl, i) => {
    const company = companies[i % companies.length];
    const companyBuses = buses.filter((b) => b.companyId === company.id);
    const dep = station(company.id, tpl.from);
    const arr = station(company.id, tpl.to);
    if (!dep || !arr || !companyBuses.length) return;

    let dayIndex = 0;
    for (let d = new Date(start); d <= END_DATE; d.setUTCDate(d.getUTCDate() + 1), dayIndex++) {
      if (dayIndex % tpl.every !== 0) continue;
      const key = `${company.id}|${tpl.from}|${tpl.to}|${d.toISOString().slice(0, 10)}|${tpl.time}`;
      if (seen.has(key)) continue;
      rows.push({
        from: tpl.from,
        to: tpl.to,
        date: new Date(d),
        departureTime: tpl.time,
        price: tpl.price,
        companyId: company.id,
        busId: companyBuses[(i + dayIndex) % companyBuses.length].id,
        departureStationId: dep.id,
        arrivalStationId: arr.id,
      });
    }
  });

  const result = await prisma.trip.createMany({ data: rows });
  console.log(`${result.count} trajets créés jusqu'au 2026-12-31.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
