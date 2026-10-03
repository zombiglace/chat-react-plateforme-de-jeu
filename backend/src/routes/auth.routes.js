const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, BanList } = require("../config/db");

const ALLOWED_EMAIL = /@(gmail|hotmail|outlook)\.(com|fr)$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    ""
  );
}

// ═══════════════════════════════════════════════════════════════
//  REGISTER
// ═══════════════════════════════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ─── 1. Validation stricte des types ───
    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string")
      return res.status(400).json({ message: "Champs invalides" });

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase(); // 🔑 LA clé du fix

    if (cleanUsername.length < 3 || cleanUsername.length > 30)
      return res.status(400).json({ message: "Pseudo : 3 à 30 caractères" });

    if (!EMAIL_REGEX.test(cleanEmail))
      return res.status(400).json({ message: "Format d'email invalide" });

    if (!ALLOWED_EMAIL.test(cleanEmail))
      return res.status(400).json({ message: "Utilise Gmail, Hotmail ou Outlook" });

    if (password.length < 6)
      return res.status(400).json({ message: "Mot de passe : 6 caractères min" });

    const ip = getIp(req);

    // ─── 2. Ban par email OU IP ───
    const banHit = await BanList.findOne({
      where: { [Op.or]: [{ email: cleanEmail }, { ip }] },
    });
    if (banHit)
      return res.status(403).json({ message: "🚫 Tu es banni de cette plateforme." });

    // ─── 3. Vérif existence (email normalisé) ───
    const existsEmail = await User.findOne({ where: { email: cleanEmail } });
    if (existsEmail)
      return res.status(400).json({ message: "Cet email est déjà utilisé" });

    const existsUser = await User.findOne({ where: { username: cleanUsername } });
    if (existsUser)
      return res.status(400).json({ message: "Ce pseudo est déjà pris" });

    // ─── 4. Création ───
    const hash = await bcrypt.hash(password, 10);
    const count = await User.count();
    const role = count === 0 ? "admin" : "membre";

    let user;
    try {
      user = await User.create({
        username: cleanUsername,
        email: cleanEmail,
        password: hash,
        role,
        registrationIp: ip,
      });
    } catch (err) {
      // Filet de sécurité : race condition ou contrainte UNIQUE
      if (err.name === "SequelizeUniqueConstraintError") {
        const field = err.errors?.[0]?.path;
        return res.status(400).json({
          message:
            field === "email"
              ? "Cet email est déjà utilisé"
              : "Ce pseudo est déjà pris",
        });
      }
      throw err;
    }

    res.json({
      token: sign(user.id),
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("[register]", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string")
      return res.status(400).json({ message: "Champs invalides" });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) return res.status(400).json({ message: "Identifiants invalides" });

    if (user.banned)
      return res
        .status(403)
        .json({ message: `🚫 Tu es banni : ${user.bannedReason || ""}` });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Identifiants invalides" });

    res.json({
      token: sign(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("[login]", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
