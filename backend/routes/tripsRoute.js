const express = require("express");
const router = express.Router();
const Trip = require("../models/tripsModel");
const authMiddleware = require('../middlewares/authMiddleware');

// Ajouter un trip
router.post("/add-trip", authMiddleware, async (req, res) => {
  try {
    const user = req.user; // récupéré depuis le token grâce au middleware
    const { from, to, departureStations, arrivalStations, bus, date, departureTime, price } = req.body;

    const newTrip = new Trip({
      from,
      to,
      departureStations,
      arrivalStations,
      bus,
      company: user._id, // Associer automatiquement la compagnie connectée
      date,
      departureTime,
      price,
      company: req.user.userId,
    });

    await newTrip.save();
    return res.status(201).send({ success: true, message: "Trip ajouté avec succès", data: newTrip });
  } catch (error) {
    console.error("Error adding trip:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});



// Récupérer tous les trips avec les détails des références
router.get("/get-all-trips", async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("departureStations", "name address")
      .populate("arrivalStations", "name address")
      .populate("bus", "name number capacity services seatsBooked")
      .populate("company", "companyName"); // ✅ ici

    return res.status(200).send({ success: true, data: trips });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});


// Récupérer un trip par son ID
router.post("/get-trip-by-id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.body._id)
      .populate("bus", "name number capacity services seatsBooked") // Assurez-vous de bien récupérer le bus
      .populate("departureStations", "name address")
      .populate("arrivalStations", "name address");

    if (!trip) {
      return res.status(404).send({ success: false, message: "Trip introuvable." });
    }

    return res.status(200).send({ success: true, data: trip });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

          
// Récupérer les trajets d'une compagnie spécifique
router.post("/get-company-trips", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).send({ success: false, message: "Accès non autorisé" });
    }

    const trips = await Trip.find({ company: req.user.userId }) // ✅ Correction ici
      .populate("departureStations", "name address")
      .populate("arrivalStations", "name address")
      .populate("bus", "name")
      .populate("company", "companyName");

    return res.status(200).send({ success: true, data: trips });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});
router.put("/update-trip/:id", authMiddleware, async (req, res) => {
  try {
    const { from, to, departureStations, arrivalStations, bus, company, date, departureTime, price } = req.body;

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id, // ✅ L'ID vient des paramètres de l'URL
      { from, to, departureStations, arrivalStations, bus, company, date, departureTime, price },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).send({ success: false, message: "Trip introuvable." });
    }

    return res.status(200).send({ success: true, message: "Trip mis à jour avec succès", data: updatedTrip });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});


// Modifier un trip


// Supprimer un trip
router.delete("/delete-trip/:id", authMiddleware, async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip) {
      return res.status(404).send({ success: false, message: "Trip introuvable." });
    }
    return res.status(200).send({ success: true, message: "Trip supprimé avec succès." });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
