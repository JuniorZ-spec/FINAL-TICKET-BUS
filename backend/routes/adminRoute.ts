const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const adminController = require("../controllers/adminController");

const auth = [authMiddleware, requireRole("ADMIN")];

router.post("/create-company", ...auth, adminController.createCompany);
router.get("/get-all-companies", ...auth, adminController.getAllCompanies);
router.post("/get-all-users", ...auth, adminController.getAllUsers);
router.post("/delete-company", ...auth, adminController.deleteCompany);
router.post("/delete-user", ...auth, adminController.deleteUser);
router.get("/get-dashboard-stats", ...auth, adminController.getDashboardStats);
router.get("/company-stats", ...auth, adminController.getCompanyStats);
router.get("/get-companies-revenue", ...auth, adminController.getCompaniesRevenue);
router.get("/get-bookings-per-company", ...auth, adminController.getBookingsPerCompany);
router.get("/get-bookings-per-day", ...auth, adminController.getBookingsPerDay);
router.get("/get-all-stations", ...auth, adminController.getAllStations);
router.post("/update-user-permissions", ...auth, adminController.updateUserPermissions);
router.get("/get-companies-reservations", ...auth, adminController.getCompaniesReservations);

module.exports = router;
