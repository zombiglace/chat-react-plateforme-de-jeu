import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Les domaines qu'on accepte (comme côté serveur)
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

  // Vérifications en direct, pour afficher les coches vertes
  const checks = useMemo(() => ({
    username: form.username.length >= 3 && form.username.length <= 30,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    domain: ALLOWED_EMAIL.test(form.email),
    password: form.password.length >= 6,
    confirm: form.password.length > 0 && form.password === form.confirm,
  }), [form]);

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
      await register(form.username.trim(), form.email.trim().toLowerCase(), form.password);
      nav("/");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer le compte");
    } finally {
      setLoading(false);
    }
  };

  // Petite coche verte quand un champ est bon
  const Check = ({ ok }) => (
    <span className={`auth-check ${ok ? "on" : ""}`}>{ok ? "✓" : "•"}</span>
  );

  return (
    <div className="auth-scene">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">💬</div>
          <h1>Chat React</h1>
          <p className="auth-tagline">
            Rejoins ta classe en quelques secondes.
          </p>

          <ul className="auth-features">
            <li><span>💬</span> Chat en temps réel</li>
            <li><span>🎮</span> UNO & Échecs</li>
            <li><span>📁</span> Documents partagés</li>
            <li><span>🛡️</span> Modération active</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-head">
            <h2>Créer un compte 🎉</h2>
            <p>Quelques secondes et c'est parti</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <label className="auth-field">
            <span className="auth-label">
              Pseudo <Check ok={checks.username} />
            </span>
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
          </label>

          <label className="auth-field">
            <span className="auth-label">
              Email <Check ok={checks.email && checks.domain} />
            </span>
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
              Uniquement <strong>@gmail.com</strong>, <strong>@hotmail.fr</strong> ou <strong>@outlook.fr</strong>
            </small>
          </label>

          <label className="auth-field">
            <span className="auth-label">
              Mot de passe <Check ok={checks.password} />
            </span>
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
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            <small className="auth-help">Minimum 6 caractères</small>
          </label>

          <label className="auth-field">
            <span className="auth-label">
              Confirmer le mot de passe <Check ok={checks.confirm} />
            </span>
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
              <small className="auth-help warn">Les mots de passe ne correspondent pas</small>
            )}
          </label>

          <button className="auth-submit" type="submit" disabled={loading || !allOk}>
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
