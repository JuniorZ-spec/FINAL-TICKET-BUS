const router = require("express").Router();
const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const nodemailer = require('nodemailer');
const crypto = require('crypto');



// Inscription des utilisateurs
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        message: "User already exists",
        success: false,
        data: null,
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      address,
      role: "user", // Rôle par défaut
    });
    await newUser.save();

    res.status(201).send({
      message: "Utilisateur créé avec succès",
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("Error in /register route:", error);
    res.status(500).send({
      message: "Erreur interne du serveur",
      success: false,
      data: null,
    });
  }
});




router.post("/login", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (!userExists) {
      return res.send({
        message: "User does not exist",
        success: false,
        data: null,
      });
    }

    // Empêcher les compagnies de se connecter via cette route
    if (userExists.role === 'company') {
      return res.send({
        message: "Companies must use the company login portal",
        success: false,
        data: null,
      });
    }

    if (userExists.isBlocked) {
      return res.send({
        message: "Your account is blocked , please contact admin",
        success: false,
        data: null,
      });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      userExists.password
    );

    if (!passwordMatch) {
      return res.send({
        message: "Incorrect password",
        success: false,
        data: null,
      });
    }

    const token = jwt.sign(
      { userId: userExists._id, role: userExists.role },
      process.env.jwt_secret,
      { expiresIn: "1d" }
    );


    res.send({
      message: "User logged in successfully",
      success: true,
      data: token,
    });
  } catch (error) {
    res.send({
      message: error.message,
      success: false,
      data: null,
    });
  }
});





router.post("/get-user-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).send({
      success: true,
      message: "Utilisateur récupéré avec succès",
      data: user,
    });
  } catch (error) {
    console.error("Erreur get-user-by-id:", error);
    res.status(500).send({
      success: false,
      message: "Erreur serveur",
    });
  }
});

router.post("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.body.userId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès refusé : droits admin requis",
      });
    }

    // ⚠️ Modification ici : Récupère SEULEMENT les users simples
    const users = await User.find({ role: 'user' }).select('-password');

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Changer le mot de passe
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({
        message: "Utilisateur non trouvé",
        success: false,
      });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).send({
        message: "Mot de passe actuel incorrect",
        success: false,
      });
    }

    // Hacher et mettre à jour le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send({
      message: "Mot de passe modifié avec succès",
      success: true,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du mot de passe :", error);
    res.status(500).send({
      message: "Erreur interne du serveur",
      success: false,
    });
  }
});






router.post('/send-reset-password-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.send({ success: false, message: "Utilisateur introuvable" });

    // Créer un token temporaire
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1h
    await user.save();

    // Envoie email
    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;



    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Benin Ticket" <${process.env.EMAIL}>`,
      to: user.email,
      subject: 'Réinitialisation du mot de passe',
      html: `<p>Bonjour ,</p>
      <p>Voici le lien pour réinitialiser votre mot de passe : <a href="${resetURL}">Réinitialiser</a></p>
      <p>Ce lien est valable pendant 1 heure.</p>`,
    });

    res.send({ success: true, message: 'Lien de réinitialisation envoyé par mail' });
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: 'Erreur serveur' });
  }
});



router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.send({ success: false, message: 'Lien invalide ou expiré' });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.send({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: 'Erreur serveur' });
  }
});





module.exports = router;