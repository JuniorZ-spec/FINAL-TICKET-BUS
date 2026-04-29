const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureStations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true }],
    arrivalStations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true }],
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, required: true }, // Date du trajet
    departureTime: { type: String, required: true }, // Heure de départ sous forme de chaîne (ex: "14:30")
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
