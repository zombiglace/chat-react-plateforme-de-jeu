import { useEffect, useState } from "react";
import api from "../api/axios";
import Uno from "./Uno";
import Chess from "./Chess";

const TABS = [
  {
    id: "uno",
    label: "UNO",
    sub: "2 à 6 joueurs",
    icon: "🎴",
    gradient: "linear-gradient(135deg, #dc2626, #f59e0b)",
  },
  {
    id: "chess",
    label: "Échecs",
    sub: "1 contre 1",
    icon: "♟️",
    gradient: "linear-gradient(135deg, #475569, #1e293b)",
  },
  {
    id: "rank",
    label: "Classement",
    sub: "Top joueurs",
    icon: "🏆",
    gradient: "linear-gradient(135deg, #fbbf24, #d97706)",
  },
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
      .catch(() => setRanks({ uno: [], chess: [] }))
      .finally(() => setLoadingRanks(false));
  }, [tab]);

  const unoTop = ranks.uno.filter((u) => u.unoWins > 0);
  const chessTop = ranks.chess.filter((u) => u.chessWins > 0);
  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="games-page">
      {/* ═══ HEADER ═══ */}
      <header className="games-header">
        <div className="games-header-icon">🎮</div>
        <div className="games-header-text">
          <h1>Jeux</h1>
          <p>Affronte les autres en temps réel</p>
        </div>
      </header>

      {/* ═══ TABS ═══ */}
      <nav className="games-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`game-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
            style={tab === t.id ? { background: t.gradient } : {}}
          >
            <span className="gt-icon">{t.icon}</span>
            <span className="gt-content">
              <span className="gt-label">{t.label}</span>
              <span className="gt-sub">{t.sub}</span>
            </span>
          </button>
        ))}
      </nav>

      {/* ═══ CONTENU ═══ */}
      <div className="games-content">
        {/* Titre dynamique */}
        <div className="games-content-head">
          <span className="games-content-icon">{activeTab.icon}</span>
          <h2 className="games-content-title">{activeTab.label}</h2>
        </div>

        <div className="games-content-body">
          {tab === "uno" && <Uno />}
          {tab === "chess" && <Chess />}

          {tab === "rank" && (
            <>
              {loadingRanks ? (
                <div className="games-loading">
                  <div className="games-spinner"></div>
                  <p>Chargement du classement…</p>
                </div>
              ) : (
                <div className="rank-wrap">
                  {/* Classement UNO */}
                  <div className="rank-col">
                    <div className="rank-col-head">
                      <span className="rank-col-icon">🎴</span>
                      <h3>UNO</h3>
                      <span className="rank-col-count">{unoTop.length}</span>
                    </div>

                    {unoTop.length === 0 ? (
                      <div className="rank-empty">
                        <span className="rank-empty-icon">🎴</span>
                        <p>Aucune victoire pour l'instant</p>
                      </div>
                    ) : (
                      <ol className="rank-list">
                        {unoTop.map((u, i) => (
                          <li key={u.id} className={i < 3 ? `top-${i + 1}` : ""}>
                            <span className={`rk rk-${i + 1}`}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                            </span>
                            <span className="rk-name">{u.username}</span>
                            <span className="rk-score">
                              {u.unoWins}
                              <small>victoire{u.unoWins > 1 ? "s" : ""}</small>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Classement Échecs */}
                  <div className="rank-col">
                    <div className="rank-col-head">
                      <span className="rank-col-icon">♟️</span>
                      <h3>Échecs</h3>
                      <span className="rank-col-count">{chessTop.length}</span>
                    </div>

                    {chessTop.length === 0 ? (
                      <div className="rank-empty">
                        <span className="rank-empty-icon">♟️</span>
                        <p>Aucune victoire pour l'instant</p>
                      </div>
                    ) : (
                      <ol className="rank-list">
                        {chessTop.map((u, i) => (
                          <li key={u.id} className={i < 3 ? `top-${i + 1}` : ""}>
                            <span className={`rk rk-${i + 1}`}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                            </span>
                            <span className="rk-name">{u.username}</span>
                            <span className="rk-score">
                              {u.chessWins}
                              <small>victoire{u.chessWins > 1 ? "s" : ""}</small>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
