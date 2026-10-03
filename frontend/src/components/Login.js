import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ⚠️ État spécial : email non vérifié
  const [notVerified, setNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);
    setResendMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return setError("Rentre ton email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return setError("Format d'email invalide");
    if (!password) return setError("Rentre ton mot de passe");

    setLoading(true);
    try {
      await login(cleanEmail, password);
      nav("/");
    } catch (err) {
      const data = err.response?.data;

      // ⚠️ Cas spécial : email non vérifié
      if (data?.code === "EMAIL_NOT_VERIFIED") {
        setNotVerified(true);
        setError(data.message);
      } else {
        setError(data?.message || "Impossible de se connecter");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data } = await api.post("/auth/resend-verification", {
        email: cleanEmail,
      });
      setResendMessage(data.message || "Email renvoyé !");
    } catch (err) {
      setResendMessage(
        err.response?.data?.message || "Impossible d'envoyer l'email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-scene">
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

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-head">
            <h2>Salut 👋</h2>
            <p>Content de te revoir parmi nous.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* ⚠️ Bandeau renvoi d'email si non vérifié */}
          {notVerified && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#92400e" }}>
                📧 Tu n'as pas encore confirmé ton email.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: resendLoading ? "wait" : "pointer",
                }}
              >
                {resendLoading ? "Envoi…" : "Renvoyer l'email de confirmation"}
              </button>
              {resendMessage && (
                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: 13,
                    color: "#92400e",
                  }}
                >
                  {resendMessage}
                </p>
              )}
            </div>
          )}

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

      <div className="auth-legal-links">
        <Link to="/mentions-legales">Mentions légales</Link>
        <span>·</span>
        <Link to="/confidentialite">Confidentialité</Link>
        <span>·</span>
        <Link to="/accessibilite">Accessibilité</Link>
      </div>
    </div>
  );
}
