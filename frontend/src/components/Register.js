import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALLOWED_EMAIL = /@(gmail|hotmail|outlook)\.(com|fr)$/i;

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const checks = useMemo(
    () => ({
      username:
        form.username.trim().length >= 3 &&
        form.username.trim().length <= 30,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
      domain: ALLOWED_EMAIL.test(form.email.trim()),
      password: form.password.length >= 6,
      confirm: form.password.length > 0 && form.password === form.confirm,
    }),
    [form]
  );

  const allOk = Object.values(checks).every(Boolean);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!allOk) {
      setError("Vérifie les champs en rouge");
      return;
    }
    setLoading(true);
    try {
      await register(
        form.username.trim(),
        form.email.trim().toLowerCase(),
        form.password
      );
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || "Impossible de créer le compte");
    } finally {
      setLoading(false);
    }
  };

  const Check = ({ ok }) => (
    <span className={`auth-check ${ok ? "on" : ""}`}>{ok ? "✓" : "•"}</span>
  );

  // ═══════════════════════════════════════════════════════════
  //  ÉCRAN DE SUCCÈS
  // ═══════════════════════════════════════════════════════════
  if (success) {
    return (
      <div className="auth-scene">
        <div
          className="auth-form-side"
          style={{ maxWidth: 520, margin: "0 auto" }}
        >
          <div className="auth-form" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
            <h2 style={{ marginBottom: 12 }}>Vérifie ta boîte mail</h2>
            <p
              style={{
                color: "#4b5563",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Un email de confirmation vient d'être envoyé à <br />
              <strong>{form.email.trim().toLowerCase()}</strong>
            </p>
            <p
              style={{
                color: "#6b7280",
                fontSize: 14,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Clique sur le lien dans l'email pour activer ton compte.
              <br />
              ⏱️ Le lien expire dans 24 heures.
              <br />
              💡 Pense à vérifier tes spams !
            </p>

            <Link
              to="/login"
              className="auth-submit"
              style={{
                display: "inline-block",
                textAlign: "center",
                textDecoration: "none",
                marginBottom: 12,
              }}
            >
              Aller à la connexion
            </Link>

            <p className="auth-switch" style={{ marginTop: 20 }}>
              Pas reçu ? Vérifie tes spams ou{" "}
              <Link to="/login">demande un nouveau lien</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  FORMULAIRE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="auth-scene">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">💬</div>
          <h1>Rejoins la bande</h1>
          <p className="auth-tagline">
            Crée ton compte en quelques secondes et commence à discuter.
          </p>

          <ul className="auth-features">
            <li>
              <span>💬</span>
              <div>
                <strong>Chat en direct</strong>
                <small>Salons publics et messages privés</small>
              </div>
            </li>
            <li>
              <span>🎮</span>
              <div>
                <strong>UNO & Échecs</strong>
                <small>Jouez à plusieurs en temps réel</small>
              </div>
            </li>
            <li>
              <span>🛡️</span>
              <div>
                <strong>Modération active</strong>
                <small>Un espace sûr pour discuter</small>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-head">
            <h2>Créer un compte</h2>
            <p>Ça prend moins d'une minute.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label">
              Pseudo <Check ok={checks.username} />
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                type="text"
                placeholder="TonPseudo"
                value={form.username}
                onChange={update("username")}
                maxLength={30}
                required
              />
            </div>
            <small className="auth-help">3 à 30 caractères</small>
          </div>

          <div className="auth-field">
            <label className="auth-label">
              Email <Check ok={checks.email && checks.domain} />
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input
                type="email"
                placeholder="ton.email@gmail.com"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>
            <small className="auth-help">
              Gmail, Hotmail ou Outlook uniquement
            </small>
          </div>

          <div className="auth-field">
            <label className="auth-label">
              Mot de passe <Check ok={checks.password} />
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
                minLength={6}
                required
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
                aria-label="Afficher le mot de passe"
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            <small className="auth-help">Minimum 6 caractères</small>
          </div>

          <div className="auth-field">
            <label className="auth-label">
              Confirmer le mot de passe <Check ok={checks.confirm} />
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔐</span>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirm}
                onChange={update("confirm")}
                required
              />
            </div>
            {form.confirm && !checks.confirm && (
              <small className="auth-help warn">
                Les mots de passe ne correspondent pas
              </small>
            )}
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading || !allOk}
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>

          <p className="auth-switch">
            Déjà inscrit ? <Link to="/login">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
