import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmail() {
  const { token } = useParams();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien invalide.");
      return;
    }

    let cancelled = false;

    api
      .post(`/auth/verify-email/${token}`)
      .then((r) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(r.data.message || "Email confirmé !");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Impossible de confirmer l'email."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth-scene">
      <div
        className="auth-form-side"
        style={{ maxWidth: 520, margin: "0 auto" }}
      >
        <div className="auth-form" style={{ textAlign: "center" }}>
          {status === "loading" && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
              <h2>Vérification en cours…</h2>
              <p style={{ color: "#6b7280" }}>Patiente quelques secondes.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2 style={{ marginBottom: 12 }}>Email confirmé !</h2>
              <p
                style={{
                  color: "#4b5563",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                {message}
              </p>
              <Link
                to="/login"
                className="auth-submit"
                style={{
                  display: "inline-block",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Se connecter
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
              <h2 style={{ marginBottom: 12 }}>Oups…</h2>
              <p
                style={{
                  color: "#4b5563",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                {message}
              </p>
              <Link
                to="/login"
                className="auth-submit"
                style={{
                  display: "inline-block",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
