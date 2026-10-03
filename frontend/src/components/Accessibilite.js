import { Link } from "react-router-dom";
import "../styles/legal.css";
import "../styles/accessibilite.css";

export default function Accessibilite() {
  return (
    <div className="legal-scene">
      <header className="legal-header">
        <div className="legal-header-left">
          <div className="legal-header-icon">♿</div>
          <div>
            <div className="legal-header-title">Accessibilité</div>
            <div className="legal-header-sub">Déclaration RGAA 4.1</div>
          </div>
        </div>
        <Link to="/" className="legal-back">← Retour</Link>
      </header>

      <div className="legal-content">
        <h1>Déclaration d'accessibilité</h1>
        <p className="legal-updated">Dernière mise à jour : 30 septembre 2026</p>

        <p className="legal-intro">
          Cette déclaration d'accessibilité s'applique au site <strong>Messagerie</strong>{" "}
          (accessible à l'adresse chat-react-plateforme-de-jeu.vercel.app).
        </p>

        <section>
          <h2>1. État de conformité</h2>
          <div className="legal-state-badge">Partielle conformité</div>
          <p>
            Le site est en <strong>partielle conformité</strong> avec le référentiel
            général d'amélioration de l'accessibilité (RGAA) version 4.1.
          </p>
        </section>

        <section>
          <h2>2. Résultats des tests</h2>
          <div className="legal-compliance">
            <div className="legal-compliance-score">
              <svg className="legal-compliance-ring" viewBox="0 0 90 90">
                <defs>
                  <linearGradient id="complianceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <circle className="bg" cx="45" cy="45" r="40" />
                <circle className="progress" cx="45" cy="45" r="40" />
              </svg>
              <div className="legal-compliance-value">
                75<small>%</small>
              </div>
            </div>
            <div className="legal-compliance-body">
              <div className="legal-compliance-title">Taux de conformité RGAA</div>
              <div className="legal-compliance-desc">
                L'audit révèle que <strong>75 %</strong> des critères du RGAA sont
                respectés sur l'ensemble des pages du site.
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>3. Contenus accessibles et non accessibles</h2>
          <div className="legal-access-columns">
            <div className="legal-access-col ok">
              <div className="legal-access-col-head">Points conformes</div>
              <ul>
                <li>Navigation cohérente et structurée</li>
                <li>Contraste des couleurs conforme (min. 4.5:1)</li>
                <li>Textes redimensionnables sans perte</li>
                <li>Formulaires avec labels explicites</li>
                <li>Messages d'erreur identifiés par du texte</li>
              </ul>
            </div>

            <div className="legal-access-col ko">
              <div className="legal-access-col-head">Points à améliorer</div>
              <ul>
                <li>
                  Certains composants interactifs (UNO, Échecs) ne sont pas entièrement
                  utilisables au clavier
                </li>
                <li>Certaines animations ne peuvent pas être désactivées</li>
                <li>Absence de transcription audio pour les vidéos injectées</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>4. Amélioration et contact</h2>
          <p>
            Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez
            contacter l'éditeur pour être orienté vers une alternative accessible :
          </p>
          <div className="legal-info">
            <strong>📧 Email de contact</strong>
            julientraineau17@gmail.com
          </div>
        </section>

        <section>
          <h2>5. Voie de recours</h2>
          <p>
            Si vous constatez un défaut d'accessibilité vous empêchant d'accéder à un
            contenu ou une fonctionnalité du site, et que vous nous signalez sans obtenir
            de réponse, vous êtes en droit de saisir le Défenseur des droits :
          </p>
          <ul>
            <li>
              <a
                href="https://formulaire.defenseurdesdroits.fr"
                target="_blank"
                rel="noreferrer"
              >
                formulaire.defenseurdesdroits.fr
              </a>
            </li>
            <li>Délégué territorial du Défenseur des droits de votre département</li>
          </ul>
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
