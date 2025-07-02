const express = require("express");
const router = express.Router();
const Bus = require("../models/busesModel");
const Trip = require("../models/tripsModel");  // Changed from "Route" to "Trip"
const authMiddleware = require('../middlewares/authMiddleware');
const User = require("../models/usersModel");

router.post("/get-buses-company", authMiddleware, async (req, res) => {
  try {
    // 🔒 On vérifie que c'est bien une compagnie
    if (req.user.role !== "company") {
      return res.status(403).send({ success: false, message: "Accès non autorisé" });
    }

    // 🔍 On filtre les bus appartenant à cette compagnie
   const buses = await Bus.find({ company: req.user.userId }).populate("company", "companyName");


    res.status(200).send({ success: true, data: buses });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});


// Add a bus
// Add a bus (corrigé)
router.post("/add-bus", authMiddleware, async (req, res) => {
  try {
    const { name, number, capacity, services } = req.body;

    const newBus = new Bus({
      name,
      number,
      capacity,
      services,  // Ajout de l'objet services
      company: req.user.userId, // Lien avec la compagnie connectée
    });

    await newBus.save();

    return res.status(200).send({ success: true, message: "Bus ajouté avec succès", data: newBus });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});





// Get all buses
router.get("/get-all-buses", authMiddleware, async (req, res) => {
  try {
   const buses = await Bus.find({ company: req.user.userId }).populate("company", "companyName");


    return res.status(200).send({
      success: true,
      message: "Tous les bus récupérés",
      data: buses,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});



// Update a bus
router.post("/update-bus", authMiddleware, async (req, res) => {
  try {
    const { _id, name, number, capacity } = req.body;

    const updatedBus = await Bus.findByIdAndUpdate(
      _id,
      { name, number, capacity },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(404).send({ success: false, message: "Bus introuvable." });
    }

    return res.status(200).send({ success: true, message: "Bus mis à jour avec succès", data: updatedBus });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});



// Delete a bus
router.post("/delete-bus", authMiddleware, async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.body._id);
    return res.status(200).send({ success: true, message: "Bus deleted successfully." });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get bus by ID
router.post("/get-bus-by-id", authMiddleware, async (req, res) => {
  try {
    const bus = await Bus.findById(req.body._id).populate("trip");
    if (!bus) {
      return res.status(404).send({ success: false, message: "Bus not found." });
    }
    return res.status(200).send({ success: true, data: bus });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;