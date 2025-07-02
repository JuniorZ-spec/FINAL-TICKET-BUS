const express = require("express");
const router = express.Router();
const Station = require("../models/stationsModel");
const authMiddleware = require('../middlewares/authMiddleware');

// Ajouter une station
router.post("/add-station", authMiddleware, async (req, res) => {
  try {
    const { name, address, city } = req.body;

    const newStation = new Station({ name, address, city, company: req.user.userId, });
    await newStation.save();

    return res.status(200).send({ success: true, message: "Station ajoutée avec succès", data: newStation });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

// Récupérer toutes les stations
router.get("/get-all-stations", async (req, res) => {
  try {
    const stations = await Station.find();
    return res.status(200).send({ success: true, data: stations });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// Récupérer une station par ID
router.get("/get-station/:id", async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).send({ success: false, message: "Station introuvable." });
    }
    return res.status(200).send({ success: true, data: station });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});





// Mettre à jour une station
router.put("/update-station/:id", authMiddleware, async (req, res) => {
  try {
    const { name, address, city } = req.body;

    const station = await Station.findByIdAndUpdate(
      req.params.id,
      { name, address, city },
      { new: true }
    );

    if (!station) {
      return res.status(404).send({ success: false, message: "Station introuvable." });
    }

    return res.status(200).send({ success: true, message: "Station mise à jour avec succès", data: station });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

// Supprimer une station
router.delete("/delete-station/:id", authMiddleware, async (req, res) => {
  try {
    const deletedStation = await Station.findByIdAndDelete(req.params.id);
    if (!deletedStation) {
      return res.status(404).send({ success: false, message: "Station introuvable." });
    }
    return res.status(200).send({ success: true, message: "Station supprimée avec succès." });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
