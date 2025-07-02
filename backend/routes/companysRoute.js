const express = require("express");
const router = express.Router();
const User = require("../models/usersModel");
const Bus = require("../models/busesModel");
const Booking = require("../models/bookingsModel");
const Station = require("../models/stationsModel"); // le chemin dépend de ton projet

const Trip = require("../models/tripsModel");  // Changed from 'Route' to 'Trip' - consider renaming file to tripsModel.js
const authMiddleware = require('../middlewares/authMiddleware');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const company = await User.findOne({
        email,
        role: "company",
      });
  
      if (!company) {
        return res.status(400).json({
          success: false,
          message: "Identifiants invalides",
        });
      }
  
      const isMatch = await bcrypt.compare(password, company.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe incorrect",
        });
      }
  
      // Création du token JWT
      const token = jwt.sign(
        { userId: company._id, role: company.role }, // <-- Ajout ici
        process.env.jwt_secret,
        { expiresIn: "1d" }
      );
      
  
      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        token,
        data: {
          companyName: company.companyName,
          email: company.email,
          id: company._id,
        },
      });
    } catch (error) {
      console.error("Erreur login company:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  });


router.post("/get-company-by-id", authMiddleware, async (req, res) => {
    try {
      // Vérification que le rôle est bien "company"
      if (req.body.role !== "company") {
        return res.status(403).send({
          success: false,
          message: "Accès refusé : rôle non autorisé",
        });
      }
  
      const company = await User.findById(req.body.userId);
  
      if (!company || company.role !== "company") {
        return res.status(404).send({
          success: false,
          message: "Compagnie introuvable",
        });
      }
  
      res.send({
        message: "Compagnie récupérée avec succès",
        success: true,
        data: company,
      });
    } catch (error) {
      res.send({
        message: error.message,
        success: false,
        data: null,
      });
    }
  });
  
// Get company information
router.get("/get-company-info", authMiddleware, async (req, res) => {
    try {
        const company = await User.findById(req.user.userId).select("-password");
        if (!company) {
            return res.status(404).send({
                message: "Company not found",
                success: false,
                data: null,
            });
        }

        res.status(200).send({
            message: "Company information retrieved successfully",
            success: true,
            data: company,
        });
    } catch (error) {
        res.status(500).send({
            message: "Internal server error",
            success: false,
            data: null,
        });
    }
});

// Change company password
router.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const company = await User.findById(req.user.userId);
        if (!company) {
            return res.status(404).send({
                message: "Company not found",
                success: false,
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, company.password);
        if (!isMatch) {
            return res.status(400).send({
                message: "Current password is incorrect",
                success: false,
            });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        company.password = hashedPassword;
        await company.save();

        res.status(200).send({
            message: "Password changed successfully",
            success: true,
        });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).send({
            message: "Internal server error",
            success: false,
        });
    }
});

// Get company bookings


// Get company trips
router.get("/get-company-trips", authMiddleware, async (req, res) => {  // Changed from 'routes' to 'trips'
    try {
        const companyId = req.user.userId;

        // Get all company trips
        const trips = await Trip.find({ company: companyId }).populate("bus");

        res.status(200).send({
            message: "Trips retrieved successfully",  // Changed from 'Routes' to 'Trips'
            success: true,
            data: trips,
        });
    } catch (error) {
        res.status(500).send({
            message: "Error retrieving trips",  // Changed from 'Routes' to 'Trips'
            success: false,
            error: error.message,
        });
    }
});

// routes/company.js ou routes/companies.js
router.get("/get-dashboard-stats", authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.userId;

    const bookings = await Booking.find({ company: companyId });
    const trips = await Trip.find({ company: companyId });
    const buses = await Bus.find({ company: companyId });
    const stations = await Station.find({ company: companyId }); // 👈 Ajout ici

    const totalRevenue = bookings.reduce((acc, booking) => {
      const trip = trips.find(t => t._id.toString() === booking.trip.toString());
      return acc + (trip ? trip.price * booking.seats.length : 0);
    }, 0);

    const stats = {
      busesCount: buses.length,
      stationsCount: stations.length, // 👈 Et ici
      tripsCount: trips.length,
      reservationsCount: bookings.length,
      totalRevenue,
      fillRate: 0, // tu peux le calculer plus tard
    };

    console.log("DASHBOARD STATS =>", stats);

    res.status(200).send({
      message: "Company dashboard stats",
      success: true,
      data: stats,
    });
  } catch (error) {
    console.log("Dashboard error:", error);
    res.status(500).send({
      message: "Erreur lors de la récupération des stats",
      success: false,
      error: error.message,
    });
  }
});


router.get("/get-all-companies", authMiddleware, async (req, res) => {
  try {
      const companies = await User.find({ role: "company" }).select("-password");
      res.status(200).json({
          success: true,
          data: companies,
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: error.message,
      });
  }
});


// Récupérer toutes les stations d'une compagnie
router.get("/get-company-stations", authMiddleware, async (req, res) => {
    try {
      const companyId = req.user.userId;
  
      // Vérifier si l'utilisateur est bien une compagnie
      const company = await User.findById(companyId);
      if (!company || company.role !== "company") {
        return res.status(403).send({ success: false, message: "Accès refusé." });
      }
  
      // Récupérer les stations appartenant à la compagnie
      const stations = await Station.find({ company: companyId });
  
      return res.status(200).send({ success: true, message: "Stations récupérées avec succès", data: stations });
    } catch (error) {
      res.status(500).send({ success: false, message: error.message });
    }
  });
  

  // Nouvelle route pour obtenir les revenus par jour sur les 7 derniers jours
router.get("/get-bookings-per-day", authMiddleware, async (req, res) => {
    try {
      const companyId = req.user.userId;
  
      const bookings = await Booking.find({ company: companyId });
      
      const bookingsPerDay = {};
  
      bookings.forEach(booking => {
        const date = new Date(booking.createdAt).toISOString().split('T')[0];
        bookingsPerDay[date] = (bookingsPerDay[date] || 0) + booking.seats.length;
      });
  
      res.send({
        success: true,
        data: bookingsPerDay,
      });
  
    } catch (error) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  });
  
  
router.get("/comments/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;

    // 1. Récupérer tous les trips de cette compagnie
    const trips = await Trip.find({ company: companyId }).select("_id");

    // Extraire les ids des trips
    const tripIds = trips.map(t => t._id);

    // 2. Trouver tous les commentaires liés à ces trips
    const comments = await Comment.find({ trip: { $in: tripIds } })
      .populate("user", "name")
      .populate({
        path: "trip",
        select: "from to date departureTime"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.error("Erreur récupération commentaires compagnie :", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});


  
  

module.exports = router;