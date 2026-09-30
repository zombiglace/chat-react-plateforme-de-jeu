import { useState, useRef, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const EMOJIS = [
  "😀", "😂", "😍", "😎", "🤔", "😢", "😡",
  "👍", "👎", "❤️", "🔥", "🎉", "✅", "❌", "⭐", "🚀",
];

export default function MessageInput({ onSend, roomId, privateWith }) {
  const socket = useSocket();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const taRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height =
        Math.min(taRef.current.scrollHeight, 160) + "px";
    }
  }, [text]);

  const signalTyping = (isTyping) => {
    if (!socket) {
      console.log("❌ signalTyping: pas de socket");
      return;
    }
    if (privateWith) {
      console.log("📤 emit chat:typing:private", {
        receiverId: privateWith.id,
        isTyping,
      });
      socket.emit("chat:typing:private", {
        receiverId: privateWith.id,
        isTyping,
      });
    } else if (roomId) {
      console.log("📤 emit chat:typing", { roomId, isTyping });
      socket.emit("chat:typing", { roomId, isTyping });
    } else {
      console.log("❌ signalTyping: pas de roomId ni privateWith");
    }
    isTypingRef.current = isTyping;
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!socket) return;

    if (!isTypingRef.current && value.length > 0) {
      signalTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) signalTyping(false);
    }, 1500);
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    onSend(text);
    setText("");

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

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) signalTyping(false);
    };
    // eslint-disable-next-line
  }, [roomId, privateWith?.id]);

  return (
    <form className="msg-input" onSubmit={submit}>
      <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
        😀
      </button>

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
        placeholder="Écrire un message…"
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
