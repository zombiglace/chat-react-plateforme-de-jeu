import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

// 🧩 Presets d'injection prêts à l'emploi
const PRESETS = [
  {
    id: "rickroll",
    name: "🎵 Rick Roll",
    desc: "Vidéo plein écran sur tous les écrans",
    code: `(() => {
  document.getElementById("__rickroll")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "__rickroll";
  overlay.style.cssText = "position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;";
  const iframe = document.createElement("iframe");
  iframe.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1";
  iframe.allow = "autoplay; encrypted-media; fullscreen";
  iframe.allowFullscreen = true;
  iframe.style.cssText = "width:100vw;height:100vh;border:0;";
  overlay.appendChild(iframe);
  const close = document.createElement("button");
  close.textContent = "✕ Fermer";
  close.style.cssText = "position:fixed;top:20px;right:20px;z-index:1000000;padding:12px 20px;background:#dc2626;color:#fff;border:0;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;";
  close.onclick = () => { overlay.remove(); close.remove(); };
  overlay.appendChild(close);
  document.body.appendChild(overlay);
})();`,
  },
  {
    id: "alert",
    name: "💬 Alerte simple",
    desc: "Message popup personnalisé",
    code: `alert("📢 Message de l'admin : Bonjour !");`,
  },
  {
    id: "shakepage",
    name: "🌪️ Secouer la page",
    desc: "Animation qui fait trembler l'écran",
    code: `(() => {
  document.body.style.transition = "transform 0.05s";
  let n = 0;
  const iv = setInterval(() => {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    document.body.style.transform = \`translate(\${x}px, \${y}px)\`;
    if (++n > 40) {
      clearInterval(iv);
      document.body.style.transform = "";
      document.body.style.transition = "";
    }
  }, 50);
})();`,
  },
  {
    id: "confetti",
    name: "🎉 Confettis",
    desc: "Pluie de confettis emoji",
    code: `(() => {
  const emojis = ["🎉","🎊","✨","⭐","🎈","💫","🌟"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = \`position:fixed;top:-50px;left:\${Math.random()*100}vw;font-size:\${20+Math.random()*30}px;z-index:999999;pointer-events:none;transition:transform 3s linear, opacity 3s;\`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = \`translateY(110vh) rotate(\${Math.random()*720}deg)\`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 3200);
  }
})();`,
  },
  {
    id: "invert",
    name: "🔄 Inverser les couleurs",
    desc: "Filtre CSS qui inverse tout",
    code: `document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";
setTimeout(() => { document.documentElement.style.filter = ""; }, 5000);`,
  },
  {
    id: "matrix",
    name: "💚 Pluie Matrix",
    desc: "Effet hacker vert",
    code: `(() => {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;z-index:999999;pointer-events:none;background:rgba(0,0,0,0.7)";
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const cols = Math.floor(c.width / 16);
  const drops = Array(cols).fill(1);
  const chars = "アカサタナハマヤラワ0123456789ABCDEF";
  const iv = setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#0f0";
    ctx.font = "15px monospace";
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*16, y*16);
      drops[i] = y*16 > c.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  }, 40);
  setTimeout(() => { clearInterval(iv); c.remove(); }, 5000);
})();`,
  },
  {
    id: "redirect",
    name: "🚀 Redirection",
    desc: "Redirige vers une URL",
    code: `window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";`,
  },
  {
    id: "message",
    name: "📨 Message flottant",
    desc: "Notification personnalisée",
    code: `(() => {
  const el = document.createElement("div");
  el.textContent = "📢 Message de l'admin !";
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#3b82f6;color:#fff;padding:16px 32px;border-radius:12px;font-size:18px;font-weight:bold;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.5);";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
})();`,
  },
  {
    id: "block",
    name: "🚫 Bloquer la page",
    desc: "Overlay rouge avec message",
    code: `(() => {
  const el = document.createElement("div");
  el.innerHTML = "<h1 style='color:#fff;font-size:4rem;text-align:center'>🚫 BLOQUÉ PAR L'ADMIN</h1>";
  el.style.cssText = "position:fixed;inset:0;background:rgba(127,29,29,0.95);z-index:999999;display:grid;place-items:center;";
  const close = document.createElement("button");
  close.textContent = "Fermer";
  close.style.cssText = "position:fixed;bottom:40px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#fff;color:#000;border:0;border-radius:8px;font-weight:bold;cursor:pointer;";
  close.onclick = () => el.remove();
  el.appendChild(close);
  document.body.appendChild(el);
})();`,
  },
];

export default function AdminPanel() {
  const socket = useSocket();
  const [tab, setTab] = useState("users");

  const [users, setUsers] = useState([]);
  const [bans, setBans] = useState([]);
  const [convs, setConvs] = useState([]);
  const [unoRooms, setUnoRooms] = useState([]);
  const [chessRooms, setChessRooms] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);

  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const [u, b, c] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/bans"),
        api.get("/admin/conversations"),
      ]);
      setUsers(u.data);
      setBans(b.data);
      setConvs(c.data);
    } catch (e) {
      console.error("[admin] load failed", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onUno = (list) => setUnoRooms(list);
    const onChess = (list) => setChessRooms(list);
    socket.on("uno:rooms", onUno);
    socket.on("chess:rooms", onChess);
    socket.emit("uno:list");
    socket.emit("chess:list");
    return () => {
      socket.off("uno:rooms", onUno);
      socket.off("chess:rooms", onChess);
    };
  }, [socket]);

  const openConv = async (c) => {
    setSelectedConv(c);
    const { data } = await api.get(
      `/admin/messages/${c.userA.id}/${c.userB.id}`,
    );
    setConvMessages(data);
  };

  const setRole = async (id, role) => {
    await api.put(`/admin/users/${id}/role`, { role });
    load();
  };

  const mute = async (u) => {
    const dur = prompt("Durée en minutes (5, 60, 1440) ou 'perm'", "60");
    if (dur === null) return;
    const durationMinutes =
      dur.toLowerCase() === "perm" ? null : parseInt(dur, 10);
    const reason = prompt("Raison ?", "") || "";
    await api.post(`/admin/mute/${u.id}`, { durationMinutes, reason });
    load();
  };
  const unmute = async (u) => {
    await api.post(`/admin/unmute/${u.id}`);
    load();
  };
  const ban = async (u) => {
    const reason = prompt("Raison ?", "") || "";
    if (!window.confirm(`Bannir ${u.username} ?`)) return;
    await api.post(`/admin/ban/${u.id}`, { reason });
    load();
  };
  const unban = async (u) => {
    await api.post(`/admin/unban/${u.id}`);
    load();
  };
  const del = async (u) => {
    if (!window.confirm(`Supprimer ${u.username} ?`)) return;
    await api.delete(`/admin/users/${u.id}`);
    load();
  };
  const removeBan = async (id) => {
    if (!window.confirm("Retirer ce ban ?")) return;
    await api.delete(`/admin/bans/${id}`);
    load();
  };
  const deleteUnoRoom = async (roomId) => {
    if (!window.confirm("Supprimer ce salon UNO ?")) return;
    await api.delete(`/admin/uno/rooms/${roomId}`);
  };
  const deleteChessGame = async (gameId) => {
    if (!window.confirm("Supprimer cette partie d'échecs ?")) return;
    await api.delete(`/admin/chess/games/${gameId}`);
  };

  const inject = () => {
    if (!socket) return setMsg("❌ Socket non connecté");
    if (!code.trim()) return setMsg("❌ Code vide");
    socket.emit("chat:inject", { code });
    setMsg("✅ Code envoyé à TOUS les clients connectés");
    setTimeout(() => setMsg(""), 4000);
  };

  const applyPreset = (preset) => {
    setCode(preset.code);
    setMsg(`📋 Preset « ${preset.name} » chargé`);
    setTimeout(() => setMsg(""), 2500);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  // 📊 Stats
  const stats = {
    total: users.length,
    online: users.filter((u) => u.online).length,
    admins: users.filter((u) => u.role === "admin").length,
    muted: users.filter((u) => u.muted).length,
    banned: users.filter((u) => u.banned).length,
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>🧑‍💼 Administration</h1>
          <p className="admin-subtitle">
            Gérez les utilisateurs, jeux et injections en direct
          </p>
        </div>
        <Link to="/" className="admin-back">
          ← Retour au chat
        </Link>
      </div>

      {/* 📊 STATS */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Utilisateurs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{stats.online}</div>
          <div className="stat-label">En ligne</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-icon">🔇</div>
          <div className="stat-value">{stats.muted}</div>
          <div className="stat-label">Mute</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🚫</div>
          <div className="stat-value">{stats.banned}</div>
          <div className="stat-label">Bannis</div>
        </div>
      </div>

      {/* 🗂️ TABS */}
      <div className="admin-tabs">
        <button
          className={tab === "users" ? "active" : ""}
          onClick={() => setTab("users")}
        >
          👥 Utilisateurs <span className="tab-count">{users.length}</span>
        </button>
        <button
          className={tab === "inject" ? "active" : ""}
          onClick={() => setTab("inject")}
        >
          🧩 Injection
        </button>
        <button
          className={tab === "messages" ? "active" : ""}
          onClick={() => setTab("messages")}
        >
          💬 Messages privés <span className="tab-count">{convs.length}</span>
        </button>
        <button
          className={tab === "games" ? "active" : ""}
          onClick={() => setTab("games")}
        >
          🎮 Parties{" "}
          <span className="tab-count">
            {unoRooms.length + chessRooms.length}
          </span>
        </button>
        <button
          className={tab === "bans" ? "active" : ""}
          onClick={() => setTab("bans")}
        >
          📋 Bannissements <span className="tab-count">{bans.length}</span>
        </button>
      </div>

      {/* ═══ TAB USERS ═══ */}
      {tab === "users" && (
        <div className="admin-panel">
          <input
            className="admin-search"
            placeholder="🔍 Rechercher un utilisateur (pseudo ou email)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="user-grid">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className={`user-card ${u.banned ? "banned" : ""}`}
              >
                <div className="user-card-header">
                  <div
                    className="user-avatar"
                    style={{ background: colorFromName(u.username) }}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <div className="user-name">
                      {u.username}
                      {u.online && <span className="online-badge">●</span>}
                    </div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  <span className={`user-role role-${u.role}`}>{u.role}</span>
                </div>

                <div className="user-scores">
                  <span>
                    🎴 <strong>{u.unoWins || 0}</strong>
                  </span>
                  <span>
                    ♟️ <strong>{u.chessWins || 0}</strong>
                  </span>
                </div>

                <div className="user-status">
                  {u.banned && <span className="badge ban">🚫 Banni</span>}
                  {!u.banned && u.muted && (
                    <span className="badge mute">
                      🔇 Mute{" "}
                      {u.mutedUntil
                        ? `→ ${new Date(u.mutedUntil).toLocaleString()}`
                        : "perm"}
                    </span>
                  )}
                  {!u.banned && !u.muted && (
                    <span className="badge ok">✅ OK</span>
                  )}
                </div>

                <div className="user-actions">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                  >
                    <option value="membre">Membre</option>
                    <option value="admin">Admin</option>
                  </select>
                  {!u.muted ? (
                    <button
                      className="btn-sm"
                      onClick={() => mute(u)}
                      title="Mute"
                    >
                      🔇
                    </button>
                  ) : (
                    <button
                      className="btn-sm ok"
                      onClick={() => unmute(u)}
                      title="Unmute"
                    >
                      🔊
                    </button>
                  )}
                  {!u.banned ? (
                    <button
                      className="btn-sm danger"
                      onClick={() => ban(u)}
                      title="Ban"
                    >
                      🚫
                    </button>
                  ) : (
                    <button
                      className="btn-sm ok"
                      onClick={() => unban(u)}
                      title="Unban"
                    >
                      ✅
                    </button>
                  )}
                  <button
                    className="btn-sm danger"
                    onClick={() => del(u)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <p className="admin-empty">Aucun utilisateur trouvé.</p>
          )}
        </div>
      )}

      {/* ═══ TAB INJECT ═══ */}
      {tab === "inject" && (
        <div className="admin-panel">
          <h2>🧩 Presets rapides</h2>
          <p className="admin-hint">
            Clique sur un preset pour le charger dans la zone d'injection
            ci-dessous.
          </p>
          <div className="preset-grid">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className="preset-card"
                onClick={() => applyPreset(p)}
                title={p.desc}
              >
                <div className="preset-name">{p.name}</div>
                <div className="preset-desc">{p.desc}</div>
              </button>
            ))}
          </div>

          <h2>✍️ Zone d'injection</h2>
          <p className="admin-hint">
            Le code JS ci-dessous sera <strong>exécuté immédiatement</strong>{" "}
            chez tous les utilisateurs connectés.
          </p>
          <textarea
            className="inject-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            placeholder="// Colle ton code JavaScript ici (pas de balises <script>)"
            spellCheck={false}
          />
          <div className="inject-actions">
            <button className="btn-inject" onClick={inject}>
              🚀 Injecter à tous les utilisateurs
            </button>
            <button className="btn-clear" onClick={() => setCode("")}>
              🗑️ Effacer
            </button>
          </div>
          {msg && <div className="inject-msg">{msg}</div>}
        </div>
      )}

      {/* ═══ TAB MESSAGES ═══ */}
      {tab === "messages" && (
        <div className="admin-panel">
          <h2>💬 Conversations privées ({convs.length})</h2>
          {convs.length === 0 && (
            <p className="admin-empty">Aucune conversation privée.</p>
          )}
          <div className="conv-list">
            {convs.map((c, i) => (
              <button
                key={i}
                className={`conv-chip ${selectedConv === c ? "active" : ""}`}
                onClick={() => openConv(c)}
              >
                <span
                  className="conv-avatar"
                  style={{ background: colorFromName(c.userA.username) }}
                >
                  {c.userA.username[0].toUpperCase()}
                </span>
                <span>{c.userA.username}</span>
                <span className="conv-arrow">↔</span>
                <span>{c.userB.username}</span>
                <span
                  className="conv-avatar"
                  style={{ background: colorFromName(c.userB.username) }}
                >
                  {c.userB.username[0].toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {selectedConv && (
            <div className="conv-viewer">
              <div className="conv-header">
                <h3>
                  {selectedConv.userA.username} ↔ {selectedConv.userB.username}
                </h3>
                <button
                  className="btn-close"
                  onClick={() => setSelectedConv(null)}
                >
                  ✕
                </button>
              </div>
              <div className="conv-messages">
                {convMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`conv-msg ${
                      m.sender.id === selectedConv.userA.id
                        ? "from-a"
                        : "from-b"
                    }`}
                  >
                    <div className="conv-msg-head">
                      <strong>{m.sender.username}</strong>
                      <small>{new Date(m.createdAt).toLocaleString()}</small>
                    </div>
                    <div className="conv-msg-body">{m.content}</div>
                  </div>
                ))}
                {convMessages.length === 0 && (
                  <p className="admin-empty">Aucun message.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB GAMES ═══ */}
      {tab === "games" && (
        <div className="admin-panel">
          <h2>🎴 Salons UNO ({unoRooms.length})</h2>
          {unoRooms.length === 0 && (
            <p className="admin-empty">Aucun salon UNO actif.</p>
          )}
          {unoRooms.map((r) => (
            <div key={r.id} className="game-row">
              <div className="game-info">
                <span className="game-icon">🎴</span>
                <div>
                  <div className="game-name">{r.name}</div>
                  <div className="game-meta">
                    {r.players.length}/6 joueurs ·{" "}
                    {r.status === "waiting" ? "En attente" : "En cours"}
                  </div>
                </div>
              </div>
              <button
                className="btn-sm danger"
                onClick={() => deleteUnoRoom(r.id)}
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}

          <h2>♟️ Parties d'échecs ({chessRooms.length})</h2>
          {chessRooms.length === 0 && (
            <p className="admin-empty">Aucune partie d'échecs active.</p>
          )}
          {chessRooms.map((g) => (
            <div key={g.id} className="game-row">
              <div className="game-info">
                <span className="game-icon">♟️</span>
                <div>
                  <div className="game-name">{g.name}</div>
                  <div className="game-meta">
                    {g.white?.username || "?"}{" "}
                    {g.black ? `vs ${g.black.username}` : "(en attente)"} ·{" "}
                    {g.status}
                  </div>
                </div>
              </div>
              <button
                className="btn-sm danger"
                onClick={() => deleteChessGame(g.id)}
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TAB BANS ═══ */}
      {tab === "bans" && (
        <div className="admin-panel">
          <h2>📋 Bannissements actifs ({bans.length})</h2>
          {bans.length === 0 && <p className="admin-empty">Aucun ban actif.</p>}
          {bans.map((b) => (
            <div key={b.id} className="ban-row">
              <div className="ban-info">
                <div className="ban-email">📧 {b.email || "—"}</div>
                <div className="ban-reason">
                  Raison : {b.reason || "Non spécifiée"}
                </div>
              </div>
              <button className="btn-sm ok" onClick={() => removeBan(b.id)}>
                ✅ Débannir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 🎨 Couleur déterministe depuis un nom
function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
