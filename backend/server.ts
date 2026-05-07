const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const prisma = require("./prismaClient");

app.use(express.json());
app.use(cors());

// Routes
const usersRoute = require("./routes/usersRoute");
const busesRoute = require("./routes/busesRoute");
const bookingsRoute = require("./routes/bookingsRoute");
const companysRoute = require("./routes/companysRoute");
const adminRoute = require("./routes/adminRoute");
const tripsRoute = require("./routes/tripsRoute");
const stationsRoute = require("./routes/stationsRoute");

app.use("/api/users", usersRoute);
app.use("/api/buses", busesRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/companys", companysRoute);
app.use("/api/admin", adminRoute);
app.use("/api/trips", tripsRoute);
app.use("/api/stations", stationsRoute);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 5000;

async function start() {
  await prisma.$connect();
  console.log("PostgreSQL connecté via Prisma");

  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  });
}

start().catch((err) => {
  console.error("Erreur de démarrage :", err.message);
  process.exit(1);
});
