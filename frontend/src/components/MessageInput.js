import { useState, useRef, useEffect } from "react";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "😎",
  "🤔",
  "😢",
  "😡",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "🎉",
  "✅",
  "❌",
  "⭐",
  "🚀",
];

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const taRef = useRef(null);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height =
        Math.min(taRef.current.scrollHeight, 160) + "px";
    }
  }, [text]);

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSend(text, "text");
    setText("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

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
        placeholder="Écrire un message… (Entrée = envoyer, Shift+Entrée = nouvelle ligne)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        spellCheck={false}
      />
      <button type="submit">Envoyer</button>
    </form>
  );
}
