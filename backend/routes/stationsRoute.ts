const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const stationController = require("../controllers/stationController");

router.post("/add-station", authMiddleware, requireRole("company"), stationController.addStation);
router.get("/get-all-stations", stationController.getAllStations);
router.get("/get-station/:id", stationController.getStationById);
router.put("/update-station/:id", authMiddleware, stationController.updateStation);
router.delete("/delete-station/:id", authMiddleware, stationController.deleteStation);

module.exports = router;
