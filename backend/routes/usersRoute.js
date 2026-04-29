const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/get-user-by-id", authMiddleware, authController.getUserById);
router.post("/change-password", authMiddleware, authController.changePassword);
router.post("/send-reset-password-email", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
