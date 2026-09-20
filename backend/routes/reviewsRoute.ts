const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const reviewController = require("../controllers/reviewController");

router.post("/create", authMiddleware, reviewController.createReview);
router.get("/get-all", reviewController.getAllReviews);

module.exports = router;
