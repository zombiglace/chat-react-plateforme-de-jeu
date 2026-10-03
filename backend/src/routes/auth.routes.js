const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { User, BanList } = require("../config/db");
const { sendVerificationEmail } = require("../utils/email");

const ALLOWED_EMAIL = /@(gmail|hotmail|outlook)\.(com|fr)$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    ""
  );
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

// ═══════════════════════════════════════════════════════════════
//  REGISTER
// ═══════════════════════════════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    )
      return res.status(400).json({ message: "Champs invalides" });

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30)
      return res
        .status(400)
        .json({ message: "Le pseudo doit faire entre 3 et 30 caractères" });

    if (!EMAIL_REGEX.test(cleanEmail))
      return res.status(400).json({ message: "Format d'email invalide" });

    if (!ALLOWED_EMAIL.test(cleanEmail))
      return res
        .status(400)
        .json({ message: "Utilise Gmail, Hotmail ou Outlook" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Le mot de passe doit faire au moins 6 caractères" });

    const ip = getIp(req);

    // Ban
    const banHit = await BanList.findOne({
      where: { [Op.or]: [{ email: cleanEmail }, { ip }] },
    });
    if (banHit)
      return res
        .status(403)
        .json({ message: "🚫 Tu es banni de cette plateforme." });

    // Existence
    const existsEmail = await User.findOne({ where: { email: cleanEmail } });
    if (existsEmail)
      return res.status(400).json({ message: "Cet email est déjà utilisé" });

    const existsUser = await User.findOne({
      where: { username: cleanUsername },
    });
    if (existsUser)
      return res.status(400).json({ message: "Ce pseudo est déjà pris" });

    // Création
    const hash = await bcrypt.hash(password, 10);
    const count = await User.count();
    const role = count === 0 ? "admin" : "membre";

    const token = generateToken();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    let user;
    try {
      user = await User.create({
        username: cleanUsername,
        email: cleanEmail,
        password: hash,
        role,
        registrationIp: ip,
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      });
    } catch (err) {
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

    // Le tout premier user (admin) est auto-vérifié
    if (role === "admin") {
      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
      console.log(`✅ [register] Admin auto-vérifié : ${cleanEmail}`);
      return res.json({
        message: "Compte admin créé, tu peux te connecter.",
        needsVerification: false,
        token: sign(user.id),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Envoi de l'email
    try {
      await sendVerificationEmail({
        to: cleanEmail,
        username: cleanUsername,
        token,
      });
    } catch (mailErr) {
      console.error("[register] Erreur envoi email :", mailErr.message);
    }

    console.log(`✅ [register] Nouveau compte (non vérifié) : ${cleanEmail}`);

    res.json({
      message:
        "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.",
      needsVerification: true,
    });
  } catch (e) {
    console.error("[register] ERREUR:", {
      name: e.name,
      message: e.message,
      stack: e.stack?.split("\n").slice(0, 3).join("\n"),
    });
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

    if (!cleanEmail) return res.status(400).json({ message: "Email requis" });
    if (!password)
      return res.status(400).json({ message: "Mot de passe requis" });

    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      console.log(`❌ [login] Email inexistant : ${cleanEmail}`);
      return res.status(401).json({
        message: "Aucun compte n'existe avec cet email",
        code: "EMAIL_NOT_FOUND",
      });
    }

    if (user.banned) {
      console.log(`🚫 [login] Banni : ${cleanEmail}`);
      return res.status(403).json({
        message: `🚫 Tu es banni : ${user.bannedReason || "sans raison"}`,
        code: "BANNED",
      });
    }

    if (!user.emailVerified) {
      console.log(`⏳ [login] Email non vérifié : ${cleanEmail}`);
      return res.status(403).json({
        message:
          "Confirme ton adresse email avant de te connecter. Vérifie ta boîte mail.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log(`❌ [login] Mauvais mot de passe pour : ${cleanEmail}`);
      return res.status(401).json({
        message: "Mot de passe incorrect",
        code: "WRONG_PASSWORD",
      });
    }

    console.log(`✅ [login] Succès : ${cleanEmail} (id ${user.id})`);

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
    console.error("[login] ERREUR:", {
      name: e.name,
      message: e.message,
      stack: e.stack?.split("\n").slice(0, 3).join("\n"),
    });
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  VÉRIFIER EMAIL
// ═══════════════════════════════════════════════════════════════
router.post("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== "string" || token.length !== 64)
      return res.status(400).json({
        message: "Lien invalide",
        code: "INVALID_TOKEN",
      });

    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user)
      return res.status(400).json({
        message: "Ce lien est invalide ou a déjà été utilisé",
        code: "INVALID_TOKEN",
      });

    if (user.emailVerified)
      return res.json({
        ok: true,
        message: "Ton email est déjà confirmé. Tu peux te connecter.",
      });

    if (
      user.emailVerificationExpires &&
      new Date(user.emailVerificationExpires) < new Date()
    ) {
      return res.status(400).json({
        message: "Ce lien a expiré. Demande un nouveau lien.",
        code: "TOKEN_EXPIRED",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log(`✅ [verify-email] Confirmé : ${user.email}`);

    res.json({
      ok: true,
      message: "Email confirmé ! Tu peux maintenant te connecter.",
    });
  } catch (e) {
    console.error("[verify-email] ERREUR:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  RENVOYER EMAIL DE VÉRIFICATION
// ═══════════════════════════════════════════════════════════════
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string")
      return res.status(400).json({ message: "Email requis" });

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user || user.emailVerified) {
      return res.json({
        ok: true,
        message:
          "Si un compte non vérifié existe avec cet email, un nouveau lien vient d'être envoyé.",
      });
    }

    const token = generateToken();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    try {
      await sendVerificationEmail({
        to: cleanEmail,
        username: user.username,
        token,
      });
    } catch (mailErr) {
      console.error("[resend-verification] Erreur email :", mailErr.message);
      return res.status(500).json({
        message:
          "Impossible d'envoyer l'email pour le moment. Réessaie plus tard.",
      });
    }

    console.log(`📧 [resend-verification] Nouveau lien pour : ${cleanEmail}`);

    res.json({
      ok: true,
      message: "Un nouveau lien de confirmation vient d'être envoyé.",
    });
  } catch (e) {
    console.error("[resend-verification] ERREUR:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
