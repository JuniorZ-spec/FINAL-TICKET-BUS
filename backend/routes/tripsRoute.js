const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const tripController = require("../controllers/tripController");

router.post("/add-trip", authMiddleware, requireRole("company"), tripController.addTrip);
router.get("/get-all-trips", tripController.getAllTrips);
router.post("/get-trip-by-id", tripController.getTripById);
router.put("/update-trip/:id", authMiddleware, requireRole("company"), tripController.updateTrip);
router.delete(
  "/delete-trip/:id",
  authMiddleware,
  requireRole("company"),
  tripController.deleteTrip
);

module.exports = router;
