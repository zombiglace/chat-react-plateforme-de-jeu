const router = require("express").Router();
const { User, BanList } = require("../config/db");

// Vue d'ensemble : combien de sockets connectés, état des users, etc.
router.get("/state", async (req, res) => {
  const io = req.app.get("io");
  if (!io) return res.status(500).json({ error: "io non attaché" });

  const sockets = await io.fetchSockets();
  const users = await User.findAll({
    attributes: ["id", "username", "role", "online", "muted", "banned"],
  });
  const bans = await BanList.findAll();

  res.json({
    socketCount: sockets.length,
    sockets: sockets.map((s) => ({
      id: s.id,
      userId: s.user?.id,
      username: s.user?.username,
    })),
    users,
    bans,
  });
});

// Simule un ban (bypass admin) — utile pour debug
router.get("/force-ban/:id", async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ error: "not found" });
  u.banned = true;
  u.bannedReason = "test";
  await u.save();
  await BanList.create({
    email: u.email,
    ip: u.registrationIp,
    reason: "test",
  });
  res.json({ ok: true, user: u });
});

// Simule un mute
router.get("/force-mute/:id", async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ error: "not found" });
  u.muted = true;
  u.mutedUntil = new Date(Date.now() + 3600_000);
  u.mutedReason = "test";
  await u.save();
  res.json({ ok: true, user: u });
});

module.exports = router;
