import { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

// Palette de couleurs pour les avatars (déterministe selon le pseudo)
function colorFromName(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 65%, 45%)`;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const loc = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [privateWith, setPrivateWith] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api.get("/rooms").then((r) => {
      setRooms(r.data);
      if (r.data[0]) setCurrentRoom(r.data[0]);
    });
  }, []);

  useEffect(() => {
    const load = () =>
      api
        .get("/users")
        .then((r) => setUsers(r.data.filter((u) => u.id !== user.id)));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [user.id]);

  useEffect(() => {
    if (!socket) return;
    const onBanned = ({ reason }) => {
      alert("🚫 Tu as été banni" + (reason ? " : " + reason : ""));
      logout();
    };
    socket.on("user:banned", onBanned);
    return () => socket.off("user:banned", onBanned);
  }, [socket, logout]);

  const selectRoom = (r) => {
    setCurrentRoom(r);
    setPrivateWith(null);
    if (loc.pathname !== "/") navigate("/");
  };

  const selectPrivate = (u) => {
    setPrivateWith(u);
    if (loc.pathname !== "/") navigate("/");
  };

  const onlineCount = users.filter((u) => u.online).length;

  return (
    <div className={`app-layout ${collapsed ? "sb-collapsed" : ""}`}>
      <aside className="sidebar">
        {/* ═══ HEADER : Logo + User ═══ */}
        <div className="sb-header">
          <div className="sb-logo-row">
            <div className="sb-logo">
              <img
                src="/images/logo.png"
                alt="Logo Messagerie"
                className="sb-logo-img"
                width="48"
                height="48"
              />
              <span className="sb-logo-text">Messagerie</span>
            </div>
            <button
              className="sb-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Déplier" : "Replier"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <div className="sb-user">
            <span
              className="sb-avatar"
              style={{ background: colorFromName(user.username) }}
            >
              {user.username[0].toUpperCase()}
            </span>
            <div className="sb-user-info">
              <span className="sb-username">{user.username}</span>
              <span className={`sb-role sb-role-${user.role}`}>{user.role}</span>
            </div>
          </div>
        </div>

        {/* ═══ NAVIGATION ═══ */}
        <nav className="sb-nav">
          <Link
            to="/"
            className={`sb-nav-item ${loc.pathname === "/" ? "active" : ""}`}
            title="Chat"
          >
            <span className="sb-icon">💬</span>
            <span className="sb-label">Chat</span>
          </Link>
          <Link
            to="/documents"
            className={`sb-nav-item ${
              loc.pathname === "/documents" ? "active" : ""
            }`}
            title="Documents"
          >
            <span className="sb-icon">📁</span>
            <span className="sb-label">Documents</span>
          </Link>
          <Link
            to="/games"
            className={`sb-nav-item ${
              loc.pathname === "/games" ? "active" : ""
            }`}
            title="Jeux"
          >
            <span className="sb-icon">🎮</span>
            <span className="sb-label">Jeux</span>
          </Link>
          <Link
            to="/mon-compte"
            className={`sb-nav-item ${
              loc.pathname === "/mon-compte" ? "active" : ""
            }`}
            title="Mon compte"
          >
            <span className="sb-icon">👤</span>
            <span className="sb-label">Mon compte</span>
          </Link>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className={`sb-nav-item ${
                loc.pathname === "/admin" ? "active" : ""
              }`}
              title="Admin"
            >
              <span className="sb-icon">🧑‍💼</span>
              <span className="sb-label">Admin</span>
            </Link>
          )}
        </nav>

        {/* ═══ SALONS ═══ */}
        <div className="sb-section">
          <div className="sb-section-title">
            <span className="sb-section-icon">#</span>
            <span className="sb-section-text">Salons</span>
            <span className="sb-section-count">{rooms.length}</span>
          </div>
          <div className="sb-list">
            {rooms.map((r) => (
              <button
                key={r.id}
                className={`sb-item ${
                  currentRoom?.id === r.id && !privateWith ? "active" : ""
                }`}
                onClick={() => {
                  setPrivateWith(null);
                  selectRoom(r);
                }}
                title={r.name}
              >
                <span className="sb-hash">#</span>
                <span className="sb-uname">{r.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ UTILISATEURS ═══ */}
        <div className="sb-section sb-section-grow">
          <div className="sb-section-title">
            <span className="sb-section-icon">👥</span>
            <span className="sb-section-text">Utilisateurs</span>
            <span className="sb-section-count online">{onlineCount}</span>
          </div>
          <div className="sb-list">
            {users.map((u) => (
              <button
                key={u.id}
                className={`sb-item sb-user-item ${
                  privateWith?.id === u.id ? "active" : ""
                }`}
                onClick={() => selectPrivate(u)}
                title={u.username}
              >
                <span className="sb-avatar-sm" style={{ background: colorFromName(u.username) }}>
                  {u.username[0].toUpperCase()}
                </span>
                <span className="sb-uname">{u.username}</span>
                <span className={`sb-dot ${u.online ? "online" : ""}`} />
              </button>
            ))}
            {users.length === 0 && (
              <p className="sb-empty">Aucun autre utilisateur</p>
            )}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="sb-footer">
          <button className="sb-logout" onClick={logout}>
            <span className="sb-icon">🚪</span>
            <span className="sb-label">Déconnexion</span>
          </button>

          <div className="sb-legal-links">
            <Link to="/mentions-legales">Mentions</Link>
            <span>·</span>
            <Link to="/confidentialite">Confidentialité</Link>
            <span>·</span>
            <Link to="/accessibilite">Accessibilité</Link>
            <span>·</span>
            {/* 🎵 Easter egg */}
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              target="_blank"
              rel="noreferrer"
              className="sb-legal-rickroll"
            >
              Lael
            </a>
          </div>

          <div className="sb-copyright">© 2026 Julien Traineau</div>
        </div>
      </aside>

      <main className="app-main">
        <Outlet
          context={{
            currentRoom,
            setCurrentRoom,
            privateWith,
            setPrivateWith,
          }}
        />
      </main>
    </div>
  );
}
