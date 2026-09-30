import { Link } from "react-router-dom";

export default function Accessibilite() {
  return (
    <div className="legal-page">
      <Link to="/" className="legal-back">← Retour</Link>

      <h1>Déclaration d'accessibilité</h1>
      <p className="legal-updated">Dernière mise à jour : 30 septembre 2026</p>

      <p className="legal-intro">
        Cette déclaration d'accessibilité s'applique au site <strong>Messagerie</strong>{" "}
        (accessible à l'adresse chat-react-plateforme-de-jeu.vercel.app).
      </p>

      <section>
        <h2>1. État de conformité</h2>
        <p>
          Le site est en <strong>partielle conformité</strong> avec le référentiel
          général d'amélioration de l'accessibilité (RGAA) version 4.1.
        </p>
      </section>

      <section>
        <h2>2. Résultats des tests</h2>
        <p>
          L'audit de conformité réalisé révèle que <strong>75 %</strong> des critères
          du RGAA sont respectés.
        </p>
      </section>

      <section>
        <h2>3. Contenus accessibles</h2>
        <ul>
          <li>Navigation cohérente avec une structure claire</li>
          <li>Contraste des couleurs conforme (ratio minimum 4.5:1)</li>
          <li>Textes redimensionnables sans perte d'information</li>
          <li>Formulaires avec labels explicites</li>
          <li>Messages d'erreur identifiés par du texte</li>
        </ul>
      </section>

      <section>
        <h2>4. Contenus non accessibles</h2>
        <ul>
          <li>Certains composants interactifs (jeux UNO, Échecs) ne sont pas entièrement utilisables au clavier</li>
          <li>Certaines animations peuvent ne pas être désactivées</li>
          <li>Absence de transcription audio pour les vidéos injectées</li>
        </ul>
      </section>

      <section>
        <h2>5. Amélioration et contact</h2>
        <p>
          Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez
          contacter l'éditeur pour être orienté vers une alternative accessible :
        </p>
        <p>
          <strong>Email :</strong> julientraineau17@gmail.com
        </p>
      </section>

      <section>
        <h2>6. Voie de recours</h2>
        <p>
          Si vous constatez un défaut d'accessibilité vous empêchant d'accéder à un contenu
          ou une fonctionnalité du site, et que vous nous signalez sans obtenir de réponse,
          vous êtes en droit de saisir le Défenseur des droits :
        </p>
        <ul>
          <li>
            <a href="https://formulaire.defenseurdesdroits.fr" target="_blank" rel="noreferrer">
              formulaire.defenseurdesdroits.fr
            </a>
          </li>
          <li>Délégué territorial du Défenseur des droits de votre département</li>
        </ul>
      </section>
    </div>
  );
}
