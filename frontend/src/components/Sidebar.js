import { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const loc = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [privateWith, setPrivateWith] = useState(null);

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

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sb-header">
          <div className="sb-logo">💬 Chat NSI</div>
          <div className="sb-user">
            <span className="sb-avatar">{user.username[0].toUpperCase()}</span>
            <div className="sb-user-info">
              <span className="sb-username">{user.username}</span>
              <span className={`sb-role sb-role-${user.role}`}>{user.role}</span>
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <Link
            to="/"
            className={`sb-nav-item ${loc.pathname === "/" ? "active" : ""}`}
          >
            <span className="sb-icon">💬</span> Chat
          </Link>
          <Link
            to="/documents"
            className={`sb-nav-item ${
              loc.pathname === "/documents" ? "active" : ""
            }`}
          >
            <span className="sb-icon">📁</span> Documents
          </Link>
          <Link
            to="/games"
            className={`sb-nav-item ${loc.pathname === "/games" ? "active" : ""}`}
          >
            <span className="sb-icon">🎮</span> Jeux
          </Link>
  <Link
    to="/mon-compte"
    className={`sb-nav-item ${loc.pathname === "/mon-compte" ? "active" : ""}`}
  >
    <span className="sb-icon">👤</span> Mon compte
  </Link>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className={`sb-nav-item ${loc.pathname === "/admin" ? "active" : ""}`}
            >
              <span className="sb-icon">🧑‍💼</span> Admin
            </Link>
          )}
        </nav>

        <div className="sb-section">
          <div className="sb-section-title">Salons</div>
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
              >
                <span className="sb-hash">#</span> {r.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sb-section sb-section-grow">
          <div className="sb-section-title">Utilisateurs ({users.length})</div>
          <div className="sb-list">
            {users.map((u) => (
              <button
                key={u.id}
                className={`sb-item ${privateWith?.id === u.id ? "active" : ""}`}
                onClick={() => selectPrivate(u)}
              >
                <span className={`sb-dot ${u.online ? "online" : ""}`} />
                <span className="sb-uname">{u.username}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sb-footer">
  <button className="sb-logout" onClick={logout}>
    🚪 Déconnexion
  </button>
  <div className="sb-legal-links">
    <Link to="/mentions-legales">Mentions légales</Link>
    <Link to="/confidentialite">Confidentialité</Link>
    <Link to="/accessibilite">Accessibilité</Link>
  </div>
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
