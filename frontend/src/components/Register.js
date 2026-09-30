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

  const checks = useMemo(
    () => ({
      username: form.username.length >= 3 && form.username.length <= 30,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
      domain: ALLOWED_EMAIL.test(form.email),
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
      nav("/");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer le compte");
    } finally {
      setLoading(false);
    }
  };

  const Check = ({ ok }) => (
    <span className={`auth-check ${ok ? "on" : ""}`}>{ok ? "✓" : "•"}</span>
  );

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
