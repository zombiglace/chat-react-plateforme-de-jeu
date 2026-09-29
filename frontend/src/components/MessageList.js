import { useEffect, useRef } from "react";

export default function MessageList({ messages, me }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="messages" ref={boxRef}>
      {messages.map((m) => {
        const isMe = (m.sender?.id || m.senderId) === me;
        return (
          <div key={m.id} className={`msg-row ${isMe ? "me" : "other"}`}>
            {!isMe && (
              <div className="msg-avatar">
                {(m.sender?.username || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="msg-content">
              {!isMe && <div className="msg-author">{m.sender?.username}</div>}
              <div className="msg-bubble">{m.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
