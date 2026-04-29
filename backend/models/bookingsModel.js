const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seats: { type: [String], default: [] },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    departureStation: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
    arrivalStation: { type: mongoose.Schema.Types.ObjectId, ref: "Station", required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
