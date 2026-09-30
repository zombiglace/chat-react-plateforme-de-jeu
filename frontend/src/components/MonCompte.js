import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function MonCompte() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  // Onglet actif
  const [tab, setTab] = useState("profil");

  // ─── Onglet profil (rectification) ───
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // ─── Onglet suppression ───
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Onglet export ───
  const [exportLoading, setExportLoading] = useState(false);

  // ═══ SAUVEGARDER LES MODIFS ═══
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");

    if (newPassword && newPassword !== confirmNewPassword) {
      setProfileErr("Les deux nouveaux mots de passe ne correspondent pas");
      return;
    }

    setProfileLoading(true);
    try {
      const { data } = await api.put("/me/update", {
        username,
        email,
        currentPassword,
        newPassword: newPassword || undefined,
      });
      setProfileMsg("✅ Tes informations ont été mises à jour");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Rafraîchit le token / user en local
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      setTimeout(() => setProfileMsg(""), 4000);
    } catch (err) {
      setProfileErr(
        err.response?.data?.message || "Erreur lors de la mise à jour"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // ═══ EXPORT DES DONNÉES ═══
  const exportData = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://chat-react-api.onrender.com/api/me/export",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Erreur d'export");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mes-donnees-${user.username}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de l'export : " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // ═══ SUPPRESSION DU COMPTE ═══
  const deleteAccount = async (e) => {
    e.preventDefault();
    setDeleteErr("");

    if (deleteConfirm !== "SUPPRIMER") {
      setDeleteErr('Tape exactement "SUPPRIMER" pour confirmer');
      return;
    }
    if (!deletePassword) {
      setDeleteErr("Mot de passe requis");
      return;
    }
    if (
      !window.confirm(
        "⚠️ DERNIÈRE CONFIRMATION\n\nTon compte et TOUTES tes données seront supprimés définitivement.\n\nCette action est IRRÉVERSIBLE.\n\nContinuer ?"
      )
    )
      return;

    setDeleteLoading(true);
    try {
      await api.delete("/me/delete", {
        data: { password: deletePassword, confirm: deleteConfirm },
      });
      alert("Ton compte a été supprimé. Tu vas être déconnecté.");
      logout();
      nav("/login");
    } catch (err) {
      setDeleteErr(
        err.response?.data?.message || "Erreur lors de la suppression"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="account-page">
      <Link to="/" className="legal-back">← Retour au chat</Link>

      <header className="account-header">
        <h1>Mon compte</h1>
        <p className="account-sub">
          Gère tes informations personnelles et tes droits RGPD
        </p>
      </header>

      <div className="account-tabs">
        <button
          className={tab === "profil" ? "active" : ""}
          onClick={() => setTab("profil")}
        >
          ✏️ Mes informations
        </button>
        <button
          className={tab === "export" ? "active" : ""}
          onClick={() => setTab("export")}
        >
          📥 Mes données
        </button>
        <button
          className={tab === "delete" ? "active danger" : "danger"}
          onClick={() => setTab("delete")}
        >
          🗑️ Supprimer
        </button>
      </div>

      {/* ═══ ONGLET PROFIL ═══ */}
      {tab === "profil" && (
        <div className="account-panel">
          <h2>Modifier mes informations</h2>
          <p className="account-hint">
            Conformément à l'article 16 du RGPD, tu peux modifier tes données à tout
            moment. Toute modification nécessite ton mot de passe actuel.
          </p>

          {profileMsg && <div className="account-msg ok">{profileMsg}</div>}
          {profileErr && <div className="account-msg err">{profileErr}</div>}

          <form onSubmit={saveProfile} className="account-form">
            <label className="account-field">
              <span>Pseudo</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                required
              />
            </label>

            <label className="account-field">
              <span>Adresse email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <small>Gmail, Hotmail ou Outlook uniquement</small>
            </label>

            <hr className="account-sep" />

            <label className="account-field">
              <span>Mot de passe actuel *</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Requis pour modifier quoi que ce soit"
                autoComplete="current-password"
              />
            </label>

            <label className="account-field">
              <span>Nouveau mot de passe (optionnel)</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
                minLength={6}
                autoComplete="new-password"
              />
              <small>Minimum 6 caractères</small>
            </label>

            <label className="account-field">
              <span>Confirmer le nouveau mot de passe</span>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirmation"
                autoComplete="new-password"
              />
            </label>

            <button
              type="submit"
              className="account-submit"
              disabled={profileLoading}
            >
              {profileLoading ? "Enregistrement…" : "💾 Enregistrer les modifications"}
            </button>
          </form>
        </div>
      )}

      {/* ═══ ONGLET EXPORT ═══ */}
      {tab === "export" && (
        <div className="account-panel">
          <h2>Exporter mes données</h2>
          <p className="account-hint">
            Conformément aux articles 15 et 20 du RGPD, tu peux télécharger une copie
            complète de toutes les données que nous stockons sur toi, dans un format
            lisible et réutilisable (JSON).
          </p>

          <div className="account-info-box">
            <strong>📦 Ce fichier contient :</strong>
            <ul>
              <li>Ton compte (pseudo, email, rôle, date d'inscription)</li>
              <li>Tes statistiques de jeu (victoires UNO et Échecs)</li>
              <li>Tous tes messages publics et privés</li>
              <li>La liste de tes documents uploadés</li>
              <li>Les salons que tu as créés</li>
              <li>Ton historique de modération (mute, ban)</li>
            </ul>
          </div>

          <button
            className="account-submit blue"
            onClick={exportData}
            disabled={exportLoading}
          >
            {exportLoading
              ? "Préparation du fichier…"
              : "📥 Télécharger toutes mes données"}
          </button>

          <p className="account-hint">
            Le fichier sera au format <strong>JSON</strong> et nommé{" "}
            <code>mes-donnees-{user.username}-[date].json</code>.
          </p>
        </div>
      )}

      {/* ═══ ONGLET SUPPRESSION ═══ */}
      {tab === "delete" && (
        <div className="account-panel danger-zone">
          <h2>⚠️ Supprimer mon compte</h2>
          <p className="account-hint">
            Conformément à l'article 17 du RGPD (droit à l'effacement), tu peux
            demander la suppression définitive de ton compte et de toutes tes données
            personnelles.
          </p>

          <div className="account-info-box danger">
            <strong>🗑️ Ce qui sera supprimé définitivement :</strong>
            <ul>
              <li>Ton compte utilisateur</li>
              <li>Tous tes messages privés</li>
              <li>Tous tes documents uploadés</li>
              <li>Ton accès à la messagerie et aux jeux</li>
            </ul>
            <strong style={{ marginTop: "0.75rem", display: "block" }}>
              📝 Ce qui sera conservé anonymisé :
            </strong>
            <ul>
              <li>
                Tes messages publics (sans ton nom, pour ne pas casser les conversations)
              </li>
              <li>
                Ton email dans la liste de bannissement (pour éviter la recréation
                abusive)
              </li>
            </ul>
          </div>

          <div className="account-info-box warning">
            ⚠️ <strong>Cette action est irréversible.</strong> Aucun retour en arrière
            n'est possible.
          </div>

          {deleteErr && <div className="account-msg err">{deleteErr}</div>}

          <form onSubmit={deleteAccount} className="account-form">
            <label className="account-field">
              <span>Mot de passe actuel</span>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Ton mot de passe"
                autoComplete="current-password"
                required
              />
            </label>

            <label className="account-field">
              <span>
                Tape <strong>SUPPRIMER</strong> pour confirmer
              </span>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                required
              />
            </label>

            <button
              type="submit"
              className="account-submit red"
              disabled={deleteLoading || deleteConfirm !== "SUPPRIMER"}
            >
              {deleteLoading
                ? "Suppression en cours…"
                : "🗑️ Supprimer définitivement mon compte"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
