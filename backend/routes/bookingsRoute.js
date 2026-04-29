const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const bookingController = require("../controllers/bookingController");

router.post("/lock-seat", authMiddleware, bookingController.lockSeat);
router.post("/book-seat", authMiddleware, bookingController.bookSeat);
router.post("/cancel-booking", authMiddleware, bookingController.cancelBooking);
router.post("/get-bookings", authMiddleware, bookingController.getUserBookings);
router.get(
  "/get-company-bookings",
  authMiddleware,
  requireRole("company"),
  bookingController.getCompanyBookings
);
router.get(
  "/get-all-bookings",
  authMiddleware,
  requireRole("admin"),
  bookingController.getAllBookings
);

module.exports = router;
