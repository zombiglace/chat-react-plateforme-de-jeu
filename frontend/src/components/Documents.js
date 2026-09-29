import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const EXT_ICONS = {
  pdf: "📕",
  doc: "📘",
  docx: "📘",
  txt: "📄",
  md: "📝",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
  gif: "🖼️",
  webp: "🖼️",
  mp4: "🎬",
  mov: "🎬",
  avi: "🎬",
  mp3: "🎵",
  wav: "🎵",
  zip: "📦",
  rar: "📦",
  xls: "📊",
  xlsx: "📊",
  csv: "📊",
  ppt: "📽️",
  pptx: "📽️",
};

function icon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return EXT_ICONS[ext] || "📎";
}

function formatSize(bytes) {
  if (!bytes) return "—";
  const u = ["o", "Ko", "Mo", "Go"];
  let i = 0,
    n = bytes;
  while (n >= 1024 && i < 3) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

function formatDate(d) {
  const now = new Date();
  const date = new Date(d);
  const diff = (now - date) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR");
}

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get("/documents");
      setDocs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post("/documents", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await load();
    } catch (e) {
      alert("Erreur upload : " + (e.response?.data?.message || e.message));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeDoc = async (doc) => {
    if (!window.confirm(`Supprimer ${doc.name} ?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      alert("Erreur : " + (e.response?.data?.message || e.message));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()),
  );

  const canDelete = (d) =>
    user.role === "admin" || d.uploadedBy?.id === user.id;

  return (
    <div className="docs-page">
      <div className="docs-head">
        <div>
          <h1>Documents partagés</h1>
          <p className="docs-sub">
            {docs.length} fichier{docs.length > 1 ? "s" : ""} disponible
            {docs.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="btn-upload"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Envoi en cours…" : "+ Ajouter un fichier"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </div>

      <div
        className={`drop-zone ${dragOver ? "over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <span className="drop-icon">📁</span>
        <p>Glisse tes fichiers ici ou clique pour parcourir</p>
      </div>

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
            : "Aucun document pour le moment."}
        </p>
      ) : (
        <div className="docs-grid">
          {filtered.map((d) => (
            <div key={d.id} className="doc-card">
              <div className="doc-icon">{icon(d.name)}</div>
              <div className="doc-body">
                <a
                  href={`${API}${d.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="doc-name"
                  title={d.name}
                >
                  {d.name}
                </a>
                <div className="doc-meta">
                  {formatSize(d.size)} · {formatDate(d.createdAt)}
                </div>
                <div className="doc-author">
                  par <strong>{d.uploadedBy?.username || "?"}</strong>
                </div>
              </div>
              {canDelete(d) && (
                <button
                  className="doc-del"
                  onClick={() => removeDoc(d)}
                  title="Supprimer"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
