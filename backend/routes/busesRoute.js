const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const busController = require("../controllers/busController");

const companyAuth = [authMiddleware, requireRole("company")];

router.post("/get-buses-company", ...companyAuth, busController.getCompanyBuses);
router.get("/get-all-buses", ...companyAuth, busController.getCompanyBuses);
router.post("/add-bus", ...companyAuth, busController.addBus);
router.post("/update-bus", ...companyAuth, busController.updateBus);
router.post("/delete-bus", ...companyAuth, busController.deleteBus);
router.post("/get-bus-by-id", authMiddleware, busController.getBusById);

module.exports = router;
