const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

router.post("/register", authController.registerTraveler);
router.post("/login", authController.loginTraveler);
router.post("/login-company", authController.loginCompanyMember);
router.post("/login-admin", authController.loginAdmin);
router.post("/refresh", authController.refreshAccessToken);
router.post("/logout", authController.logout);
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/change-password", authMiddleware, authController.changePassword);
router.post("/send-reset-password-email", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
