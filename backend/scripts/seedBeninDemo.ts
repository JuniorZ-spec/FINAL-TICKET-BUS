require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

// Recrée un jeu de données de démo réaliste (compagnies, gares, bus, trajets
// datés dans le futur, un voyageur de test) après la remise à zéro
// accidentelle de la base le 2026-09-16. Idempotent : ne fait rien si une
// compagnie existe déjà.

const COMPANIES = [
  { name: "Bénin Voyages", email: "contact@beninvoyages-demo.com" },
  { name: "Confort Lines", email: "contact@confortlines-demo.com" },
  { name: "TransBenin", email: "contact@transbenin-demo.com" },
];

const CITIES = ["Cotonou", "Parakou", "Porto-Novo", "Bohicon", "Ouidah", "Natitingou", "Djougou"];

// jours depuis aujourd'hui, heure, prix
const ROUTES: { from: string; to: string; daysFromNow: number; time: string; price: number }[] = [
  { from: "Cotonou", to: "Parakou", daysFromNow: 1, time: "07:00", price: 8500 },
  { from: "Cotonou", to: "Parakou", daysFromNow: 2, time: "14:00", price: 8000 },
  { from: "Cotonou", to: "Parakou", daysFromNow: 3, time: "07:00", price: 8500 },
  { from: "Porto-Novo", to: "Cotonou", daysFromNow: 1, time: "09:00", price: 2500 },
  { from: "Porto-Novo", to: "Cotonou", daysFromNow: 2, time: "16:00", price: 2500 },
  { from: "Cotonou", to: "Bohicon", daysFromNow: 1, time: "11:00", price: 4000 },
  { from: "Cotonou", to: "Bohicon", daysFromNow: 2, time: "18:00", price: 4200 },
  { from: "Ouidah", to: "Parakou", daysFromNow: 1, time: "06:00", price: 9500 },
  { from: "Cotonou", to: "Ouidah", daysFromNow: 1, time: "10:00", price: 1500 },
  { from: "Natitingou", to: "Djougou", daysFromNow: 1, time: "08:00", price: 3500 },
  { from: "Djougou", to: "Cotonou", daysFromNow: 2, time: "05:30", price: 9000 },
  { from: "Parakou", to: "Cotonou", daysFromNow: 3, time: "13:00", price: 8200 },
];

async function main() {
  const existing = await prisma.company.findFirst();
  if (existing) {
    console.log("Des compagnies existent déjà, on ne reseed pas :", existing.companyName);
    await prisma.$disconnect();
    return;
  }

  const companies = [];
  for (const c of COMPANIES) {
    const company = await prisma.company.create({
      data: { companyName: c.name, email: c.email, status: "VERIFIED" },
    });
    companies.push(company);
  }

  // Une gare par ville pour chaque compagnie qui la dessert (simplifié :
  // chaque compagnie a une gare dans chaque ville de CITIES).
  const stationByCompanyCity = new Map();
  for (const company of companies) {
    for (const city of CITIES) {
      const station = await prisma.station.create({
        data: {
          name: `Gare routière de ${city}`,
          address: "Centre-ville",
          city,
          companyId: company.id,
        },
      });
      stationByCompanyCity.set(`${company.id}:${city}`, station);
    }
  }

  const busesByCompany = new Map();
  for (const [index, company] of companies.entries()) {
    const buses = await Promise.all([
      prisma.bus.create({
        data: {
          number: `BJ ${1000 + index * 10} AB`,
          name: "Bus VIP",
          capacity: 45,
          airConditioning: true,
          wifi: true,
          companyId: company.id,
        },
      }),
      prisma.bus.create({
        data: {
          number: `BJ ${1001 + index * 10} CD`,
          name: "Bus Standard",
          capacity: 50,
          airConditioning: index % 2 === 0,
          wifi: false,
          companyId: company.id,
        },
      }),
    ]);
    busesByCompany.set(company.id, buses);
  }

  let tripCount = 0;
  for (let i = 0; i < ROUTES.length; i++) {
    const { from, to, daysFromNow, time, price } = ROUTES[i];
    const company = companies[i % companies.length];
    const bus = busesByCompany.get(company.id)[i % 2];
    const departureStation = stationByCompanyCity.get(`${company.id}:${from}`);
    const arrivalStation = stationByCompanyCity.get(`${company.id}:${to}`);

    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);

    await prisma.trip.create({
      data: {
        from,
        to,
        date,
        departureTime: time,
        price,
        companyId: company.id,
        busId: bus.id,
        departureStationId: departureStation.id,
        arrivalStationId: arrivalStation.id,
      },
    });
    tripCount++;
  }

  const testUser = await prisma.user.upsert({
    where: { email: "traveler-demo@ticketbus-demo.com" },
    update: {},
    create: {
      email: "traveler-demo@ticketbus-demo.com",
      password: await bcrypt.hash("DemoTraveler2026!", 12),
      userType: "TRAVELER",
      status: "ACTIVE",
      travelerProfile: { create: { name: "Voyageur Demo", phone: "+22900000000" } },
    },
  });

  console.log(`${companies.length} compagnies, ${tripCount} trajets créés.`);
  console.log("Voyageur de test :", testUser.email, "/ mot de passe: DemoTraveler2026!");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
