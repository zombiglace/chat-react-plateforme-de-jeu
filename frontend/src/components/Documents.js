import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const EXT_ICONS = {
  pdf: "📕", doc: "📘", docx: "📘", txt: "📄", md: "📝",
  png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️", svg: "🖼️",
  mp4: "🎬", mov: "🎬", avi: "🎬", mkv: "🎬",
  mp3: "🎵", wav: "🎵", ogg: "🎵",
  zip: "📦", rar: "📦", tar: "📦", gz: "📦",
  xls: "📊", xlsx: "📊", csv: "📊",
  ppt: "📽️", pptx: "📽️",
  js: "💻", py: "💻", html: "💻", css: "💻", json: "💻",
};

function getExt(filename = "") {
  return filename.split(".").pop().toLowerCase();
}

function getIcon(filename) {
  return EXT_ICONS[getExt(filename)] || "📎";
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Documents() {
  const { user } = useAuth();
  const socket = useSocket();
  const [docs, setDocs] = useState([]);
  const [pinnedList, setPinnedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // 📥 Charge le manifest
  useEffect(() => {
    fetch("/upload/manifest.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  // 📌 Charge les épinglés
  const loadPinned = () => {
    api.get("/documents/pinned").then((r) => setPinnedList(r.data));
  };

  useEffect(() => {
    loadPinned();
  }, []);

  // 📡 Pin temps réel
  useEffect(() => {
    if (!socket) return;
    const onPinned = ({ filename, pinned }) => {
      setPinnedList((prev) => {
        if (pinned) return prev.includes(filename) ? prev : [...prev, filename];
        return prev.filter((f) => f !== filename);
      });
    };
    socket.on("document:pinned", onPinned);
    return () => socket.off("document:pinned", onPinned);
  }, [socket]);

  // 📌 Toggle pin
  const togglePin = async (doc, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.post("/documents/pin", {
        filename: doc.filename,
      });
      setPinnedList((prev) =>
        data.pinned ? [...prev, doc.filename] : prev.filter((f) => f !== doc.filename)
      );
    } catch (e) {
      alert("Erreur : " + (e.response?.data?.message || e.message));
    }
  };

  // 🔀 Fusion + tri
  const merged = docs
    .map((d) => ({ ...d, pinned: pinnedList.includes(d.filename) }))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      return (a.name || "").localeCompare(b.name || "", "fr");
    });

  // 🔍 Filtres
  const filtered = merged.filter((d) => {
    const q = query.toLowerCase();
    const matchQuery =
      !query ||
      (d.name || "").toLowerCase().includes(q) ||
      (d.filename || "").toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q);

    if (!matchQuery) return false;

    if (filter === "pinned") return d.pinned;
    if (filter === "pdf") return getExt(d.filename) === "pdf";
    if (filter === "img") return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(getExt(d.filename));
    if (filter === "other") return !["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg"].includes(getExt(d.filename));
    return true;
  });

  const pinnedCount = merged.filter((d) => d.pinned).length;

  return (
    <div className="docs-page">
      {/* ═══ HEADER ═══ */}
      <div className="docs-header">
        <div className="docs-header-icon">📁</div>
        <div className="docs-header-text">
          <h1>Documents partagés</h1>
          <p>
            {docs.length} fichier{docs.length > 1 ? "s" : ""}
            {pinnedCount > 0 && ` · ${pinnedCount} épinglé${pinnedCount > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ═══ TOOLBAR ═══ */}
      <div className="docs-toolbar">
        <div className="docs-search-wrap">
          <span className="docs-search-icon">🔍</span>
          <input
            className="docs-search"
            placeholder="Rechercher un document…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="docs-clear" onClick={() => setQuery("")}>✕</button>
          )}
        </div>

        <div className="docs-filters">
          <button
            className={`docs-filter ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tout
          </button>
          <button
            className={`docs-filter ${filter === "pinned" ? "active" : ""}`}
            onClick={() => setFilter("pinned")}
          >
            📌 Épinglés
          </button>
          <button
            className={`docs-filter ${filter === "pdf" ? "active" : ""}`}
            onClick={() => setFilter("pdf")}
          >
            📕 PDF
          </button>
          <button
            className={`docs-filter ${filter === "img" ? "active" : ""}`}
            onClick={() => setFilter("img")}
          >
            🖼️ Images
          </button>
          <button
            className={`docs-filter ${filter === "other" ? "active" : ""}`}
            onClick={() => setFilter("other")}
          >
            📎 Autres
          </button>
        </div>

        <div className="docs-view-toggle">
          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Vue grille"
          >
            ▦
          </button>
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="Vue liste"
          >
            ☰
          </button>
        </div>
      </div>

      {/* ═══ CONTENU ═══ */}
      {loading ? (
        <div className="docs-loading">
          <div className="docs-spinner"></div>
          <p>Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="docs-empty-state">
          <div className="docs-empty-icon">{query ? "🔍" : "📭"}</div>
          <h3>{query ? "Aucun résultat" : "Aucun document"}</h3>
          <p>
            {query
              ? `Aucun fichier ne correspond à « ${query} »`
              : "Les documents apparaîtront ici dès qu'ils seront ajoutés."}
          </p>
        </div>
      ) : (
        <div className={`docs-${viewMode === "grid" ? "grid" : "list"}`}>
          {filtered.map((d) => (
            <a
              key={d.filename}
              href={`/upload/${encodeURIComponent(d.filename)}`}
              target="_blank"
              rel="noreferrer"
              className={`doc-card ${d.pinned ? "pinned" : ""} ${viewMode}`}
            >
              {d.pinned && <span className="doc-pin-badge">📌</span>}

              <div className="doc-icon-wrap">
                <div className="doc-icon">{getIcon(d.filename)}</div>
                <div className="doc-ext">{getExt(d.filename).toUpperCase()}</div>
              </div>

              <div className="doc-body">
                <div className="doc-name" title={d.name}>
                  {d.name}
                </div>
                {d.description && (
                  <div className="doc-desc">{d.description}</div>
                )}
                {d.addedAt && (
                  <div className="doc-date">{formatDate(d.addedAt)}</div>
                )}
              </div>

              {user.role === "admin" && (
                <button
                  className={`doc-pin-btn ${d.pinned ? "active" : ""}`}
                  onClick={(e) => togglePin(d, e)}
                  title={d.pinned ? "Désépingler" : "Épingler"}
                >
                  📌
                </button>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
