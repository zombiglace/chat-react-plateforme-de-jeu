import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(f.username, f.email, f.password);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur d'inscription");
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={submit} className="auth-card">
        <h1>💬 Créer un compte</h1>
        {err && <div className="error">{err}</div>}
        <input
          placeholder="Pseudo"
          value={f.username}
          onChange={(e) => setF({ ...f, username: e.target.value })}
          required
        />
        <input
          placeholder="Email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          required
        />
        <button type="submit">S'inscrire</button>
        <Link to="/login">J'ai déjà un compte</Link>
      </form>
    </div>
  );
}
