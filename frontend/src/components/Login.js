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
      {/* Colonne gauche : présentation */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">💬</div>
          <h1>Chat NSI TERM</h1>
          <p className="auth-tagline">
            L'endroit où la classe discute tranquillement en NSI.
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
              <span>📁</span>
              <div>
                <strong>Documents partagés</strong>
                <small>Envoie et récupère des fichiers</small>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Colonne droite : formulaire */}
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-head">
            <h2>Salut 👋</h2>
            <p>Content de te revoir parmi nous.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label">Adresse email</label>
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
          </div>

          <div className="auth-field">
            <label className="auth-label">Mot de passe</label>
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
                aria-label="Afficher le mot de passe"
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

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
