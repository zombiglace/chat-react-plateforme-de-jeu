import { Link } from "react-router-dom";
import "../styles/legal.css";
import "../styles/confidentialite.css";

export default function PolitiqueConfidentialite() {
  return (
    <div className="legal-scene">
      <header className="legal-header">
        <div className="legal-header-left">
          <div className="legal-header-icon">🔒</div>
          <div>
            <div className="legal-header-title">Confidentialité</div>
            <div className="legal-header-sub">Protection de vos données</div>
          </div>
        </div>
        <Link to="/" className="legal-back">← Retour</Link>
      </header>

      <div className="legal-content">
        <h1>Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : 30 septembre 2026</p>

        <p className="legal-intro">
          La présente politique de confidentialité décrit la manière dont vos données
          personnelles sont collectées, utilisées et protégées conformément au Règlement
          Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
        </p>

        <section>
          <h2>1. Responsable du traitement</h2>
          <div className="legal-info-card">
            <div className="legal-info-row">
              <span className="label">Responsable</span>
              <span className="value">Julien Traineau</span>
            </div>
            <div className="legal-info-row">
              <span className="label">Contact</span>
              <span className="value">julientraineau17@gmail.com</span>
            </div>
          </div>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul>
            <li>
              <strong>Données d'identification :</strong> pseudo, adresse email, mot de
              passe (chiffré)
              <span className="legal-data-tag sensitive">Sensible</span>
            </li>
            <li>
              <strong>Données de contenu :</strong> messages envoyés dans les salons et
              messages privés
              <span className="legal-data-tag content">Contenu</span>
            </li>
            <li>
              <strong>Données de jeu :</strong> statistiques de victoires UNO et Échecs
            </li>
            <li>
              <strong>Données techniques :</strong> adresse IP, logs de connexion,
              horodatage
              <span className="legal-data-tag technical">Technique</span>
            </li>
            <li>
              <strong>Documents :</strong> fichiers uploadés (nom, taille, type)
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont traitées pour :</p>
          <ul>
            <li>Permettre la création et la gestion de votre compte utilisateur</li>
            <li>Assurer le fonctionnement du chat en temps réel et des jeux</li>
            <li>Garantir la modération et la sécurité du service (mute, ban, signalements)</li>
            <li>Gérer le partage de documents</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </section>

        <section>
          <h2>4. Base légale</h2>
          <ul>
            <li>
              <strong>Exécution du contrat :</strong> fourniture du service de messagerie
              et de jeux
            </li>
            <li>
              <strong>Intérêt légitime :</strong> sécurité, modération, prévention des abus
            </li>
            <li>
              <strong>Consentement :</strong> pour toute utilisation non couverte par les
              cas ci-dessus
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Durée de conservation</h2>
          <div className="legal-durations">
            <div className="legal-duration-item">
              <span className="label">Compte utilisateur</span>
              <span className="duration medium">3 ans d'inactivité</span>
            </div>
            <div className="legal-duration-item">
              <span className="label">Messages de chat</span>
              <span className="duration short">7 jours</span>
            </div>
            <div className="legal-duration-item">
              <span className="label">Messages privés</span>
              <span className="duration medium">1 an ou suppression</span>
            </div>
            <div className="legal-duration-item">
              <span className="label">Logs techniques</span>
              <span className="duration short">6 mois</span>
            </div>
            <div className="legal-duration-item">
              <span className="label">Documents uploadés</span>
              <span className="duration medium">Jusqu'à suppression</span>
            </div>
            <div className="legal-duration-item">
              <span className="label">Données de bannissement</span>
              <span className="duration forever">Permanent</span>
            </div>
          </div>
        </section>

        <section>
          <h2>6. Destinataires des données</h2>
          <p>
            Vos données ne sont <strong>jamais vendues</strong> à des tiers. Elles peuvent
            être transmises à :
          </p>
          <ul>
            <li>Nos hébergeurs (Vercel, Render, Neon) pour le fonctionnement du service</li>
            <li>Les autorités compétentes sur réquisition légale</li>
          </ul>
          <div className="legal-info">
            <strong>🌍 Transfert hors UE</strong>
            Nos hébergeurs étant basés aux États-Unis, les données peuvent transiter en
            dehors de l'UE. Ces transferts sont encadrés par les clauses contractuelles
            types de la Commission européenne.
          </div>
        </section>

        <section>
          <h2>7. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants, que vous pouvez
            exercer directement depuis la page <strong>Mon compte</strong> :
          </p>
          <div className="legal-rights">
            <div className="legal-right-item">
              <div className="legal-right-icon">📥</div>
              <div className="legal-right-body">
                <div className="legal-right-title">Accès et portabilité (art. 15 et 20)</div>
                <div className="legal-right-desc">
                  Télécharger l'intégralité de vos données au format JSON depuis l'onglet
                  « Mes données »
                </div>
              </div>
            </div>

            <div className="legal-right-item">
              <div className="legal-right-icon">✏️</div>
              <div className="legal-right-body">
                <div className="legal-right-title">Rectification (art. 16)</div>
                <div className="legal-right-desc">
                  Modifier votre pseudo, email ou mot de passe depuis l'onglet « Mes
                  informations »
                </div>
              </div>
            </div>

            <div className="legal-right-item">
              <div className="legal-right-icon">🗑️</div>
              <div className="legal-right-body">
                <div className="legal-right-title">Effacement (art. 17)</div>
                <div className="legal-right-desc">
                  Supprimer définitivement votre compte et vos données depuis l'onglet
                  « Supprimer »
                </div>
              </div>
            </div>

            <div className="legal-right-item">
              <div className="legal-right-icon">🔒</div>
              <div className="legal-right-body">
                <div className="legal-right-title">Limitation</div>
                <div className="legal-right-desc">
                  Nous contacter à julientraineau17@gmail.com
                </div>
              </div>
            </div>

            <div className="legal-right-item">
              <div className="legal-right-icon">✋</div>
              <div className="legal-right-body">
                <div className="legal-right-title">Opposition</div>
                <div className="legal-right-desc">
                  Nous contacter à julientraineau17@gmail.com
                </div>
              </div>
            </div>
          </div>
          <p style={{ marginTop: "1rem" }}>
            En cas de réclamation non résolue, vous pouvez saisir la CNIL :{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
              cnil.fr
            </a>
          </p>
        </section>

        <section>
          <h2>8. Sécurité</h2>
          <p>Nous mettons en œuvre les mesures techniques suivantes :</p>
          <div className="legal-security-grid">
            <div className="legal-security-item">Chiffrement bcrypt</div>
            <div className="legal-security-item">Connexion HTTPS obligatoire</div>
            <div className="legal-security-item">Protection SQL (Sequelize)</div>
            <div className="legal-security-item">Rate limiting</div>
            <div className="legal-security-item">Filtrage des fichiers</div>
            <div className="legal-security-item">Sessions JWT sécurisées</div>
          </div>
        </section>

        <section>
          <h2>9. Cookies</h2>
          <p>
            Ce site utilise uniquement des cookies techniques strictement nécessaires
            (jeton d'authentification JWT, préférences de session). Aucun cookie
            publicitaire ou de tracking n'est utilisé.
          </p>
        </section>

        <section>
          <h2>10. Modification de la politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique à tout moment. Toute
            modification significative sera notifiée aux utilisateurs.
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
