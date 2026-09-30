import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

// ⚠️ URL en dur — Vercel ne gère pas toujours les variables d'env
const API_URL = "https://chat-react-api.onrender.com";

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

    const s = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => console.log("✅ Socket connecté", s.id));
    s.on("connect_error", (e) => console.error("❌ Socket err:", e.message));

    setSocket(s);

    return () => {
      console.log("🔌 Fermeture socket");
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
