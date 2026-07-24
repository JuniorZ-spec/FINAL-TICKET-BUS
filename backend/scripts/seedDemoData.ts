require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

// Cree une compagnie + bus + trajet de demo (40 places), plus un compte
// voyageur de test - utilise pour la verification manuelle de la Phase 6
// et pour le test de charge k6 (Phase 7). Idempotent : ne recree rien si
// le trajet de demo existe deja.

async function seedDemoData() {
  const existingTrip = await prisma.trip.findFirst({ where: { from: "DEMO-A" } });
  if (existingTrip) {
    console.log("Trajet de demo deja present :", existingTrip.id);
    await prisma.$disconnect();
    return;
  }

  const company = await prisma.company.create({
    data: {
      companyName: "Demo Transport",
      email: "demo-company@ticketbus-demo.com",
      status: "VERIFIED",
    },
  });

  const departureStation = await prisma.station.create({
    data: { name: "Gare A", address: "1 rue A", city: "DEMO-A", companyId: company.id },
  });

  const arrivalStation = await prisma.station.create({
    data: { name: "Gare B", address: "1 rue B", city: "DEMO-B", companyId: company.id },
  });

  const bus = await prisma.bus.create({
    data: {
      number: "DEMO-01",
      name: "Bus Demo",
      capacity: 40,
      companyId: company.id,
    },
  });

  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 7); // dans 7 jours, toujours dans le futur

  const trip = await prisma.trip.create({
    data: {
      from: "DEMO-A",
      to: "DEMO-B",
      date: departureDate,
      departureTime: "08:00",
      price: 5000,
      companyId: company.id,
      busId: bus.id,
      departureStationId: departureStation.id,
      arrivalStationId: arrivalStation.id,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: "traveler-demo@ticketbus-demo.com" },
    update: {},
    create: {
      email: "traveler-demo@ticketbus-demo.com",
      password: await bcrypt.hash("DemoTraveler2026!", 12),
      userType: "TRAVELER",
      status: "ACTIVE",
      travelerProfile: { create: { name: "Voyageur Demo" } },
    },
  });

  console.log("Compagnie :", company.id);
  console.log("Trajet :", trip.id, "(" + trip.from + " -> " + trip.to + ", capacite bus:", bus.capacity, "places)");
  console.log("Utilisateur de test :", testUser.email);

  await prisma.$disconnect();
}

seedDemoData().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
