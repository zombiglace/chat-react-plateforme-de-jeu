const jwt = require("jsonwebtoken");
const { User, Message } = require("../config/db");

async function checkMute(userId) {
  const u = await User.findByPk(userId);
  if (!u) return { ok: false, message: "Utilisateur introuvable" };
  if (u.banned) return { ok: false, message: "🚫 Tu es banni" };
  if (u.muted) {
    if (u.mutedUntil && new Date(u.mutedUntil) < new Date()) {
      await User.update(
        { muted: false, mutedUntil: null, mutedReason: "" },
        { where: { id: userId } },
      );
      return { ok: true };
    }
    const until = u.mutedUntil
      ? `jusqu'au ${new Date(u.mutedUntil).toLocaleString()}`
      : "indéfiniment";
    return { ok: false, message: `🔇 Tu es mute ${until}` };
  }
  return { ok: true };
}

module.exports = function initChatSocket(io) {
  // Namespace /chat pour isoler proprement
  const chat = io.of("/chat");

  chat.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      console.log("🔐 [chat] auth token présent :", !!token);
      if (!token) return next(new Error("Token manquant"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
      if (!user) return next(new Error("Utilisateur introuvable"));
      if (user.banned) return next(new Error("Banni"));

      socket.user = user;
      console.log("✅ [chat] connecté :", user.username);
      next();
    } catch (e) {
      console.error("❌ [chat] auth :", e.message);
      next(new Error("Token invalide"));
    }
  });

  chat.on("connection", async (socket) => {
    console.log(`🔌 [chat] ${socket.user.username} (user ${socket.user.id})`);

    await User.update({ online: true }, { where: { id: socket.user.id } });

    const emitOnline = async () => {
      const online = await User.findAll({
        where: { online: true },
        attributes: ["id", "username"],
      });
      chat.emit("users:online", online);
    };
    await emitOnline();

    socket.join(`user:${socket.user.id}`);

    socket.on("room:join", (roomId) => {
      console.log(`📥 [chat] ${socket.user.username} rejoint room ${roomId}`);
      socket.join(`room:${roomId}`);
    });

    socket.on("room:message", async ({ roomId, content, type = "text" }) => {
      console.log(`💬 [chat] room:message de ${socket.user.username}`, {
        roomId,
        content,
      });
      const check = await checkMute(socket.user.id);
      if (!check.ok) {
        console.log(`⛔ [chat] bloqué : ${check.message}`);
        return socket.emit("error:mod", { message: check.message });
      }

      const msg = await Message.create({
        senderId: socket.user.id,
        roomId,
        content,
        type,
      });
      const full = await Message.findByPk(msg.id, {
        include: [
          { model: User, as: "sender", attributes: ["id", "username", "role"] },
        ],
      });
      chat.to(`room:${roomId}`).emit("room:message", full);
    });

    socket.on(
      "private:message",
      async ({ receiverId, content, type = "text" }) => {
        console.log(
          `✉️ [chat] private:message ${socket.user.username} → ${receiverId}`,
        );
        const check = await checkMute(socket.user.id);
        if (!check.ok)
          return socket.emit("error:mod", { message: check.message });

        const msg = await Message.create({
          senderId: socket.user.id,
          receiverId,
          content,
          type,
        });
        const full = await Message.findByPk(msg.id, {
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "username", "role"],
            },
          ],
        });
        chat.to(`user:${receiverId}`).emit("private:message", full);
        socket.emit("private:message", full);
      },
    );

    // 🧩 Injection de code — broadcast à tous
    socket.on("admin:inject", ({ code }) => {
      console.log(`🧩 [chat] injection demandée par ${socket.user.username}`);
      if (socket.user.role !== "admin") return;
      chat.emit("admin:inject", { code, by: socket.user.username });
    });

    socket.on("disconnect", async () => {
      await User.update({ online: false }, { where: { id: socket.user.id } });
      await emitOnline();
      console.log(`❌ [chat] ${socket.user.username} déconnecté`);
    });
  });
};
