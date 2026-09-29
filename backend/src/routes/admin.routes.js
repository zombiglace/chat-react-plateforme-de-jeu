const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const { User, BanList } = require("../config/db");

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    ""
  );
}

// Injection admin (existait déjà)
router.post("/inject", protect, adminOnly, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Code manquant" });

  const io = req.app.get("io");
  if (io) {
    io.of("/chat").emit("admin:inject", { code, by: req.user.username });
  }
  res.json({ ok: true, injectedAt: new Date() });
});

router.get("/users", protect, adminOnly, async (_, res) => {
  const users = await User.findAll({ attributes: { exclude: ["password"] } });
  res.json(users);
});

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  const target = await User.findByPk(req.params.id);
  if (target?.role === "admin")
    return res
      .status(400)
      .json({ message: "Impossible de supprimer un admin" });

  // On garde la trace dans BanList même si on supprime
  if (target) {
    await BanList.create({
      email: target.email,
      ip: target.registrationIp,
      reason: "Compte supprimé par admin",
      bannedBy: req.user.id,
    });
  }
  await User.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.put("/users/:id/role", protect, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!["membre", "admin"].includes(role))
    return res.status(400).json({ message: "Rôle invalide" });

  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ message: "Utilisateur introuvable" });

  user.role = role;
  await user.save();
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

// 🔇 MUTE
router.post("/users/:id/mute", protect, adminOnly, async (req, res) => {
  const { durationMinutes, reason } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ message: "Utilisateur introuvable" });
  if (user.role === "admin")
    return res.status(400).json({ message: "Impossible de mute un admin" });

  user.muted = true;
  user.mutedReason = reason || "Non spécifié";
  user.mutedUntil = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60_000)
    : null;
  await user.save();

  res.json({ ok: true, user });
});

// 🔊 UNMUTE
router.post("/users/:id/unmute", protect, adminOnly, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ message: "Utilisateur introuvable" });

  user.muted = false;
  user.mutedUntil = null;
  user.mutedReason = "";
  await user.save();

  res.json({ ok: true, user });
});

// 🚫 BAN (persistant + email + IP)
router.post("/users/:id/ban", protect, adminOnly, async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ message: "Utilisateur introuvable" });
  if (user.role === "admin")
    return res.status(400).json({ message: "Impossible de bannir un admin" });

  user.banned = true;
  user.bannedReason = reason || "Non spécifié";
  user.online = false;
  await user.save();

  // 🆕 Ajout à la BanList persistante
  await BanList.create({
    email: user.email,
    ip: user.registrationIp,
    reason: reason || "Non spécifié",
    bannedBy: req.user.id,
  });

  res.json({ ok: true, user });
});

// ✅ UNBAN
router.post("/users/:id/unban", protect, adminOnly, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ message: "Utilisateur introuvable" });

  user.banned = false;
  user.bannedReason = "";
  await user.save();

  // Retire de la BanList
  await BanList.destroy({ where: { email: user.email } });

  res.json({ ok: true, user });
});

// 📋 Liste des bans persistants
router.get("/bans", protect, adminOnly, async (_, res) => {
  const bans = await BanList.findAll({ order: [["createdAt", "DESC"]] });
  res.json(bans);
});

// ✅ Unban direct par ID
router.delete("/bans/:id", protect, adminOnly, async (req, res) => {
  await BanList.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
