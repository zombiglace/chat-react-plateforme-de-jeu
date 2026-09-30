import { useState, useRef, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const EMOJIS = ["😀", "😂", "😍", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "🔥", "🎉", "✅", "❌", "⭐", "🚀"];

export default function MessageInput({ onSend, roomId, privateWith }) {
  const socket = useSocket();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const taRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false); // pour ne pas envoyer 50 events par seconde

  // Auto-resize du textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 160) + "px";
    }
  }, [text]);

  // Prévient le serveur qu'on est en train d'écrire
  const signalTyping = (isTyping) => {
    if (!socket) return;
    if (privateWith) {
      socket.emit("chat:typing:private", {
        receiverId: privateWith.id,
        isTyping,
      });
    } else if (roomId) {
      socket.emit("chat:typing", { roomId, isTyping });
    }
    isTypingRef.current = isTyping;
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!socket) return;

    // À la première lettre, on prévient
    if (!isTypingRef.current && value.length > 0) {
      signalTyping(true);
    }

    // À chaque frappe, on repousse la fin du "typing"
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) signalTyping(false);
    }, 1500);
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    onSend(text, "text");
    setText("");

    // On arrête l'indicateur tout de suite
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) signalTyping(false);

    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Si on change de salon, on nettoie
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) signalTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, privateWith?.id]);

  return (
    <form className="msg-input" onSubmit={submit}>
      <button type="button" onClick={() => setShowEmoji(!showEmoji)}>😀</button>

      {showEmoji && (
        <div className="emoji-pop">
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setText((t) => t + em);
                setShowEmoji(false);
                taRef.current?.focus();
              }}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={taRef}
        className="msg-textarea"
        placeholder="Écrire un message… (Entrée = envoyer, Shift+Entrée = nouvelle ligne)"
        value={text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        rows={1}
        spellCheck={false}
      />

      <button type="submit">Envoyer</button>
    </form>
  );
}
