const requireRole = (...userTypes: string[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Non authentifié" });
    }
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }
    next();
  };
};

module.exports = requireRole;
