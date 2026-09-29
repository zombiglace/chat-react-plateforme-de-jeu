import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const COLORS = ["red", "yellow", "green", "blue"];
const HEX = {
  red: "#dc2626",
  yellow: "#eab308",
  green: "#16a34a",
  blue: "#2563eb",
  wild: "#1e293b",
};

function label(value) {
  switch (value) {
    case "skip":
      return { m: "⊘", s: "PASSE" };
    case "reverse":
      return { m: "⇄", s: "SENS" };
    case "draw2":
      return { m: "+2", s: "PIOCHE" };
    case "wild":
      return { m: "★", s: "COULEUR" };
    case "wild4":
      return { m: "+4", s: "JOKER" };
    default:
      return { m: value, s: "" };
  }
}

function Card({ card, onClick, disabled, big, hidden }) {
  if (hidden) {
    return (
      <div className="uno-card uno-card-back">
        <span className="uno-back-logo">UNO</span>
      </div>
    );
  }
  const l = label(card.value);
  const isWild = card.color === "wild";
  return (
    <button
      className={`uno-card ${big ? "uno-card-big" : ""} ${isWild ? "uno-card-wild" : ""}`}
      style={{
        background: isWild
          ? "conic-gradient(from 0deg, #dc2626 0 25%, #eab308 25% 50%, #16a34a 50% 75%, #2563eb 75% 100%)"
          : HEX[card.color],
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="uno-corner tl">{l.m}</span>
      <span className="uno-card-center">
        <span className="uno-main">{l.m}</span>
        {l.s && <span className="uno-sub">{l.s}</span>}
      </span>
      <span className="uno-corner br">{l.m}</span>
    </button>
  );
}

const STORAGE_KEY = (uid) => `uno:room:${uid}`;

export default function Uno() {
  const socket = useSocket();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [state, setState] = useState(null);
  const [pickingWild, setPickingWild] = useState(null);
  const [toast, setToast] = useState("");
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.emit("uno:list", (l) => setRooms(l));

    const saved = localStorage.getItem(STORAGE_KEY(user.id));
    if (saved) {
      setReconnecting(true);
      socket.emit("uno:join", { roomId: saved }, (r) => {
        setReconnecting(false);
        if (r.ok) setRoomId(saved);
        else {
          localStorage.removeItem(STORAGE_KEY(user.id));
          setRoomId(null);
          setState(null);
        }
      });
    }

    const onRooms = (l) => setRooms(l);
    const onState = (s) => setState(s);
    const onErr = (e) => setToast("⚠️ " + e.message);
    const onKick = (d) => {
      localStorage.removeItem(STORAGE_KEY(user.id));
      setRoomId(null);
      setState(null);
      setToast("⏱️ " + (d?.reason || "Retour au lobby"));
    };

    socket.on("uno:rooms", onRooms);
    socket.on("uno:state", onState);
    socket.on("chat:error", onErr);
    socket.on("uno:kicked", onKick);

    return () => {
      socket.off("uno:rooms", onRooms);
      socket.off("uno:state", onState);
      socket.off("chat:error", onErr);
      socket.off("uno:kicked", onKick);
    };
  }, [socket, user.id]);

  const create = () => {
    if (!socket) return alert("Pas connecté");
    const name = prompt("Nom du salon ?", `Salon de ${user.username}`);
    if (!name) return;
    socket.emit("uno:create", { name }, (r) => {
      if (r.ok) {
        setRoomId(r.roomId);
        localStorage.setItem(STORAGE_KEY(user.id), r.roomId);
      }
    });
  };

  const join = (id) => {
    if (!socket) return;
    socket.emit("uno:join", { roomId: id }, (r) => {
      if (r.ok) {
        setRoomId(id);
        localStorage.setItem(STORAGE_KEY(user.id), id);
      } else setToast("❌ " + r.error);
    });
  };

  const leave = () => {
    if (roomId && socket) socket.emit("uno:leave", { roomId });
    localStorage.removeItem(STORAGE_KEY(user.id));
    setRoomId(null);
    setState(null);
  };

  const myTurn = state && state.currentTurn === user.id;
  const me = state?.players.find((p) => p.userId === user.id);

  const play = (idx, card) => {
    if (card.color === "wild") setPickingWild(idx);
    else socket.emit("uno:play", { roomId, cardIndex: idx });
  };

  const pickColor = (c) => {
    socket.emit("uno:play", { roomId, cardIndex: pickingWild, chosenColor: c });
    setPickingWild(null);
  };

  if (!socket) return <div className="uno-page">Connexion…</div>;
  if (reconnecting)
    return <div className="uno-page">🔄 Reconnexion à ta partie…</div>;

  if (!roomId) {
    return (
      <div className="uno-page">
        <h2>Salons UNO</h2>
        <button className="btn-primary" onClick={create}>
          ➕ Créer un salon
        </button>

        {rooms.length === 0 && (
          <p style={{ color: "#64748b", marginTop: "1rem" }}>Aucun salon.</p>
        )}
        <ul className="uno-rooms">
          {rooms.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.name}</strong> — {r.players.length}/6{" "}
                <em>({r.status === "waiting" ? "en attente" : r.status})</em>
              </div>
              <button
                onClick={() => join(r.id)}
                disabled={r.status !== "waiting"}
              >
                Rejoindre
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="uno-page">
        <p>Chargement du salon…</p>
        <button className="btn-primary" onClick={leave}>
          ← Quitter
        </button>
      </div>
    );
  }

  return (
    <div className="uno-page">
      <div className="uno-header">
        <button onClick={leave}>← Quitter</button>
        <h2>{state.name}</h2>
        <span className={`status-pill status-${state.status}`}>
          {state.status === "waiting"
            ? "En attente"
            : state.status === "playing"
              ? "En jeu"
              : "Terminé"}
        </span>
      </div>

      {toast && (
        <div className="toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}

      {state.status === "waiting" && (
        <div className="uno-waiting">
          <h3>Joueurs ({state.players.length}/6)</h3>
          <ul>
            {state.players.map((p) => (
              <li key={p.userId}>
                {p.userId === user.id ? "⭐ " : ""}
                {p.username}
                {p.userId === state.hostId && " 👑"}
              </li>
            ))}
          </ul>
          {state.hostId === user.id && (
            <button
              className="btn-primary"
              disabled={state.players.length < 2}
              onClick={() => socket.emit("uno:start", { roomId })}
            >
              ▶️ Démarrer la partie
            </button>
          )}
          {state.hostId !== user.id && <p>En attente de l'hôte…</p>}
        </div>
      )}

      {state.status === "playing" && (
        <div className="uno-table">
          <div className="uno-opponents">
            {state.players
              .filter((p) => p.userId !== user.id)
              .map((p) => (
                <div
                  key={p.userId}
                  className={`opponent ${state.currentTurn === p.userId ? "active" : ""}`}
                >
                  <div className="opp-name">
                    {p.username}
                    {p.calledUno && " 🗣️ UNO!"}
                  </div>
                  <div className="opp-mini-stack">
                    <Card card={{ color: "wild", value: "?" }} hidden />
                    <span className="opp-count">{p.cards}</span>
                  </div>
                </div>
              ))}
          </div>

          {state.pendingDraw > 0 && (
            <div className="uno-pending">
              ⚠️ +{state.pendingDraw} en attente — joue un{" "}
              {state.pendingDraw >= 4 ? "+4" : "+2"} ou pioche
            </div>
          )}

          <div className="uno-center">
            <div className="pile-left">
              <div className="uno-deck-stack">
                <Card card={{ color: "wild", value: "?" }} hidden />
                <span className="deck-count">{state.deckCount}</span>
              </div>
              <button
                className="btn-primary"
                disabled={!myTurn}
                onClick={() => socket.emit("uno:draw", { roomId })}
              >
                🎴 Piocher {state.pendingDraw > 0 && `(+${state.pendingDraw})`}
              </button>
            </div>

            <div className="pile-right">
              <div
                className="current-color-pill"
                style={{ background: HEX[state.currentColor] }}
              >
                {state.currentColor}
              </div>
              <Card card={state.topCard || { color: "wild", value: "?" }} big />
              <div className="direction-indicator">
                Sens : {state.direction === 1 ? "⟳" : "⟲"}
              </div>
            </div>
          </div>

          <div className="uno-myhand">
            <div className={`turn-info ${myTurn ? "my-turn" : ""}`}>
              {myTurn ? "🟢 À toi de jouer !" : "⏳ En attente…"}
            </div>
            <div className="hand">
              {state.myHand && state.myHand.length > 0 ? (
                state.myHand.map((c, i) => (
                  <Card
                    key={i}
                    card={c}
                    disabled={!myTurn}
                    onClick={() => play(i, c)}
                  />
                ))
              ) : (
                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Tes cartes vont apparaître…
                </p>
              )}
            </div>
            {me?.cards === 1 && !me.calledUno && (
              <button
                className="btn-uno"
                onClick={() => socket.emit("uno:uno", { roomId })}
              >
                📣 DIRE UNO !
              </button>
            )}
          </div>

          {pickingWild !== null && (
            <div className="color-picker">
              <p>Choisis une couleur :</p>
              <div className="color-picker-row">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className="color-choice"
                    style={{ background: HEX[c] }}
                    onClick={() => pickColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {state.status === "finished" && (
        <div className="uno-finished">
          <h2>🏆 {state.winner} a gagné !</h2>
          <p className="auto-close-hint">
            Le salon se fermera automatiquement…
          </p>
          <button className="btn-primary" onClick={leave}>
            Retour au lobby
          </button>
        </div>
      )}
    </div>
  );
}
