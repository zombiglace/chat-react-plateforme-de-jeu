const jwt = require("jsonwebtoken");
const { User } = require("../config/db");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Non authentifié" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user)
      return res.status(401).json({ message: "Utilisateur introuvable" });
    if (user.banned)
      return res
        .status(403)
        .json({ message: `🚫 Banni : ${user.bannedReason || ""}` });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Accès admin requis" });
  next();
};
