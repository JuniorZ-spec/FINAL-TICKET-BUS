require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

async function seedAdmin() {
  const existing = await prisma.user.findFirst({ where: { userType: "ADMIN" } });
  if (existing) {
    console.log("Un admin existe déjà :", existing.email);
    await prisma.$disconnect();
    process.exit(0);
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans le .env");
    process.exit(1);
  }

  await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      userType: "ADMIN",
      status: "ACTIVE",
      adminProfile: { create: { name: "Super Admin" } },
    },
  });

  console.log("Admin créé avec succès :", process.env.ADMIN_EMAIL);
  await prisma.$disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
