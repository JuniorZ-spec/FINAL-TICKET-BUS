const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },   // Nom de la gare
  address: { type: String, required: true }, // Adresse précise
  city: { type: String, required: true },    // Ville où se trouve la gare
  company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Référence à la compagnie
}, { timestamps: true });

module.exports = mongoose.model("Station", stationSchema);
