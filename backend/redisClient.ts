const Redis = require("ioredis");

// Redis ne sert que de verrou consultatif pendant la sélection de sièges
// (bookSeat revérifie toujours en base, seule source de vérité contre la
// survente). On échoue donc vite plutôt que de faire attendre l'utilisateur
// sur des tentatives de reconnexion quand Redis est indisponible.
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy: () => 2000,
});

redis.on("connect", () => console.log("✅ Connecté à Redis"));
redis.on("error", (err) => console.error("❌ Erreur Redis :", err.message));

module.exports = redis;
