const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    seatsBooked: { type: [String], default: [] },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Lien avec la compagnie
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" }, // Lien avec le trip
    services: {
      airConditioning: { type: Boolean, default: false }, // Service climatisation
      wifi: { type: Boolean, default: false }, // Service Wi-Fi
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);
