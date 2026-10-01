import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const EXT_ICONS = {
  pdf: "📕", doc: "📘", docx: "📘", txt: "📄", md: "📝",
  png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️",
  mp4: "🎬", mov: "🎬", avi: "🎬",
  mp3: "🎵", wav: "🎵",
  zip: "📦", rar: "📦",
  xls: "📊", xlsx: "📊", csv: "📊",
  ppt: "📽️", pptx: "📽️",
};

function icon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return EXT_ICONS[ext] || "📎";
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR");
}

export default function Documents() {
  const { user } = useAuth();
  const socket = useSocket();
  const [docs, setDocs] = useState([]);
  const [pinnedList, setPinnedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // 📥 Charge le manifest (liste de fichiers)
  useEffect(() => {
    fetch("/upload/manifest.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setDocs(Array.isArray(data) ? data : []);
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  // 📌 Charge la liste des épinglés depuis le backend
  const loadPinned = () => {
    api.get("/documents/pinned").then((r) => setPinnedList(r.data));
  };

  useEffect(() => {
    loadPinned();
  }, []);

  // 📡 Écoute les mises à jour de pin en temps réel
  useEffect(() => {
    if (!socket) return;
    const onPinned = ({ filename, pinned }) => {
      setPinnedList((prev) => {
        if (pinned) {
          return prev.includes(filename) ? prev : [...prev, filename];
        }
        return prev.filter((f) => f !== filename);
      });
    };
    socket.on("document:pinned", onPinned);
    return () => socket.off("document:pinned", onPinned);
  }, [socket]);

  // 📌 Toggle pin (admin)
  const togglePin = async (doc) => {
    try {
      const { data } = await api.post("/documents/pin", {
        filename: doc.filename,
      });
      setPinnedList((prev) => {
        if (data.pinned) return [...prev, doc.filename];
        return prev.filter((f) => f !== doc.filename);
      });
    } catch (e) {
      alert("Erreur : " + (e.response?.data?.message || e.message));
    }
  };

  // Fusionne manifest + état pinned + trie
  const merged = docs
    .map((d) => ({ ...d, pinned: pinnedList.includes(d.filename) }))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      return 0;
    });

  const filtered = merged.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.filename.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="docs-page">
      <div className="docs-head">
        <div>
          <h1>Documents partagés</h1>
          <p className="docs-sub">
            {docs.length} fichier{docs.length > 1 ? "s" : ""} disponible{docs.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Info admin : comment ajouter des fichiers */}
      {user.role === "admin" && (
        <div className="docs-admin-info">
          <strong>📌 Ajouter un fichier</strong>
          <ol>
            <li>Place ton fichier dans <code>frontend/public/upload/</code></li>
            <li>Ajoute une entrée dans <code>manifest.json</code></li>
            <li><code>git push</code> → Vercel redéploie automatiquement</li>
          </ol>
        </div>
      )}

      <div className="docs-toolbar">
        <input
          className="docs-search"
          placeholder="Rechercher un fichier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="docs-empty">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="docs-empty">
          {query
            ? "Aucun fichier ne correspond."
            : "Aucun document disponible pour le moment."}
        </p>
      ) : (
        <div className="docs-grid">
          {filtered.map((d) => (
            <div
              key={d.filename}
              className={`doc-card ${d.pinned ? "pinned" : ""}`}
            >
              {d.pinned && <span className="doc-pin-badge">📌</span>}
              <div className="doc-icon">{icon(d.filename)}</div>
              <div className="doc-body">
                <a
                  href={`/upload/${d.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="doc-name"
                  title={d.name}
                >
                  {d.name}
                </a>
                {d.description && (
                  <div className="doc-meta">{d.description}</div>
                )}
                {d.addedAt && (
                  <div className="doc-author">Ajouté le {formatDate(d.addedAt)}</div>
                )}
              </div>

              {user.role === "admin" && (
                <div className="doc-actions">
                  <button
                    className={`doc-action-btn ${d.pinned ? "pin-active" : ""}`}
                    onClick={() => togglePin(d)}
                    title={d.pinned ? "Désépingler" : "Épingler"}
                  >
                    📌
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
