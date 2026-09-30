import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>💬 Créer un compte</h1>
        <p className="auth-sub">Rejoins ta classe en quelques secondes</p>

        {error && <div className="error">{error}</div>}

        <input
          type="text"
          placeholder="Pseudo (3 à 30 caractères)"
          value={form.username}
          onChange={update("username")}
          minLength={3}
          maxLength={30}
          required
        />

        <input
          type="email"
          placeholder="Email (gmail / hotmail / outlook)"
          value={form.email}
          onChange={update("email")}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe (min 6 caractères)"
          value={form.password}
          onChange={update("password")}
          minLength={6}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Création…" : "S'inscrire"}
        </button>

        <Link to="/login">J'ai déjà un compte</Link>
      </form>
    </div>
  );
}
