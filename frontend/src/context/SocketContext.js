import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }
    const token = localStorage.getItem("token");
    console.log("🔌 Connexion socket…");

    const s = io(API, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    s.on("connect", () => console.log("✅ Socket connecté", s.id));
    s.on("disconnect", (r) => console.log("🔌 Socket déconnecté:", r));
    s.on("connect_error", (e) => console.error("❌ Socket erreur:", e.message));

    setSocket(s);

    return () => {
      console.log("🔌 Fermeture socket");
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id]); // ✅ dépend uniquement de l'ID utilisateur (stable)

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);