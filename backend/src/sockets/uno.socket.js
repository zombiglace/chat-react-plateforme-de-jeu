const COLORS = ["red", "yellow", "green", "blue"];

function buildDeck() {
  const deck = [];
  for (const c of COLORS) {
    deck.push({ color: c, value: "0" });
    for (let i = 1; i <= 9; i++) {
      deck.push({ color: c, value: String(i) });
      deck.push({ color: c, value: String(i) });
    }
    for (const v of ["skip", "reverse", "draw2"]) {
      deck.push({ color: c, value: v });
      deck.push({ color: c, value: v });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild" });
    deck.push({ color: "wild", value: "wild4" });
  }
  return shuffle(deck);
}

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const rooms = new Map();
let nextRoomId = 1;

function publicRoom(r) {
  return {
    id: r.id,
    name: r.name,
    hostId: r.hostId,
    status: r.status,
    players: r.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      cards: p.hand.length,
      calledUno: p.calledUno,
    })),
    maxPlayers: 6,
  };
}

function publicState(r, forUserId) {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    hostId: r.hostId,
    players: r.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      cards: p.hand.length,
      calledUno: p.calledUno,
    })),
    topCard: r.discard[r.discard.length - 1] || null,
    currentColor: r.currentColor,
    currentTurn: r.players[r.currentTurn]?.userId ?? null,
    direction: r.direction,
    deckCount: r.deck.length,
    myHand:
      r.players
        .find((p) => p.userId === forUserId)
        ?.hand.map((c, i) => ({ ...c, index: i })) || [],
    winner: r.winner || null,
  };
}

function canPlay(card, topCard, currentColor) {
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value && topCard.color !== "wild") return true;
  return false;
}

function drawFromDeck(r, n = 1) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (r.deck.length === 0) {
      const top = r.discard.pop();
      r.deck = shuffle(r.discard);
      r.discard = [top];
    }
    if (r.deck.length === 0) break;
    drawn.push(r.deck.pop());
  }
  return drawn;
}

function nextTurn(r, step = 1) {
  const len = r.players.length;
  r.currentTurn = (r.currentTurn + step * r.direction + len * 10) % len;
}

module.exports = function initUnoSocket(io) {
  // Namespace dédié /uno
  const uno = io.of("/uno");

  uno.on("connection", (socket) => {
    console.log("🎮 [uno] socket connecté :", socket.id);

    // 🆕 Le user vient du chat (auth déjà faite)
    // On doit récupérer l'utilisateur via le token aussi
    const token = socket.handshake.auth?.token;
    const jwt = require("jsonwebtoken");
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      console.log("🎮 [uno] user identifié :", socket.userId);
    } catch (e) {
      console.error("❌ [uno] token invalide :", e.message);
      return socket.disconnect();
    }

    // On enrichit le socket avec le username
    const { User } = require("../config/db");
    User.findByPk(socket.userId).then((u) => {
      if (u) socket.username = u.username;
    });

    function broadcastState(room) {
      room.players.forEach((p) => {
        uno
          .to(`user:${p.userId}`)
          .emit("uno:state", publicState(room, p.userId));
      });
      uno.emit("uno:rooms", Array.from(rooms.values()).map(publicRoom));
    }

    socket.on("uno:list", (cb) => {
      const list = Array.from(rooms.values()).map(publicRoom);
      console.log("📋 [uno] liste demandée :", list.length, "salons");
      if (typeof cb === "function") cb(list);
      socket.emit("uno:rooms", list);
    });

    socket.on("uno:create", ({ name }, cb) => {
      const id = String(nextRoomId++);
      const username = socket.username || `User${socket.userId}`;
      const room = {
        id,
        name: name || `Salon ${id}`,
        hostId: socket.userId,
        players: [
          {
            userId: socket.userId,
            username,
            hand: [],
            calledUno: false,
          },
        ],
        deck: [],
        discard: [],
        currentTurn: 0,
        direction: 1,
        currentColor: null,
        status: "waiting",
        winner: null,
      };
      rooms.set(id, room);
      socket.join(`uno:${id}`);
      socket.join(`user:${socket.userId}`);
      broadcastState(room);
      console.log("🎮 [uno] salon créé :", id, "par", username);
      if (typeof cb === "function") cb({ ok: true, roomId: id });
    });

    socket.on("uno:join", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) {
        console.log("❌ [uno] join : salon introuvable", roomId);
        return (
          typeof cb === "function" &&
          cb({ ok: false, error: "Salon introuvable" })
        );
      }
      if (room.status !== "waiting")
        return (
          typeof cb === "function" &&
          cb({ ok: false, error: "Partie déjà lancée" })
        );
      if (room.players.length >= 6)
        return (
          typeof cb === "function" && cb({ ok: false, error: "Salon plein" })
        );
      if (room.players.some((p) => p.userId === socket.userId))
        return typeof cb === "function" && cb({ ok: true });

      const username = socket.username || `User${socket.userId}`;
      room.players.push({
        userId: socket.userId,
        username,
        hand: [],
        calledUno: false,
      });
      socket.join(`uno:${roomId}`);
      socket.join(`user:${socket.userId}`);
      broadcastState(room);
      console.log("🎮 [uno] join :", username, "→", roomId);
      if (typeof cb === "function") cb({ ok: true });
    });

    socket.on("uno:leave", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.players = room.players.filter((p) => p.userId !== socket.userId);
      socket.leave(`uno:${roomId}`);
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        if (room.hostId === socket.userId) room.hostId = room.players[0].userId;
        broadcastState(room);
      }
      uno.emit("uno:rooms", Array.from(rooms.values()).map(publicRoom));
    });

    socket.on("uno:start", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.hostId !== socket.userId) return;
      if (room.players.length < 2)
        return socket.emit("error:mod", {
          message: "Il faut au moins 2 joueurs",
        });

      room.deck = buildDeck();
      room.discard = [];
      room.direction = 1;
      room.currentTurn = Math.floor(Math.random() * room.players.length);
      room.winner = null;
      room.status = "playing";

      room.players.forEach((p) => {
        p.hand = room.deck.splice(0, 7);
        p.calledUno = false;
      });

      let top = room.deck.pop();
      while (top.value === "wild4") {
        room.deck.unshift(top);
        top = room.deck.pop();
      }
      room.discard.push(top);
      room.currentColor =
        top.color === "wild"
          ? COLORS[Math.floor(Math.random() * 4)]
          : top.color;

      broadcastState(room);
      console.log("🎮 [uno] partie démarrée :", roomId);
    });

    socket.on("uno:play", ({ roomId, cardIndex, chosenColor }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      const player = room.players.find((p) => p.userId === socket.userId);
      if (!player) return;
      if (room.players[room.currentTurn].userId !== socket.userId)
        return socket.emit("error:mod", { message: "Ce n'est pas ton tour" });

      const card = player.hand[cardIndex];
      if (!card) return;
      const top = room.discard[room.discard.length - 1];
      if (!canPlay(card, top, room.currentColor))
        return socket.emit("error:mod", { message: "Carte invalide" });

      player.hand.splice(cardIndex, 1);
      room.discard.push(card);
      room.currentColor =
        card.color === "wild" ? chosenColor || COLORS[0] : card.color;

      if (card.value === "reverse") {
        room.direction *= -1;
        nextTurn(room);
      } else if (card.value === "skip") {
        nextTurn(room, 2);
      } else if (card.value === "draw2") {
        nextTurn(room);
        room.players[room.currentTurn].hand.push(...drawFromDeck(room, 2));
        nextTurn(room);
      } else if (card.value === "wild4") {
        nextTurn(room);
        room.players[room.currentTurn].hand.push(...drawFromDeck(room, 4));
        nextTurn(room);
      } else {
        nextTurn(room);
      }

      if (player.hand.length === 0) {
        room.status = "finished";
        room.winner = player.username;
      }

      broadcastState(room);
    });

    socket.on("uno:draw", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      const player = room.players.find((p) => p.userId === socket.userId);
      if (!player) return;
      if (room.players[room.currentTurn].userId !== socket.userId)
        return socket.emit("error:mod", { message: "Ce n'est pas ton tour" });

      player.hand.push(...drawFromDeck(room, 1));
      broadcastState(room);
    });

    socket.on("uno:pass", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      if (room.players[room.currentTurn].userId !== socket.userId) return;
      nextTurn(room);
      broadcastState(room);
    });

    socket.on("uno:uno", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const p = room.players.find((x) => x.userId === socket.userId);
      if (!p) return;
      p.calledUno = true;
      broadcastState(room);
    });

    socket.on("uno:catch", ({ roomId, targetUserId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const target = room.players.find((p) => p.userId === targetUserId);
      if (!target) return;
      if (target.hand.length === 1 && !target.calledUno) {
        target.hand.push(...drawFromDeck(room, 2));
        uno
          .to(`uno:${roomId}`)
          .emit("uno:catch", { username: target.username });
        broadcastState(room);
      }
    });
  });
};
