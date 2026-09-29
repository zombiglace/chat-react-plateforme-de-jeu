import { useEffect, useState } from "react";
import api from "../api/axios";
import Uno from "./Uno";
import Chess from "./Chess";

const TABS = [
  { id: "uno", label: "UNO", sub: "2 à 6 joueurs" },
  { id: "chess", label: "Échecs", sub: "1 contre 1" },
  { id: "rank", label: "Classement", sub: "Top joueurs" },
];

export default function Games() {
  const [tab, setTab] = useState("uno");
  const [ranks, setRanks] = useState({ uno: [], chess: [] });
  const [loadingRanks, setLoadingRanks] = useState(false);

  useEffect(() => {
    if (tab !== "rank") return;
    setLoadingRanks(true);
    api
      .get("/leaderboard")
      .then((r) => setRanks(r.data))
      .finally(() => setLoadingRanks(false));
  }, [tab]);

  return (
    <div className="games-page">
      <header className="games-head">
        <h1>Jeux</h1>
        <p>Affronte les autres élèves en direct</p>
      </header>

      <nav className="games-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`game-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="gt-label">{t.label}</span>
            <span className="gt-sub">{t.sub}</span>
          </button>
        ))}
      </nav>

      <div className="games-body">
        {tab === "uno" && <Uno />}
        {tab === "chess" && <Chess />}
        {tab === "rank" &&
          (loadingRanks ? (
            <p className="games-empty">Chargement…</p>
          ) : (
            <div className="rank-wrap">
              <div className="rank-col">
                <h3>UNO</h3>
                {ranks.uno.filter((u) => u.unoWins > 0).length === 0 ? (
                  <p className="games-empty">Aucune victoire pour l'instant.</p>
                ) : (
                  <ol className="rank-list">
                    {ranks.uno
                      .filter((u) => u.unoWins > 0)
                      .map((u, i) => (
                        <li key={u.id}>
                          <span className={`rk rk-${i + 1}`}>{i + 1}</span>
                          <span className="rk-name">{u.username}</span>
                          <span className="rk-score">{u.unoWins}</span>
                        </li>
                      ))}
                  </ol>
                )}
              </div>

              <div className="rank-col">
                <h3>Échecs</h3>
                {ranks.chess.filter((u) => u.chessWins > 0).length === 0 ? (
                  <p className="games-empty">Aucune victoire pour l'instant.</p>
                ) : (
                  <ol className="rank-list">
                    {ranks.chess
                      .filter((u) => u.chessWins > 0)
                      .map((u, i) => (
                        <li key={u.id}>
                          <span className={`rk rk-${i + 1}`}>{i + 1}</span>
                          <span className="rk-name">{u.username}</span>
                          <span className="rk-score">{u.chessWins}</span>
                        </li>
                      ))}
                  </ol>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
