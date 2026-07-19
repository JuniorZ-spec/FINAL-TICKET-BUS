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
router.post("/apply", companyController.applyForPartnership);

module.exports = router;
