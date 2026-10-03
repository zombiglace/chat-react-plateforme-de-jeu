import { Link } from "react-router-dom";
import "../styles/legal.css";
import "../styles/mentionslegales.css";

export default function MentionsLegales() {
  return (
    <div className="legal-scene">
      <header className="legal-header">
        <div className="legal-header-left">
          <div className="legal-header-icon">⚖️</div>
          <div>
            <div className="legal-header-title">Mentions légales</div>
            <div className="legal-header-sub">Informations juridiques</div>
          </div>
        </div>
        <Link to="/" className="legal-back">← Retour</Link>
      </header>

      <div className="legal-content">
        <h1>Mentions légales</h1>
        <p className="legal-updated">Dernière mise à jour : 30 septembre 2026</p>

        <section>
          <h2>1. Éditeur du site</h2>
          <div className="legal-info-card">
            <div className="legal-info-row">
              <span className="label">Nom</span>
              <span className="value">Julien Traineau</span>
            </div>
            <div className="legal-info-row">
              <span className="label">Statut</span>
              <span className="value">Particulier</span>
            </div>
            <div className="legal-info-row">
              <span className="label">Email</span>
              <span className="value">julientraineau17@gmail.com</span>
            </div>
          </div>
        </section>

        <section>
          <h2>2. Directeur de la publication</h2>
          <div className="legal-info-card">
            <div className="legal-info-row">
              <span className="label">Directeur</span>
              <span className="value">Julien Traineau</span>
            </div>
            <div className="legal-info-row">
              <span className="label">Contact</span>
              <span className="value">julientraineau17@gmail.com</span>
            </div>
          </div>
        </section>

        <section>
          <h2>3. Hébergement</h2>
          <p>Ce site est hébergé par les services suivants :</p>
          <div className="legal-hostings">
            <div className="legal-host-card">
              <div className="legal-host-icon">▲</div>
              <div className="legal-host-body">
                <div className="legal-host-name">
                  Vercel Inc.
                  <span className="legal-host-badge">Frontend</span>
                </div>
                <div className="legal-host-address">
                  440 N Barranca Ave #4133<br />
                  Covina, CA 91723, États-Unis
                </div>
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noreferrer"
                  className="legal-host-link"
                >
                  vercel.com
                </a>
              </div>
            </div>

            <div className="legal-host-card">
              <div className="legal-host-icon">🎨</div>
              <div className="legal-host-body">
                <div className="legal-host-name">
                  Render Services, Inc.
                  <span className="legal-host-badge">Backend</span>
                </div>
                <div className="legal-host-address">
                  525 Brannan St<br />
                  San Francisco, CA 94107, États-Unis
                </div>
                <a
                  href="https://render.com"
                  target="_blank"
                  rel="noreferrer"
                  className="legal-host-link"
                >
                  render.com
                </a>
              </div>
            </div>

            <div className="legal-host-card">
              <div className="legal-host-icon">🗄️</div>
              <div className="legal-host-body">
                <div className="legal-host-name">
                  Neon Inc.
                  <span className="legal-host-badge">Base de données</span>
                </div>
                <div className="legal-host-address">
                  2093 Philadelphia Pike #9726<br />
                  Claymont, DE 19703, États-Unis
                </div>
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="legal-host-link"
                >
                  neon.tech
                </a>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>4. Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (code source, design, textes, images) est la
            propriété exclusive de l'éditeur, sauf mention contraire. Toute reproduction,
            distribution, modification ou utilisation sans autorisation écrite préalable
            est interdite.
          </p>
          <p>
            Les marques et logos cités (UNO, échecs) appartiennent à leurs propriétaires
            respectifs.
          </p>
        </section>

        <section>
          <h2>5. Protection des données personnelles</h2>
          <p>
            Le traitement des données personnelles est détaillé dans notre{" "}
            <Link to="/confidentialite">Politique de confidentialité</Link>.
          </p>
        </section>

        <section>
          <h2>6. Responsabilité</h2>
          <p>
            L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations
            diffusées sur ce site. Toutefois, il ne peut garantir l'exactitude, la précision
            ou l'exhaustivité des informations mises à disposition. En conséquence,
            l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.
          </p>
        </section>

        <section>
          <h2>7. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de
            litige, les tribunaux français seront seuls compétents.
          </p>
        </section>
      </div>

      <footer className="legal-footer">
        <div className="legal-footer-links">
          <Link to="/mentions-legales">Mentions légales</Link>
          <span>·</span>
          <Link to="/confidentialite">Confidentialité</Link>
          <span>·</span>
          <Link to="/accessibilite">Accessibilité</Link>
        </div>
        <div className="legal-footer-copy">
          © {new Date().getFullYear()} Chat NSI TERM — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
