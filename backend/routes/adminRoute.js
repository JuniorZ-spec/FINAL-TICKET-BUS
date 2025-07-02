const router = require("express").Router();
const User = require("../models/usersModel");
const Bus = require("../models/busesModel");
const Station = require("../models/stationsModel");
const Trip = require("../models/tripsModel");
const Booking = require("../models/bookingsModel");
const authMiddleware = require("../middlewares/authMiddleware");
const bcrypt = require("bcrypt");



// Créer une compagnie (réservé aux admins)
router.post("/create-company", authMiddleware, async (req, res) => {
    try {
        // 1. Extraction SÉCURISÉE des valeurs
        const { email, password, companyName } = req.body || {};

        
        if (!email || !password || !companyName) {
            console.log("Données reçues:", req.body); // Debug
            return res.status(400).json({
                success: false,
                message: "Tous les champs sont requis",
                requiredFields: ["email", "password", "companyName"],
                receivedFields: Object.keys(req.body || {})
            });
        }

        // 3. Vérification unicité
        const existingCompany = await User.findOne({ 
            $or: [{ email }, { companyName }] 
        });
        
        if (existingCompany) {
            const conflictField = existingCompany.email === email ? "email" : "companyName";
            return res.status(409).json({
                success: false,
                message: `${conflictField} déjà utilisé`,
                conflictField
            });
        }

        // 4. Création
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCompany = new User({
            email,
            password: hashedPassword,
            companyName,
            role: "company",
        });
        
        const savedCompany = await newCompany.save();

        // 5. Réponse COMPLÈTE
        res.status(201).json({
            message: "Compagnie créée avec succès",
            success: true,
            data: savedCompany // Envoie tout l'objet créé
        });

    } catch (error) {
        console.error("ERREUR SERVEUR:", {
            message: error.message,
            stack: error.stack,
            bodyReceived: req.body
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            debug: error.message,
            success: false
        });
    }
});

router.get("/company-stats", authMiddleware, async (req, res) => {
  try {
    // Récupérer toutes les compagnies
    const companies = await User.find({ role: "company" });

    const stats = await Promise.all(
      companies.map(async (company) => {
        // Récupérer les trajets de la compagnie
        const trips = await Trip.find({ company: company._id });
        const tripIds = trips.map(trip => trip._id);

        // Récupérer les réservations liées à ces trajets
        const bookings = await Booking.find({ trip: { $in: tripIds } });

        const tripsCount = trips.length;
        const stationsCount = await Station.countDocuments({ company: company._id });
        const reservationsCount = bookings.length;

        // Calcul du revenu total
        const totalRevenue = bookings.reduce((sum, booking) => {
          const trip = trips.find(t => t._id.toString() === booking.trip.toString());
          return sum + (trip ? trip.price * booking.seats.length : 0);
        }, 0);

        return {
          companyName: company.companyName,
          tripsCount,
          stationsCount,
          reservationsCount,
          totalRevenue,
        };
      })
    );

    res.send({ success: true, data: stats });
  } catch (error) {
    console.error("Erreur dans /company-stats :", error);
    res.status(500).send({
      success: false,
      message: "Erreur lors de la récupération des statistiques.",
    });
  }
});





router.get("/get-companies-revenue", authMiddleware, async (req, res) => {
    try {
      const companies = await User.find({ role: "company" });
  
      const revenues = await Promise.all(
        companies.map(async (company) => {
          const bookings = await Booking.find({ company: company._id });
          const trips = await Trip.find({ company: company._id });
  
          const totalRevenue = bookings.reduce((acc, booking) => {
            const trip = trips.find(t => t._id.toString() === booking.trip.toString());
            return acc + (trip ? trip.price * booking.seats.length : 0);
          }, 0);
  
          return {
            companyName: company.companyName || "Nom de compagnie non défini",
            revenue: totalRevenue,
          };
        })
      );
  
      revenues.sort((a, b) => b.revenue - a.revenue);
  
      res.status(200).send({
        success: true,
        data: revenues,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Erreur lors de la récupération des revenus des compagnies",
        error: error.message,
      });
    }
  });
  
  
  

// Récupérer tous les utilisateurs (admin seulement)
// Changez de GET à POST dans le backend
router.post("/get-all-users", authMiddleware, async (req, res) => {
    try {
        // Utilisez req.user.userId (déjà vérifié par le authMiddleware)
        const adminUser = await User.findById(req.user.userId);
        
        if (!adminUser || adminUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Accès refusé : droits admin requis",
                debug: {
                    userId: req.user.userId,
                    userRole: adminUser?.role
                }
            });
        }

        const users = await User.find({ role: 'user' }).select('-password');
        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


router.get("/get-dashboard-stats", authMiddleware, async (req, res) => {
    try {
      // Compter le nombre de compagnies
      const companies = await User.find({ role: "company" });
      const companiesCount = companies.length;
  
      // Tous les trajets
      const trips = await Trip.find();
      const tripsCount = trips.length;
  
      // Toutes les réservations
      const bookings = await Booking.find();
      const reservationsCount = bookings.length;
  
      // Calcul total du revenu
      let totalRevenue = 0;
      bookings.forEach(booking => {
        const trip = trips.find(t => t._id.toString() === booking.trip.toString());
        if (trip) {
          totalRevenue += trip.price * booking.seats.length;
        }
      });
  
      // Pour popularTrips
      const popularTripsAggregation = await Booking.aggregate([
        {
          $group: {
            _id: "$trip",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
  
      const popularTrips = await Promise.all(
        popularTripsAggregation.map(async (item) => {
          const trip = await Trip.findById(item._id);
          return { trip, count: item.count };
        })
      );
  
      res.status(200).send({
        success: true,
        data: {
          companiesCount,
          tripsCount,
          reservationsCount,
          totalRevenue,
          popularTrips,
        },
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
  
  





// Bloquer/Débloquer un utilisateur (admin seulement)
router.post("/delete-company", authMiddleware, async (req, res) => {
    try {
      const { companyId } = req.body;
  
      // Cherche la compagnie par ID
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Compagnie non trouvée",
        });
      }
  
      // Supprime la compagnie
      await Company.findByIdAndDelete(companyId);
  
      res.status(200).json({
        success: true,
        message: "Compagnie supprimée avec succès",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
  
  
  

// Supprimer un utilisateur (admin seulement)
router.post("/delete-user", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.body.userId);
        if (!adminUser || adminUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Accès refusé : droits admin requis",
            });
        }

        const { userId } = req.body;
        await User.findByIdAndDelete(userId);
        res.status(200).json({
            success: true,
            message: "Utilisateur supprimé",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Récupérer toutes les compagnies (admin seulement)
router.get("/get-all-companies", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.userId);
        if (!adminUser || adminUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Accès refusé : droits admin requis",
            });
        }

        const companies = await User.find({ role: "company" });
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


// ✅ Récupérer toutes les gares
router.get("/get-all-stations", authMiddleware, async (req, res) => {
    try {
        const stations = await Station.find(); // Assure-toi que `Station` est bien défini dans tes modèles
        res.status(200).json({ success: true, data: stations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



module.exports = router;