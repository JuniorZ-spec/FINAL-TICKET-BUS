const express = require("express");
const router = express.Router();
const Booking = require("../models/bookingsModel");
const Bus = require("../models/busesModel");
const Trip = require("../models/tripsModel");  // Assurez-vous d'importer le modèle Trip
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/book-seat", authMiddleware, async (req, res) => {
  try {
    const { tripId, seats, busId, transactionId } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).send({ message: "Utilisateur non authentifié", success: false });
    }

    const trip = await Trip.findById(tripId)
      .populate("bus")
      .populate("departureStations")
      .populate("arrivalStations");

    if (!trip) {
      return res.status(404).send({ message: "Trip non trouvé", success: false });
    }

    const now = new Date();
    const tripDateTime = new Date(`${trip.date}T${trip.departureTime}`);
    if (tripDateTime <= now) {
      return res.status(400).send({ message: "Ce voyage est déjà passé", success: false });
    }

    const requestedSeats = Array.isArray(seats) ? seats.map(seat => seat.toString()) : [];


    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).send({ message: "Bus non trouvé", success: false });
    }

    const existingSeats = Array.isArray(bus.seatsBooked) ? bus.seatsBooked.map(seat => seat.toString()) : [];

    const conflict = requestedSeats.some(seat => existingSeats.includes(seat));
    if (conflict) {
      return res.status(400).send({ message: "Un ou plusieurs sièges sont déjà réservés", success: false });
    }

    const updatedBus = await Bus.findOneAndUpdate(
      { _id: busId, seatsBooked: { $nin: requestedSeats } },
      { $addToSet: { seatsBooked: { $each: requestedSeats } } },
      { new: true }
    );
    if (!updatedBus) {
      return res.status(400).send({ message: "Un ou plusieurs sièges sont déjà réservés", success: false });
    }

    const newBooking = await Booking.create({
      trip: tripId,
      bus: busId,
      user: userId,
      seats: requestedSeats,
      company: trip.company,
      departureStation: trip.departureStations[0],
      arrivalStation: trip.arrivalStations[0],
      transactionId,
    });
    console.log("Sièges réservés dans bus :", bus.seatsBooked);

    // Recharger le trip avec le bus mis à jour
    const updatedTrip = await Trip.findById(tripId)
      .populate("bus")
      .populate("departureStations")
      .populate("arrivalStations");

    return res.status(200).send({
      message: "Réservation réussie",
      success: true,
      data: {
        booking: newBooking,
        updatedTrip: updatedTrip,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la réservation :", error);
    return res.status(500).send({
      message: "Erreur lors de la réservation",
      success: false,
      error: error.message,
    });
  }
});


router.get("/get-company-bookings", authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.userId;

    const bookings = await Booking.find({ company: companyId })
      .populate("trip")
      .populate("bus")
      .populate("user", "name email")
      .populate("departureStation")
      .populate("arrivalStation");

    res.send({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// ✅ Annuler une réservation sans modèle Seat
router.post("/cancel-booking", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send({
        message: "Réservation non trouvée",
        success: false,
      });
    }

    // Retirer les sièges du tableau seatsBooked dans le bus
    await Bus.updateOne(
      { _id: booking.bus },
      { $pull: { seatsBooked: { $in: booking.seats } } }
    );

    await Booking.findByIdAndDelete(bookingId);

    res.status(200).send({
      message: "Réservation annulée avec succès",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: "Erreur lors de l'annulation",
      success: false,
      error: error.message,
    });
  }
});

router.get("/get-all-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("trip")
      .populate("bus")
      .populate("user")
      .populate("company", "companyName")
      .populate("departureStation")
      .populate("arrivalStation");

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/get-bookings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({ user: userId })
      .populate("trip")
      .populate("user")
      .populate("bus")
      .populate("departureStation")
      .populate("arrivalStation")
      .populate("company", "companyName");

    res.status(200).send({
      message: "Réservations récupérées avec succès",
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).send({
      message: "Erreur lors de la récupération des réservations",
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
