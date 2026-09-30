import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      nav("/");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-scene">
      {/* Partie gauche : présentation */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">💬</div>
          <h1>Chat React</h1>
          <p className="auth-tagline">
            Discute, partage et joue avec ta classe — en direct.
          </p>

          <ul className="auth-features">
            <li><span>💬</span> Salon de discussion temps réel</li>
            <li><span>🎮</span> UNO et Échecs multijoueur</li>
            <li><span>📁</span> Partage de documents</li>
          </ul>
        </div>
      </div>

      {/* Partie droite : formulaire */}
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-head">
            <h2>Content de te revoir 👋</h2>
            <p>Connecte-toi pour continuer</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <label className="auth-field">
            <span className="auth-label">Adresse email</span>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input
                type="email"
                placeholder="ton.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Mot de passe</span>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
