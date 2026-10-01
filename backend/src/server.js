require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { Chess } = require("chess.js");

const { connectDB, User, Message, Room, Document, BanList } = require("./config/db");

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════
const ALLOWED_EMAIL = /@(gmail|hotmail|outlook)\.(com|fr)$/i;

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, credentials: true, methods: ["GET", "POST"] },
});

app.set("trust proxy", true);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ═══════════════════════════════════════════════════════════════
//  SÉCURITÉ
// ═══════════════════════════════════════════════════════════════
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Trop de tentatives, réessaye dans 15 min" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { message: "Trop de requêtes, ralentis un peu" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(express.json({ limit: "1mb" }));

// ═══════════════════════════════════════════════════════════════
//  UPLOADS
// ═══════════════════════════════════════════════════════════════
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/markdown", "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
];

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safe = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 100);
    cb(null, Date.now() + "-" + safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Type de fichier non autorisé"));
    }
    cb(null, true);
  },
});

app.use(
  "/uploads",
  express.static(uploadDir, {
    setHeaders: (res, filepath) => {
      if (filepath.endsWith(".html") || filepath.endsWith(".htm")) {
        res.setHeader("Content-Type", "text/plain");
      }
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

// ═══════════════════════════════════════════════════════════════
//  MIDDLEWARE AUTH
// ═══════════════════════════════════════════════════════════════
async function protect(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Non authentifié" });

    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findByPk(d.id, { attributes: { exclude: ["password"] } });
    if (!u) return res.status(401).json({ message: "Introuvable" });
    if (u.banned) return res.status(403).json({ message: "🚫 Banni" });

    req.user = u;
    next();
  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
}

const adminOnly = (req, res, next) =>
  req.user?.role === "admin" ? next() : res.status(403).json({ message: "Admin requis" });

// ═══════════════════════════════════════════════════════════════
//  HEALTH
// ═══════════════════════════════════════════════════════════════
app.get("/api/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "Champs manquants" });

    if (typeof username !== "string" || username.length < 3 || username.length > 30)
      return res.status(400).json({ message: "Le pseudo doit faire entre 3 et 30 caractères" });

    if (typeof email !== "string" || email.length > 100)
      return res.status(400).json({ message: "Email invalide" });

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return res.status(400).json({ message: "Format d'email invalide" });

    if (!ALLOWED_EMAIL.test(cleanEmail))
      return res.status(400).json({ message: "Utilise une adresse Gmail, Hotmail ou Outlook" });

    if (typeof password !== "string" || password.length < 6)
      return res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères" });

    if (await User.findOne({ where: { email: cleanEmail } }))
      return res.status(400).json({ message: "Email déjà utilisé" });
    if (await User.findOne({ where: { username } }))
      return res.status(400).json({ message: "Pseudo déjà utilisé" });
    if (await BanList.findOne({ where: { email: cleanEmail } }))
      return res.status(403).json({ message: "🚫 Banni" });

    const hash = await bcrypt.hash(password, 10);
    const count = await User.count();
    const role = count === 0 ? "admin" : "membre";
    const user = await User.create({ username, email: cleanEmail, password: hash, role });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username, email: cleanEmail, role } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Champs manquants" });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) return res.status(400).json({ message: "Identifiants invalides" });

    if (user.banned)
      return res.status(403).json({ message: `🚫 Banni : ${user.bannedReason || ""}` });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Identifiants invalides" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════
app.get("/api/users", protect, async (_, res) => {
  res.json(await User.findAll({ attributes: { exclude: ["password"] } }));
});
app.get("/api/users/me", protect, (req, res) => res.json(req.user));

app.get("/api/leaderboard", protect, async (_, res) => {
  const uno = await User.findAll({
    attributes: ["id", "username", "unoWins"],
    order: [["unoWins", "DESC"]],
    limit: 10,
  });
  const chess = await User.findAll({
    attributes: ["id", "username", "chessWins"],
    order: [["chessWins", "DESC"]],
    limit: 10,
  });
  res.json({ uno, chess });
});

// ═══════════════════════════════════════════════════════════════
//  ROOMS
// ═══════════════════════════════════════════════════════════════
app.get("/api/rooms", protect, async (_, res) => {
  let rooms = await Room.findAll({ order: [["id", "ASC"]] });
  if (rooms.length === 0) {
    await Room.create({ name: "general", description: "Salon principal" });
    rooms = await Room.findAll({ order: [["id", "ASC"]] });
  }
  res.json(rooms);
});

app.post("/api/rooms", protect, async (req, res) => {
  if (!req.body.name || typeof req.body.name !== "string")
    return res.status(400).json({ message: "Nom requis" });
  res.json(await Room.create({ name: req.body.name, createdById: req.user.id }));
});

// ═══════════════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════════════
app.get("/api/messages/room/:id", protect, async (req, res) => {
  res.json(
    await Message.findAll({
      where: { roomId: req.params.id },
      include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
      order: [["createdAt", "ASC"]],
      limit: 200,
    })
  );
});

app.get("/api/messages/private/:id", protect, async (req, res) => {
  const me = req.user.id;
  const other = req.params.id;
  res.json(
    await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: me, receiverId: other },
          { senderId: other, receiverId: me },
        ],
      },
      include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
      order: [["createdAt", "ASC"]],
    })
  );
});

// 🗑️ SUPPRIMER UN MESSAGE (propriétaire ou admin)
app.delete("/api/messages/:id", protect, async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable" });

    const isOwner = msg.senderId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Tu ne peux supprimer que tes messages" });

    const msgId = msg.id;
    const roomId = msg.roomId;
    const receiverId = msg.receiverId;

    await msg.destroy();

    // 📡 Broadcast temps réel
    if (roomId) {
      io.to(`r:${roomId}`).emit("message:deleted", { id: msgId, roomId });
    }
    if (receiverId) {
      io.emit("message:deleted", { id: msgId });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[messages delete]", e);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  DOCUMENTS
// ═══════════════════════════════════════════════════════════════
app.get("/api/documents", protect, async (_, res) => {
  res.json(
    await Document.findAll({
      include: [{ model: User, as: "uploadedBy", attributes: ["id", "username"] }],
      order: [
        ["pinned", "DESC"],
        ["createdAt", "DESC"],
      ],
    })
  );
});

app.post("/api/documents", protect, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "Aucun fichier" });

    try {
      const doc = await Document.create({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedById: req.user.id,
      });
      const full = await Document.findByPk(doc.id, {
        include: [{ model: User, as: "uploadedBy", attributes: ["id", "username"] }],
      });
      res.json(full);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
});

// 📌 Épingler / désépingler (admin uniquement)
app.post("/api/documents/:id/pin", protect, adminOnly, async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: "Introuvable" });

    doc.pinned = !doc.pinned;
    await doc.save();

    io.emit("document:updated", { id: doc.id, pinned: doc.pinned });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete("/api/documents/:id", protect, async (req, res) => {
  const d = await Document.findByPk(req.params.id);
  if (!d) return res.status(404).json({ message: "Introuvable" });
  if (req.user.role !== "admin" && d.uploadedById !== req.user.id)
    return res.status(403).json({ message: "Non autorisé" });

  try {
    const filePath = path.join(uploadDir, path.basename(d.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn("[documents] fichier absent :", e.message);
  }

  await d.destroy();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
//  MES DONNÉES (RGPD)
// ═══════════════════════════════════════════════════════════════
app.get("/api/me/export", protect, async (req, res) => {
  try {
    const me = await User.findByPk(req.user.id, { attributes: { exclude: ["password"] } });

    const myMessages = await Message.findAll({
      where: { senderId: req.user.id, roomId: { [Op.ne]: null } },
      attributes: ["id", "content", "roomId", "createdAt"],
      order: [["createdAt", "ASC"]],
    });

    const myPrivateMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: { [Op.ne]: null } },
          { receiverId: req.user.id },
        ],
      },
      include: [
        { model: User, as: "sender", attributes: ["id", "username"] },
        { model: User, as: "receiver", attributes: ["id", "username"] },
      ],
      order: [["createdAt", "ASC"]],
    });

    const myDocuments = await Document.findAll({
      where: { uploadedById: req.user.id },
      attributes: ["id", "name", "url", "size", "mimetype", "createdAt"],
    });

    const myRooms = await Room.findAll({
      where: { createdById: req.user.id },
      attributes: ["id", "name", "description", "createdAt"],
    });

    const myBans = await BanList.findAll({
      where: { email: me.email },
      attributes: ["reason", "createdAt"],
    });

    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        rgpd_article: "Article 15 et 20 du RGPD",
        format: "JSON",
        version: "1.0",
      },
      account: {
        id: me.id, username: me.username, email: me.email, role: me.role,
        created_at: me.createdAt, updated_at: me.updatedAt,
        uno_wins: me.unoWins, chess_wins: me.chessWins,
        muted: me.muted, muted_reason: me.mutedReason || null, muted_until: me.mutedUntil || null,
        banned: me.banned, banned_reason: me.bannedReason || null,
      },
      public_messages: myMessages.map((m) => ({
        id: m.id, room_id: m.roomId, content: m.content, sent_at: m.createdAt,
      })),
      private_messages: myPrivateMessages.map((m) => ({
        id: m.id, sender: m.sender?.username || "?", receiver: m.receiver?.username || "?",
        content: m.content, sent_at: m.createdAt,
      })),
      documents: myDocuments.map((d) => ({
        id: d.id, name: d.name, url: d.url, size_bytes: d.size,
        type: d.mimetype, uploaded_at: d.createdAt,
      })),
      rooms_created: myRooms.map((r) => ({
        id: r.id, name: r.name, description: r.description, created_at: r.createdAt,
      })),
      ban_history: myBans.map((b) => ({ reason: b.reason, date: b.createdAt })),
    };

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="mes-donnees-${me.username}-${Date.now()}.json"`
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(exportData);
  } catch (e) {
    console.error("[RGPD export]", e);
    res.status(500).json({ message: "Erreur lors de l'export" });
  }
});

app.put("/api/me/update", protect, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const me = await User.findByPk(req.user.id);
    if (!me) return res.status(404).json({ message: "Compte introuvable" });

    const wantsPasswordChange = newPassword && newPassword.length > 0;
    const wantsEmailChange = email && email !== me.email;
    const wantsUsernameChange = username && username !== me.username;

    if ((wantsPasswordChange || wantsEmailChange || wantsUsernameChange) && !currentPassword) {
      return res.status(400).json({ message: "Mot de passe actuel requis" });
    }

    if (currentPassword) {
      const ok = await bcrypt.compare(currentPassword, me.password);
      if (!ok) return res.status(400).json({ message: "Mot de passe actuel incorrect" });
    }

    if (wantsUsernameChange) {
      if (username.length < 3 || username.length > 30)
        return res.status(400).json({ message: "Le pseudo doit faire entre 3 et 30 caractères" });
      const exists = await User.findOne({ where: { username } });
      if (exists) return res.status(400).json({ message: "Ce pseudo est déjà pris" });
      me.username = username;
    }

    if (wantsEmailChange) {
      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
        return res.status(400).json({ message: "Format d'email invalide" });
      if (!ALLOWED_EMAIL.test(cleanEmail))
        return res.status(400).json({ message: "Utilise une adresse Gmail, Hotmail ou Outlook" });
      const exists = await User.findOne({ where: { email: cleanEmail } });
      if (exists) return res.status(400).json({ message: "Cet email est déjà utilisé" });
      me.email = cleanEmail;
    }

    if (wantsPasswordChange) {
      if (newPassword.length < 6)
        return res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères" });
      me.password = await bcrypt.hash(newPassword, 10);
    }

    await me.save();
    res.json({
      ok: true,
      user: { id: me.id, username: me.username, email: me.email, role: me.role },
    });
  } catch (e) {
    console.error("[RGPD update]", e);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
});

// 🗑️ Suppression RGPD (sans ban)
app.delete("/api/me/delete", protect, async (req, res) => {
  try {
    const { password, confirm } = req.body;
    if (confirm !== "SUPPRIMER")
      return res.status(400).json({ message: 'Tape "SUPPRIMER" pour confirmer' });

    const me = await User.findByPk(req.user.id);
    if (!me) return res.status(404).json({ message: "Compte introuvable" });
    if (!password) return res.status(400).json({ message: "Mot de passe requis" });

    const ok = await bcrypt.compare(password, me.password);
    if (!ok) return res.status(400).json({ message: "Mot de passe incorrect" });

    const email = me.email;
    const userId = me.id;

    await Message.update(
      { senderId: 1 },
      { where: { senderId: userId, roomId: { [Op.ne]: null } } }
    );

    await Message.destroy({
      where: { [Op.or]: [{ senderId: userId }, { receiverId: userId }] },
    });

    const myDocs = await Document.findAll({ where: { uploadedById: userId } });
    for (const doc of myDocs) {
      try {
        const filePath = path.join(uploadDir, path.basename(doc.url));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
    }
    await Document.destroy({ where: { uploadedById: userId } });

    const sockets = await io.in(`u:${userId}`).fetchSockets();
    for (const s of sockets) {
      s.emit("user:deleted", { reason: "Compte supprimé (RGPD)" });
      s.disconnect(true);
    }

    await me.destroy();
    console.log(`🗑️ Compte supprimé (RGPD) : ${email}`);

    res.json({ ok: true, message: "Compte supprimé définitivement" });
  } catch (e) {
    console.error("[RGPD delete]", e);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════════════
app.get("/api/admin/users", protect, adminOnly, async (_, res) => {
  res.json(await User.findAll({ attributes: { exclude: ["password"] } }));
});

app.put("/api/admin/users/:id/role", protect, adminOnly, async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ message: "Introuvable" });
  u.role = req.body.role;
  await u.save();
  res.json(u);
});

app.post("/api/admin/mute/:id", protect, adminOnly, async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ message: "Introuvable" });
  if (u.role === "admin") return res.status(400).json({ message: "Impossible sur admin" });

  u.muted = true;
  u.mutedReason = req.body.reason || "";
  u.mutedUntil = req.body.durationMinutes
    ? new Date(Date.now() + req.body.durationMinutes * 60_000)
    : null;
  await u.save();
  res.json(u);
});

app.post("/api/admin/unmute/:id", protect, adminOnly, async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ message: "Introuvable" });
  Object.assign(u, { muted: false, mutedUntil: null, mutedReason: "" });
  await u.save();
  res.json(u);
});

app.post("/api/admin/ban/:id", protect, adminOnly, async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ message: "Introuvable" });
  if (u.role === "admin") return res.status(400).json({ message: "Impossible sur admin" });

  u.banned = true;
  u.bannedReason = req.body.reason || "";
  u.online = false;
  await u.save();
  await BanList.create({ email: u.email, reason: req.body.reason || "" });

  const sockets = await io.in(`u:${u.id}`).fetchSockets();
  for (const s of sockets) {
    s.emit("user:banned", { reason: u.bannedReason });
    s.disconnect(true);
  }
  res.json(u);
});

app.post("/api/admin/unban/:id", protect, adminOnly, async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ message: "Introuvable" });
  Object.assign(u, { banned: false, bannedReason: "" });
  await u.save();
  await BanList.destroy({ where: { email: u.email } });
  res.json(u);
});

app.delete("/api/admin/users/:id", protect, adminOnly, async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ message: "Introuvable" });
  if (u.role === "admin") return res.status(400).json({ message: "Impossible sur admin" });

  await BanList.create({ email: u.email, reason: `Supprimé par ${req.user.username}` });

  const sockets = await io.in(`u:${u.id}`).fetchSockets();
  for (const s of sockets) {
    s.emit("user:banned", { reason: "Compte supprimé par un administrateur" });
    s.disconnect(true);
  }
  await u.destroy();
  res.json({ ok: true });
});

app.get("/api/admin/bans", protect, adminOnly, async (_, res) => {
  res.json(await BanList.findAll({ order: [["createdAt", "DESC"]] }));
});

app.delete("/api/admin/bans/:id", protect, adminOnly, async (req, res) => {
  await BanList.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.get("/api/admin/conversations", protect, adminOnly, async (_, res) => {
  const all = await Message.findAll({
    where: { receiverId: { [Op.ne]: null } },
    attributes: ["senderId", "receiverId"],
    raw: true,
  });
  const pairs = new Map();
  for (const m of all) {
    const a = Math.min(m.senderId, m.receiverId);
    const b = Math.max(m.senderId, m.receiverId);
    pairs.set(`${a}-${b}`, { userA: a, userB: b });
  }
  const list = await Promise.all(
    [...pairs.values()].map(async (p) => {
      const [a, b] = await Promise.all([
        User.findByPk(p.userA, { attributes: ["id", "username"] }),
        User.findByPk(p.userB, { attributes: ["id", "username"] }),
      ]);
      return { userA: a, userB: b };
    })
  );
  res.json(list.filter((x) => x.userA && x.userB));
});

app.get("/api/admin/messages/:userA/:userB", protect, adminOnly, async (req, res) => {
  const { userA, userB } = req.params;
  res.json(
    await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
      order: [["createdAt", "ASC"]],
    })
  );
});

// ═══════════════════════════════════════════════════════════════
//  SOCKET AUTH
// ═══════════════════════════════════════════════════════════════
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token manquant"));

    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findByPk(d.id, { attributes: { exclude: ["password"] } });
    if (!u) return next(new Error("Introuvable"));
    if (u.banned) return next(new Error("Banni"));

    socket.user = u;
    next();
  } catch {
    next(new Error("Token invalide"));
  }
});

// ═══════════════════════════════════════════════════════════════
//  UNO — ÉTAT
// ═══════════════════════════════════════════════════════════════
const unoRooms = new Map();
let nextUnoId = 1;
const COLORS = ["red", "yellow", "green", "blue"];

function buildDeck() {
  const d = [];
  for (const c of COLORS) {
    d.push({ color: c, value: "0" });
    for (let i = 1; i <= 9; i++) {
      d.push({ color: c, value: String(i) }, { color: c, value: String(i) });
    }
    for (const v of ["skip", "reverse", "draw2"]) {
      d.push({ color: c, value: v }, { color: c, value: v });
    }
  }
  for (let i = 0; i < 4; i++) {
    d.push({ color: "wild", value: "wild" }, { color: "wild", value: "wild4" });
  }
  return d.sort(() => Math.random() - 0.5);
}

function publicRoom(r) {
  return {
    id: r.id, name: r.name, hostId: r.hostId, status: r.status,
    players: r.players.map((p) => ({
      userId: p.userId, username: p.username, cards: p.hand.length,
    })),
    maxPlayers: 6,
  };
}

function publicState(r, uid) {
  const me = r.players.find((p) => p.userId === uid);
  return {
    id: r.id, name: r.name, status: r.status, hostId: r.hostId,
    players: r.players.map((p) => ({
      userId: p.userId, username: p.username, cards: p.hand.length, calledUno: p.calledUno,
    })),
    topCard: r.discard[r.discard.length - 1] || null,
    currentColor: r.currentColor,
    currentTurn: r.players[r.currentTurn]?.userId ?? null,
    direction: r.direction, deckCount: r.deck.length,
    myHand: me ? me.hand.map((c, i) => ({ ...c, index: i })) : [],
    winner: r.winner || null,
    pendingDraw: r.pendingDraw || 0, pendingType: r.pendingType || null,
  };
}

function broadcastUno(room) {
  room.players.forEach((p) =>
    io.to(`u:${p.userId}`).emit("uno:state", publicState(room, p.userId))
  );
  io.emit("uno:rooms", [...unoRooms.values()].map(publicRoom));
}

function drawCard(r) {
  if (r.deck.length === 0) {
    const top = r.discard.pop();
    r.deck = r.discard.sort(() => Math.random() - 0.5);
    r.discard = [top];
  }
  return r.deck.pop();
}

async function awardUnoWin(username) {
  try {
    const u = await User.findOne({ where: { username } });
    if (u) { u.unoWins = (u.unoWins || 0) + 1; await u.save(); }
  } catch (e) { console.error("[awardUnoWin]", e); }
}

// ═══════════════════════════════════════════════════════════════
//  CHESS — ÉTAT
// ═══════════════════════════════════════════════════════════════
const chessGames = new Map();
let nextChessId = 1;

function publicChess(g) {
  return {
    id: g.id, name: g.name, status: g.status,
    white: g.white ? { id: g.white.id, username: g.white.username } : null,
    black: g.black ? { id: g.black.id, username: g.black.username } : null,
    fen: g.game.fen(), turn: g.game.turn(),
    winner: g.winner, lastMove: g.lastMove,
  };
}

function broadcastChess(g) {
  const data = publicChess(g);
  if (g.white) io.to(`u:${g.white.id}`).emit("chess:state", data);
  if (g.black) io.to(`u:${g.black.id}`).emit("chess:state", data);
  io.emit("chess:rooms", [...chessGames.values()].map(publicChess));
}

async function awardChessWin(username) {
  if (username === "Égalité") return;
  try {
    const u = await User.findOne({ where: { username } });
    if (u) { u.chessWins = (u.chessWins || 0) + 1; await u.save(); }
  } catch (e) { console.error("[awardChessWin]", e); }
}

// ═══════════════════════════════════════════════════════════════
//  SOCKET CONNECTION
// ═══════════════════════════════════════════════════════════════
io.on("connection", (socket) => {
  console.log(`🔌 Connecté: ${socket.user.username} (id ${socket.user.id})`);
  socket.join(`u:${socket.user.id}`);

  async function checkMod() {
    const u = await User.findByPk(socket.user.id);
    if (u.banned) return { ok: false, message: "🚫 Banni" };
    if (u.muted) {
      if (u.mutedUntil && new Date(u.mutedUntil) < new Date()) {
        await User.update({ muted: false, mutedUntil: null }, { where: { id: u.id } });
        return { ok: true };
      }
      const until = u.mutedUntil
        ? `jusqu'au ${new Date(u.mutedUntil).toLocaleString()}`
        : "perm";
      return { ok: false, message: `🔇 Mute ${until}` };
    }
    return { ok: true };
  }

  // ─────────────── CHAT ───────────────
  socket.on("chat:join", ({ roomId }) => {
    socket.join(`r:${roomId}`);
    console.log(`📥 ${socket.user.username} join r:${roomId}`);
  });

  const onRoomMsg = async ({ roomId, content }) => {
    if (typeof content !== "string" || content.trim().length === 0)
      return socket.emit("chat:error", { message: "Message vide" });
    if (content.length > 2000)
      return socket.emit("chat:error", { message: "Message trop long" });

    const c = await checkMod();
    if (!c.ok) return socket.emit("chat:error", { message: c.message });

    const msg = await Message.create({
      senderId: socket.user.id, roomId, content, type: "text",
    });
    const full = await Message.findByPk(msg.id, {
      include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
    });
    io.to(`r:${roomId}`).emit("chat:room", full);
  };
  socket.on("chat:room", onRoomMsg);

  const onPrivate = async ({ receiverId, content }) => {
    if (typeof content !== "string" || content.trim().length === 0)
      return socket.emit("chat:error", { message: "Message vide" });
    if (content.length > 2000)
      return socket.emit("chat:error", { message: "Message trop long" });

    const c = await checkMod();
    if (!c.ok) return socket.emit("chat:error", { message: c.message });

    const msg = await Message.create({
      senderId: socket.user.id, receiverId, content, type: "text",
    });
    const full = await Message.findByPk(msg.id, {
      include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
    });
    io.to(`u:${receiverId}`).emit("chat:private", full);
    socket.emit("chat:private", full);
  };
  socket.on("chat:private", onPrivate);

  socket.on("chat:typing", ({ roomId, isTyping }) => {
    if (!roomId) return;
    socket.to(`r:${roomId}`).emit("chat:typing", {
      userId: socket.user.id, username: socket.user.username, isTyping: !!isTyping,
    });
  });

  socket.on("chat:typing:private", ({ receiverId, isTyping }) => {
    if (!receiverId) return;
    io.to(`u:${receiverId}`).emit("chat:typing:private", {
      userId: socket.user.id, username: socket.user.username, isTyping: !!isTyping,
    });
  });

  socket.on("chat:inject", ({ code }) => {
    if (socket.user.role !== "admin") return;
    if (!code || typeof code !== "string" || !code.trim()) return;
    if (code.length > 50000) return;
    console.log(`🧩 Injection par ${socket.user.username}`);
    io.emit("chat:inject", { code, by: socket.user.username });
  });

  // ─────────────── UNO ───────────────
  socket.on("uno:list", (cb) => {
    const list = [...unoRooms.values()].map(publicRoom);
    if (typeof cb === "function") cb(list);
    socket.emit("uno:rooms", list);
  });

  socket.on("uno:create", ({ name }, cb) => {
    const id = String(nextUnoId++);
    const safeName = typeof name === "string" ? name.slice(0, 50) : `Salon ${id}`;
    const room = {
      id, name: safeName, hostId: socket.user.id,
      players: [{ userId: socket.user.id, username: socket.user.username, hand: [], calledUno: false }],
      deck: [], discard: [], currentTurn: 0, direction: 1, currentColor: null,
      status: "waiting", winner: null, pendingDraw: 0, pendingType: null, emptiedAt: null,
    };
    unoRooms.set(id, room);
    broadcastUno(room);
    if (typeof cb === "function") cb({ ok: true, roomId: id });
  });

  socket.on("uno:join", ({ roomId }, cb) => {
    const r = unoRooms.get(roomId);
    if (!r) return cb && cb({ ok: false, error: "Introuvable" });

    const existing = r.players.find((p) => p.userId === socket.user.id);
    if (existing) {
      r.emptiedAt = null;
      socket.emit("uno:state", publicState(r, socket.user.id));
      socket.emit("uno:rooms", [...unoRooms.values()].map(publicRoom));
      return cb && cb({ ok: true });
    }

    if (r.status !== "waiting") return cb && cb({ ok: false, error: "Partie déjà lancée" });
    if (r.players.length >= 6) return cb && cb({ ok: false, error: "Salon plein" });

    r.players.push({ userId: socket.user.id, username: socket.user.username, hand: [], calledUno: false });
    r.emptiedAt = null;
    broadcastUno(r);
    cb && cb({ ok: true });
  });

  socket.on("uno:leave", ({ roomId }) => {
    const r = unoRooms.get(roomId);
    if (!r) return;
    r.players = r.players.filter((p) => p.userId !== socket.user.id);
    if (r.players.length === 0) {
      if (r.status === "waiting") r.emptiedAt = Date.now();
      else unoRooms.delete(roomId);
    } else {
      if (r.hostId === socket.user.id) r.hostId = r.players[0].userId;
      broadcastUno(r);
    }
    io.emit("uno:rooms", [...unoRooms.values()].map(publicRoom));
  });

  socket.on("uno:start", ({ roomId }) => {
    const r = unoRooms.get(roomId);
    if (!r || r.hostId !== socket.user.id) return;
    if (r.players.length < 2) return socket.emit("chat:error", { message: "Min 2 joueurs" });

    r.deck = buildDeck();
    r.discard = []; r.direction = 1;
    r.currentTurn = Math.floor(Math.random() * r.players.length);
    r.status = "playing"; r.winner = null;
    r.pendingDraw = 0; r.pendingType = null;

    r.players.forEach((p) => { p.hand = r.deck.splice(0, 7); p.calledUno = false; });

    let top = r.deck.pop();
    while (top.value === "wild4") { r.deck.unshift(top); top = r.deck.pop(); }
    r.discard.push(top);
    r.currentColor = top.color === "wild" ? COLORS[0] : top.color;
    broadcastUno(r);
  });

  socket.on("uno:play", ({ roomId, cardIndex, chosenColor }) => {
    const r = unoRooms.get(roomId);
    if (!r || r.status !== "playing") return;

    const me = r.players.find((p) => p.userId === socket.user.id);
    if (!me) return;

    if (r.players[r.currentTurn].userId !== socket.user.id)
      return socket.emit("chat:error", { message: "Pas ton tour" });

    const card = me.hand[cardIndex];
    if (!card) return;
    const top = r.discard[r.discard.length - 1];

    if (r.pendingDraw > 0) {
      if (r.pendingType === "draw2" && card.value !== "draw2")
        return socket.emit("chat:error", { message: "Tu dois jouer un +2 ou piocher" });
      if (r.pendingType === "wild4" && card.value !== "wild4")
        return socket.emit("chat:error", { message: "Tu dois jouer un +4 ou piocher" });
    }

    const playable = card.color === "wild" || card.color === r.currentColor ||
      (card.value === top.value && top.color !== "wild");
    if (!playable) return socket.emit("chat:error", { message: "Carte invalide" });

    me.hand.splice(cardIndex, 1);
    r.discard.push(card);
    r.currentColor = card.color === "wild" ? chosenColor || COLORS[0] : card.color;

    const n = r.players.length;
    const next = (step = 1) => {
      r.currentTurn = (r.currentTurn + step * r.direction + n * 10) % n;
    };

    if (card.value === "reverse") {
      if (n === 2) { /* rejoue */ } else { r.direction *= -1; next(); }
    } else if (card.value === "skip") next(2);
    else if (card.value === "draw2") {
      r.pendingDraw = (r.pendingDraw || 0) + 2; r.pendingType = "draw2"; next();
    } else if (card.value === "wild4") {
      r.pendingDraw = (r.pendingDraw || 0) + 4; r.pendingType = "wild4"; next();
    } else next();

    if (me.hand.length === 0) {
      r.status = "finished"; r.winner = me.username;
      broadcastUno(r);
      awardUnoWin(me.username);
      const target = r.id;
      setTimeout(() => {
        if (unoRooms.get(target) !== r) return;
        r.players.forEach((p) => io.to(`u:${p.userId}`).emit("uno:kicked", { reason: "Partie terminée" }));
        unoRooms.delete(target);
        io.emit("uno:rooms", [...unoRooms.values()].map(publicRoom));
      }, 15000);
      return;
    }
    broadcastUno(r);
  });

  socket.on("uno:draw", ({ roomId }) => {
    const r = unoRooms.get(roomId);
    if (!r || r.status !== "playing") return;
    const me = r.players.find((p) => p.userId === socket.user.id);
    if (!me) return;
    if (r.players[r.currentTurn].userId !== socket.user.id) return;

    const count = r.pendingDraw > 0 ? r.pendingDraw : 1;
    for (let i = 0; i < count; i++) me.hand.push(drawCard(r));

    const hadPending = r.pendingDraw > 0;
    r.pendingDraw = 0; r.pendingType = null;

    if (hadPending) {
      const n = r.players.length;
      r.currentTurn = (r.currentTurn + r.direction + n * 10) % n;
    }
    broadcastUno(r);
  });

  socket.on("uno:uno", ({ roomId }) => {
    const r = unoRooms.get(roomId);
    const me = r?.players.find((p) => p.userId === socket.user.id);
    if (me) { me.calledUno = true; broadcastUno(r); }
  });

  // ─────────────── CHESS ───────────────
  socket.on("chess:list", (cb) => {
    const list = [...chessGames.values()].map(publicChess);
    if (typeof cb === "function") cb(list);
    socket.emit("chess:rooms", list);
  });

  socket.on("chess:create", ({ name }, cb) => {
    const id = String(nextChessId++);
    const safeName = typeof name === "string" ? name.slice(0, 50) : `Partie ${id}`;
    const game = {
      id, name: safeName, status: "waiting",
      white: socket.user, black: null,
      game: new Chess(), winner: null, lastMove: null, emptiedAt: null,
    };
    chessGames.set(id, game);
    broadcastChess(game);
    cb && cb({ ok: true, gameId: id });
  });

  socket.on("chess:join", ({ gameId }, cb) => {
    const g = chessGames.get(gameId);
    if (!g) return cb && cb({ ok: false, error: "Introuvable" });

    if (g.white?.id === socket.user.id || g.black?.id === socket.user.id) {
      g.emptiedAt = null;
      socket.emit("chess:state", publicChess(g));
      socket.emit("chess:rooms", [...chessGames.values()].map(publicChess));
      return cb && cb({ ok: true });
    }

    if (g.status !== "waiting") return cb && cb({ ok: false, error: "Partie déjà commencée" });
    if (!g.black) {
      g.black = socket.user;
      g.status = "playing";
      g.emptiedAt = null;
    } else return cb && cb({ ok: false, error: "Complet" });

    broadcastChess(g);
    cb && cb({ ok: true });
  });

  socket.on("chess:move", ({ gameId, from, to, promotion }) => {
    const g = chessGames.get(gameId);
    if (!g || g.status !== "playing") return;
    const isWhite = g.white?.id === socket.user.id;
    const isBlack = g.black?.id === socket.user.id;
    if (!isWhite && !isBlack) return;

    const myTurn = (g.game.turn() === "w" && isWhite) || (g.game.turn() === "b" && isBlack);
    if (!myTurn) return socket.emit("chat:error", { message: "Pas ton tour" });

    try {
      const move = g.game.move({ from, to, promotion: promotion || "q" });
      if (!move) return;
      g.lastMove = move;

      let finished = false;
      if (g.game.isCheckmate()) {
        g.status = "finished"; g.winner = socket.user.username; finished = true;
      } else if (g.game.isDraw() || g.game.isStalemate()) {
        g.status = "finished"; g.winner = "Égalité"; finished = true;
      }
      broadcastChess(g);

      if (finished) {
        awardChessWin(g.winner);
        const target = g.id;
        setTimeout(() => {
          if (chessGames.get(target) !== g) return;
          if (g.white) io.to(`u:${g.white.id}`).emit("chess:deleted");
          if (g.black) io.to(`u:${g.black.id}`).emit("chess:deleted");
          chessGames.delete(target);
          io.emit("chess:rooms", [...chessGames.values()].map(publicChess));
        }, 15000);
      }
    } catch {
      socket.emit("chat:error", { message: "Coup invalide" });
    }
  });

  socket.on("chess:resign", ({ gameId }) => {
    const g = chessGames.get(gameId);
    if (!g) return;
    g.status = "finished";
    g.winner = g.white?.id === socket.user.id ? g.black?.username : g.white?.username;
    broadcastChess(g);
    awardChessWin(g.winner);
    const target = g.id;
    setTimeout(() => {
      if (chessGames.get(target) !== g) return;
      if (g.white) io.to(`u:${g.white.id}`).emit("chess:deleted");
      if (g.black) io.to(`u:${g.black.id}`).emit("chess:deleted");
      chessGames.delete(target);
      io.emit("chess:rooms", [...chessGames.values()].map(publicChess));
    }, 15000);
  });

  socket.on("chess:leave", ({ gameId }) => {
    const g = chessGames.get(gameId);
    if (!g) return;
    if (g.status === "waiting") {
      g.emptiedAt = Date.now();
      io.emit("chess:rooms", [...chessGames.values()].map(publicChess));
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Déconnecté: ${socket.user.username}`);
    User.update({ online: false }, { where: { id: socket.user.id } }).catch(() => {});
  });
});

// ═══════════════════════════════════════════════════════════════
//  ADMIN — GAMES
// ═══════════════════════════════════════════════════════════════
app.delete("/api/admin/uno/rooms/:roomId", protect, adminOnly, (req, res) => {
  if (!unoRooms.has(req.params.roomId))
    return res.status(404).json({ message: "Salon introuvable" });
  const room = unoRooms.get(req.params.roomId);
  room.players.forEach((p) => io.to(`u:${p.userId}`).emit("uno:kicked"));
  unoRooms.delete(req.params.roomId);
  io.emit("uno:rooms", [...unoRooms.values()].map(publicRoom));
  res.json({ ok: true });
});

app.delete("/api/admin/chess/games/:gameId", protect, adminOnly, (req, res) => {
  if (!chessGames.has(req.params.gameId))
    return res.status(404).json({ message: "Partie introuvable" });
  const g = chessGames.get(req.params.gameId);
  if (g.white) io.to(`u:${g.white.id}`).emit("chess:deleted");
  if (g.black) io.to(`u:${g.black.id}`).emit("chess:deleted");
  chessGames.delete(req.params.gameId);
  io.emit("chess:rooms", [...chessGames.values()].map(publicChess));
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
//  PURGE
// ═══════════════════════════════════════════════════════════════
async function purgeOldMessages() {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await Message.destroy({ where: { createdAt: { [Op.lt]: cutoff } } });
    if (deleted > 0) console.log(`🧹 ${deleted} messages purgés (> 7 jours)`);
  } catch (e) { console.error("[purge]", e); }
}
setTimeout(purgeOldMessages, 10_000);
setInterval(purgeOldMessages, 6 * 60 * 60 * 1000);

setInterval(() => {
  const now = Date.now();
  let changedUno = false, changedChess = false;
  for (const [id, r] of unoRooms.entries()) {
    if (r.players.length === 0 && r.emptiedAt && now - r.emptiedAt > 5 * 60_000) {
      unoRooms.delete(id); changedUno = true;
    }
  }
  for (const [id, g] of chessGames.entries()) {
    if (g.status === "waiting" && g.emptiedAt && now - g.emptiedAt > 5 * 60_000) {
      chessGames.delete(id); changedChess = true;
    }
  }
  if (changedUno) io.emit("uno:rooms", [...unoRooms.values()].map(publicRoom));
  if (changedChess) io.emit("chess:rooms", [...chessGames.values()].map(publicChess));
}, 60_000);

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  server.listen(PORT, () => console.log(`🚀 Backend prêt sur ${PORT}`))
);
