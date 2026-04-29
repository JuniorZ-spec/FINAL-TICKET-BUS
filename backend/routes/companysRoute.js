const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const companyController = require("../controllers/companyController");

const companyAuth = [authMiddleware, requireRole("company")];

router.post("/login", companyController.login);
router.get("/get-company-info", ...companyAuth, companyController.getCompanyInfo);
router.post("/change-password", ...companyAuth, companyController.changePassword);
router.get("/get-company-trips", ...companyAuth, companyController.getCompanyTrips);
router.get("/get-dashboard-stats", ...companyAuth, companyController.getDashboardStats);
router.get("/get-all-companies", authMiddleware, companyController.getAllCompanies);
router.get("/get-company-stations", ...companyAuth, companyController.getCompanyStations);
router.get("/get-bookings-per-day", ...companyAuth, companyController.getBookingsPerDay);

module.exports = router;
