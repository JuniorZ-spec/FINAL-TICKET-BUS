const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const bookingController = require("../controllers/bookingController");

router.post("/lock-seat", authMiddleware, bookingController.lockSeat);
router.post("/book-seat", authMiddleware, bookingController.bookSeat);
router.get(
  "/requests/:id",
  authMiddleware,
  bookingController.getBookingRequestStatus
);
router.post("/cancel-booking", authMiddleware, bookingController.cancelBooking);
router.post("/get-bookings", authMiddleware, bookingController.getUserBookings);
router.get(
  "/get-company-bookings",
  authMiddleware,
  requireRole("COMPANY_MEMBER"),
  bookingController.getCompanyBookings
);
router.get(
  "/get-all-bookings",
  authMiddleware,
  requireRole("ADMIN"),
  bookingController.getAllBookings
);

module.exports = router;
