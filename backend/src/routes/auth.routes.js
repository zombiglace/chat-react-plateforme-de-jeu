const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, BanList } = require("../config/db");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    ""
  );
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Champs manquants" });

    const ip = getIp(req);

    // 🚫 Vérifie ban par email OU IP
    const banHit = await BanList.findOne({
      where: { [Op.or]: [{ email }, { ip }] },
    });
    if (banHit) {
      return res.status(403).json({
        message: "🚫 Tu es banni de cette plateforme. Contacte un admin.",
      });
    }

    const exists = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (exists)
      return res.status(400).json({ message: "Utilisateur déjà existant" });

    const hash = await bcrypt.hash(password, 10);
    const count = await User.count();
    const role = count === 0 ? "admin" : "membre";

    const user = await User.create({
      username,
      email,
      password: hash,
      role,
      registrationIp: ip,
    });

    res.json({
      token: sign(user.id),
      user: { id: user.id, username, email, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ message: "Identifiants invalides" });

    // 🚫 Bloque si banni
    if (user.banned) {
      return res.status(403).json({
        message: `🚫 Tu es banni : ${user.bannedReason}`,
      });
    }

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
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
