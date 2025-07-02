const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seats: { type: Array, default: [] },       // Tableau de numéros de sièges
  company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  departureStation: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
  arrivalStation:   { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
  transactionId:    { type: String, required: true },
}, { timestamps: true });


module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
