const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashedPassword, name, phone, address, role: "USER" },
    });

    res.status(201).json({ success: true, message: "Compte créé avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ success: false, message: "Votre compte est bloqué, contactez l'administrateur" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role.toLowerCase() },
      process.env.jwt_secret,
      { expiresIn: "1d" }
    );

    res.status(200).json({ success: true, message: "Connexion réussie", data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        isBlocked: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mot de passe actuel incorrect" });
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    res.status(200).json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Aucun compte associé à cet email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: new Date(Date.now() + 3600000),
      },
    });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Benin Ticket" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Réinitialisation du mot de passe",
      html: `<p>Bonjour,</p>
             <p>Cliquez ici pour réinitialiser votre mot de passe : <a href="${resetURL}">Réinitialiser</a></p>
             <p>Ce lien est valable pendant 1 heure.</p>`,
    });

    res.status(200).json({ success: true, message: "Lien de réinitialisation envoyé" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Lien invalide ou expiré" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(req.body.password, 10),
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
