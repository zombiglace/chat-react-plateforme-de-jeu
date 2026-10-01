import { useEffect, useRef } from "react";

export default function MessageList({ messages, me, isAdmin, onDelete }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="messages" ref={boxRef}>
      {messages.map((m) => {
        const senderId = m.sender?.id || m.senderId;
        const isMe = senderId === me;
        const canDelete = isMe || isAdmin;

        return (
          <div key={m.id} className={`msg-row ${isMe ? "me" : "other"}`}>
            {!isMe && (
              <div className="msg-avatar">
                {(m.sender?.username || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="msg-content">
              {!isMe && <div className="msg-author">{m.sender?.username}</div>}
              <div className="msg-bubble-wrapper">
                <div className="msg-bubble">{m.content}</div>
                {canDelete && (
                  <button
                    className="msg-delete"
                    onClick={() => {
                      if (window.confirm(isMe ? "Supprimer ce message ?" : "Supprimer ce message (admin) ?")) {
                        onDelete(m.id);
                      }
                    }}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
