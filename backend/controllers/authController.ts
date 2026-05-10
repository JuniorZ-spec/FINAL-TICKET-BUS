const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signAccessToken(payload: object): string {
  return jwt.sign(payload, process.env.jwt_secret, { expiresIn: ACCESS_TOKEN_TTL });
}

async function createSession(userId: string, req: any): Promise<string> {
  const refreshToken = crypto.randomBytes(40).toString("hex");
  await prisma.userSession.create({
    data: {
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    },
  });
  return refreshToken;
}

exports.registerTraveler = async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email et mot de passe requis" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        userType: "TRAVELER",
        status: "ACTIVE",
        travelerProfile: {
          create: { name: name ?? null, phone: phone ?? null, address: address ?? null },
        },
      },
    });
    res.status(201).json({ success: true, message: "Compte créé avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.loginTraveler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.userType !== "TRAVELER") {
      return res.status(400).json({ success: false, message: "Identifiants invalides" });
    }
    if (user.status === "SUSPENDED") {
      return res.status(403).json({ success: false, message: "Compte suspendu, contactez l'administrateur" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Identifiants invalides" });
    }
    const accessToken = signAccessToken({ userId: user.id, userType: user.userType });
    const refreshToken = await createSession(user.id, req);
    res.status(200).json({ success: true, message: "Connexion réussie", data: { accessToken, refreshToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.loginCompanyMember = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companyMember: {
          include: { company: { select: { id: true, companyName: true, isBlocked: true } } },
        },
      },
    });
    if (!user || user.userType !== "COMPANY_MEMBER" || !user.companyMember) {
      return res.status(400).json({ success: false, message: "Identifiants invalides" });
    }
    if (user.status === "SUSPENDED") {
      return res.status(403).json({ success: false, message: "Compte suspendu, contactez l'administrateur" });
    }
    if (user.companyMember.company.isBlocked) {
      return res.status(403).json({ success: false, message: "Compagnie bloquée, contactez l'administrateur" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Identifiants invalides" });
    }
    const companyId = user.companyMember.companyId;
    const accessToken = signAccessToken({ userId: user.id, userType: user.userType, companyId });
    const refreshToken = await createSession(user.id, req);
    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: {
        accessToken,
        refreshToken,
        company: { id: user.companyMember.company.id, companyName: user.companyMember.company.companyName },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.userType !== "ADMIN") {
      return res.status(400).json({ success: false, message: "Identifiants invalides" });
    }
    if (user.status === "SUSPENDED") {
      return res.status(403).json({ success: false, message: "Compte suspendu" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Identifiants invalides" });
    }
    const accessToken = signAccessToken({ userId: user.id, userType: user.userType });
    const refreshToken = await createSession(user.id, req);
    res.status(200).json({ success: true, message: "Connexion réussie", data: { accessToken, refreshToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token requis" });
    }
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: { include: { companyMember: true } } },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.userSession.delete({ where: { id: session.id } });
      return res.status(401).json({ success: false, message: "Session expirée, veuillez vous reconnecter" });
    }
    const { user } = session;
    const payload: Record<string, any> = { userId: user.id, userType: user.userType };
    if (user.companyMember) payload.companyId = user.companyMember.companyId;
    const accessToken = signAccessToken(payload);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.userSession.deleteMany({ where: { refreshToken } });
    }
    res.status(200).json({ success: true, message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        status: true,
        createdAt: true,
        travelerProfile: true,
        companyMember: {
          include: { company: { select: { id: true, companyName: true, email: true } } },
        },
        adminProfile: true,
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
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
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
    // Short-lived JWT as reset token — no DB storage needed
    const resetToken = jwt.sign(
      { userId: user.id, purpose: "password-reset" },
      process.env.jwt_secret,
      { expiresIn: "1h" }
    );
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Benin Ticket" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Réinitialisation du mot de passe",
      html: `<p>Bonjour,</p><p>Cliquez ici pour réinitialiser votre mot de passe : <a href="${resetURL}">Réinitialiser</a></p><p>Ce lien est valable 1 heure.</p>`,
    });
    res.status(200).json({ success: true, message: "Lien de réinitialisation envoyé" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    let decoded: any;
    try {
      decoded = jwt.verify(req.params.token, process.env.jwt_secret);
    } catch {
      return res.status(400).json({ success: false, message: "Lien invalide ou expiré" });
    }
    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ success: false, message: "Token invalide" });
    }
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: await bcrypt.hash(req.body.password, 10) },
    });
    // Invalider toutes les sessions après reset
    await prisma.userSession.deleteMany({ where: { userId: decoded.userId } });
    res.status(200).json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
