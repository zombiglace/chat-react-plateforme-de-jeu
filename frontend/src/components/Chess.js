import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

function parseFen(fen) {
  const board = [];
  const rows = fen.split(" ")[0].split("/");
  for (const row of rows) {
    const cells = [];
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) cells.push(null);
      else cells.push(ch);
    }
    board.push(cells);
  }
  return board;
}

function ChessBoard({ fen, onMove, myTurn, myColor }) {
  const [selected, setSelected] = useState(null);
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const board = parseFen(fen);
  const flipped = myColor === "b";

  const displayBoard = flipped
    ? board
        .slice()
        .reverse()
        .map((row) => row.slice().reverse())
    : board;

  const visualToSquare = (vr, vc) => {
    const r = flipped ? 7 - vr : vr;
    const c = flipped ? 7 - vc : vc;
    return files[c] + (8 - r);
  };

  const handleClick = (vr, vc) => {
    if (!myTurn) return;
    const sq = visualToSquare(vr, vc);

    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      onMove(selected, sq);
      setSelected(null);
      return;
    }

    const piece = displayBoard[vr][vc];
    if (!piece) return;
    const isWhite = piece === piece.toUpperCase();
    if (myColor === "w" && !isWhite) return;
    if (myColor === "b" && isWhite) return;
    setSelected(sq);
  };

  return (
    <div className="chess-board">
      {displayBoard.map((row, vr) => (
        <div key={vr} className="chess-row">
          {row.map((piece, vc) => {
            const isLight = (vr + vc) % 2 === 0;
            const sq = visualToSquare(vr, vc);
            const isSel = selected === sq;
            return (
              <div
                key={vc}
                className={`chess-sq ${isLight ? "light" : "dark"} ${isSel ? "selected" : ""}`}
                onClick={() => handleClick(vr, vc)}
              >
                {piece && (
                  <span
                    className={`chess-piece ${
                      piece === piece.toUpperCase() ? "white" : "black"
                    }`}
                  >
                    {
                      PIECES[piece === piece.toUpperCase() ? "w" : "b"][
                        piece.toLowerCase()
                      ]
                    }
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const STORAGE_KEY = (uid) => `chess:game:${uid}`;

export default function Chess() {
  const socket = useSocket();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [state, setState] = useState(null);
  const [toast, setToast] = useState("");
  const [reconnecting, setReconnecting] = useState(false);

  // 🔄 Auto-rejoin
  useEffect(() => {
    if (!socket) return;
    socket.emit("chess:list", (l) => setRooms(l));

    const saved = localStorage.getItem(STORAGE_KEY(user.id));
    if (saved) {
      setReconnecting(true);
      socket.emit("chess:join", { gameId: saved }, (r) => {
        setReconnecting(false);
        if (r.ok) {
          setGameId(saved);
        } else {
          localStorage.removeItem(STORAGE_KEY(user.id));
          setGameId(null);
          setState(null);
        }
      });
    }

    const onRooms = (l) => setRooms(l);
    const onState = (s) => setState(s);
    const onErr = (e) => setToast("⚠️ " + e.message);
    const onDeleted = () => {
      localStorage.removeItem(STORAGE_KEY(user.id));
      setToast("⏱️ Partie terminée — retour au lobby");
      setGameId(null);
      setState(null);
    };

    socket.on("chess:rooms", onRooms);
    socket.on("chess:state", onState);
    socket.on("chat:error", onErr);
    socket.on("chess:deleted", onDeleted);

    return () => {
      socket.off("chess:rooms", onRooms);
      socket.off("chess:state", onState);
      socket.off("chat:error", onErr);
      socket.off("chess:deleted", onDeleted);
    };
  }, [socket, user.id]);

  const create = () => {
    const name = prompt("Nom de la partie ?", `Partie de ${user.username}`);
    if (!name) return;
    socket.emit("chess:create", { name }, (r) => {
      if (r.ok) {
        setGameId(r.gameId);
        localStorage.setItem(STORAGE_KEY(user.id), r.gameId);
      }
    });
  };

  const join = (id) => {
    socket.emit("chess:join", { gameId: id }, (r) => {
      if (r.ok) {
        setGameId(id);
        localStorage.setItem(STORAGE_KEY(user.id), id);
      } else setToast("❌ " + r.error);
    });
  };

  const leave = () => {
    if (gameId) socket.emit("chess:leave", { gameId });
    localStorage.removeItem(STORAGE_KEY(user.id));
    setGameId(null);
    setState(null);
  };

  if (!socket) return <div className="page">Connexion…</div>;
  if (reconnecting)
    return <div className="page">🔄 Reconnexion à ta partie…</div>;

  if (!gameId) {
    return (
      <div className="chess-lobby">
        <button className="btn-primary" onClick={create}>
          ➕ Créer une partie
        </button>
        <h3>Parties ({rooms.length})</h3>
        <ul className="uno-rooms">
          {rooms.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.name}</strong> — {r.white?.username || "?"}{" "}
                {r.black ? `vs ${r.black.username}` : "(en attente)"}
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

  if (!state) return <div className="page">Chargement de la partie…</div>;

  const myColor =
    state.white?.id === user.id
      ? "w"
      : state.black?.id === user.id
        ? "b"
        : null;
  const myTurn = myColor === state.turn;
  const opponent = myColor === "w" ? state.black : state.white;

  return (
    <div className="chess-page">
      <div className="chess-header">
        <button onClick={leave}>← Quitter</button>
        <h2>{state.name}</h2>
        <button
          className="btn-resign"
          onClick={() => socket.emit("chess:resign", { gameId })}
        >
          🏳️ Abandonner
        </button>
      </div>

      {toast && (
        <div className="toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}

      <div className="chess-info">
        <span className={`turn-pill ${myTurn ? "me" : ""}`}>
          {state.status === "waiting"
            ? "En attente d'un adversaire"
            : state.status === "finished"
              ? `🏆 ${state.winner} gagne !`
              : myTurn
                ? "🟢 À toi de jouer"
                : `⏳ Tour de ${opponent?.username}`}
        </span>
        {myColor && (
          <span className="color-pill">
            Tu joues les {myColor === "w" ? "Blancs" : "Noirs"}
          </span>
        )}
      </div>

      {myColor ? (
        <ChessBoard
          fen={state.fen}
          myTurn={myTurn && state.status === "playing"}
          myColor={myColor}
          onMove={(from, to) =>
            socket.emit("chess:move", { gameId, from, to, promotion: "q" })
          }
        />
      ) : (
        <p>Tu regardes la partie…</p>
      )}

      {state.status === "finished" && (
        <div className="auto-close-hint-box">
          ⏱️ La partie se fermera automatiquement dans quelques secondes…
        </div>
      )}

      {state.lastMove && (
        <div className="chess-last-move">
          Dernier coup : {state.lastMove.san} ({state.lastMove.from} →{" "}
          {state.lastMove.to})
        </div>
      )}
    </div>
  );
}
