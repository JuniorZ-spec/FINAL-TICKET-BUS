require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const prisma = require("../prismaClient");

// Ajoute un nouveau trajet (memes compagnie/bus/gares que seedDemoData.ts)
// avec 40 sieges entierement libres - utile pour rejouer le test k6
// (Phase 7) sans que les reservations d'une session precedente ne
// faussent le resultat attendu (40 confirmations / 10 refus).

async function seedFreshTrip() {
  const company = await prisma.company.findFirst({ where: { companyName: "Demo Transport" } });
  const bus = await prisma.bus.findFirst({ where: { number: "DEMO-01" } });
  const departureStation = await prisma.station.findFirst({ where: { city: "DEMO-A" } });
  const arrivalStation = await prisma.station.findFirst({ where: { city: "DEMO-B" } });

  if (!company || !bus || !departureStation || !arrivalStation) {
    console.error("Donnees de base manquantes - lancer seedDemoData.js d'abord");
    process.exit(1);
  }

  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 7);

  const trip = await prisma.trip.create({
    data: {
      from: "DEMO-A",
      to: "DEMO-B",
      date: departureDate,
      departureTime: `${String(new Date().getMinutes()).padStart(2, "0")}:${String(new Date().getSeconds()).padStart(2, "0")}`,
      price: 5000,
      companyId: company.id,
      busId: bus.id,
      departureStationId: departureStation.id,
      arrivalStationId: arrivalStation.id,
    },
  });

  console.log("Nouveau trajet (40 sieges libres) :", trip.id);
  await prisma.$disconnect();
}

seedFreshTrip().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
