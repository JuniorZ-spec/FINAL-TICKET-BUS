const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const companyController = require("../controllers/companyController");

const companyAuth = [authMiddleware, requireRole("COMPANY_MEMBER")];

router.get("/get-company-info", ...companyAuth, companyController.getCompanyInfo);
router.get("/get-company-trips", ...companyAuth, companyController.getCompanyTrips);
router.get("/get-dashboard-stats", ...companyAuth, companyController.getDashboardStats);
router.get("/get-all-companies", authMiddleware, companyController.getAllCompanies);
router.get("/get-company-stations", ...companyAuth, companyController.getCompanyStations);
router.get("/get-bookings-per-day", ...companyAuth, companyController.getBookingsPerDay);
router.get("/get-lignes", ...companyAuth, companyController.getLignes);
router.post("/create-ligne", ...companyAuth, companyController.createLigne);
router.put("/update-ligne/:id", ...companyAuth, companyController.updateLigne);
router.delete("/delete-ligne/:id", ...companyAuth, companyController.deleteLigne);
router.post("/apply", companyController.applyForPartnership);

module.exports = router;
