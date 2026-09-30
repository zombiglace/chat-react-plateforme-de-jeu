import { Link } from "react-router-dom";

export default function PolitiqueConfidentialite() {
  return (
    <div className="legal-page">
      <Link to="/" className="legal-back">← Retour</Link>

      <h1>Politique de confidentialité</h1>
      <p className="legal-updated">Dernière mise à jour : 30 septembre 2026</p>

      <p className="legal-intro">
        La présente politique de confidentialité décrit la manière dont vos données
        personnelles sont collectées, utilisées et protégées conformément au Règlement
        Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
      </p>

      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          <strong>Julien Traineau</strong><br />
          Contact : julientraineau17@gmail.com<br />
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <p>Nous collectons les données suivantes :</p>
        <ul>
          <li><strong>Données d'identification :</strong> pseudo, adresse email, mot de passe (chiffré)</li>
          <li><strong>Données de contenu :</strong> messages envoyés dans les salons et messages privés</li>
          <li><strong>Données de jeu :</strong> statistiques de victoires UNO et Échecs</li>
          <li><strong>Données techniques :</strong> adresse IP, logs de connexion, horodatage</li>
          <li><strong>Documents :</strong> fichiers uploadés (nom, taille, type)</li>
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
          <li><strong>Exécution du contrat :</strong> fourniture du service de messagerie et de jeux</li>
          <li><strong>Intérêt légitime :</strong> sécurité, modération, prévention des abus</li>
          <li><strong>Consentement :</strong> pour toute utilisation non couverte par les cas ci-dessus</li>
        </ul>
      </section>

      <section>
        <h2>5. Durée de conservation</h2>
        <ul>
          <li><strong>Compte utilisateur :</strong> conservé tant que le compte est actif, puis supprimé après 3 ans d'inactivité</li>
          <li><strong>Messages de chat :</strong> purgés automatiquement après 7 jours</li>
          <li><strong>Messages privés :</strong> conservés jusqu'à suppression du compte ou 1 an</li>
          <li><strong>Logs techniques :</strong> 6 mois maximum</li>
          <li><strong>Documents :</strong> conservés jusqu'à suppression manuelle</li>
          <li><strong>Données de bannissement :</strong> conservées de manière permanente (prévention)</li>
        </ul>
      </section>

      <section>
        <h2>6. Destinataires des données</h2>
        <p>
          Vos données ne sont <strong>jamais vendues</strong> à des tiers. Elles peuvent être
          transmises à :
        </p>
        <ul>
          <li>Nos hébergeurs (Vercel, Render, Neon) pour le fonctionnement du service</li>
          <li>Les autorités compétentes sur réquisition légale</li>
        </ul>
        <p>
          <strong>Transfert hors UE :</strong> Nos hébergeurs étant basés aux États-Unis, les
          données peuvent transiter en dehors de l'UE. Ces transferts sont encadrés par les
          clauses contractuelles types de la Commission européenne.
        </p>
      </section>

      <section>
        <h2>7. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
          <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
          <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
          <li><strong>Droit d'opposition :</strong> vous opposer à un traitement</li>
          <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format lisible</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à :{" "}
          <strong>julientraineau17@gmail.com</strong>
        </p>
        <p>
          En cas de réclamation non résolue, vous pouvez saisir la CNIL :{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a>
        </p>
      </section>

      <section>
        <h2>8. Sécurité</h2>
        <p>
          Nous mettons en œuvre les mesures techniques suivantes pour protéger vos données :
        </p>
        <ul>
          <li>Chiffrement des mots de passe (bcrypt)</li>
          <li>Connexion HTTPS obligatoire</li>
          <li>Protection contre les injections SQL (ORM Sequelize)</li>
          <li>Limitation du taux de requêtes (rate limiting)</li>
          <li>Filtrage des types de fichiers uploadés</li>
        </ul>
      </section>

      <section>
        <h2>9. Cookies</h2>
        <p>
          Ce site utilise uniquement des cookies techniques strictement nécessaires
          (jeton d'authentification JWT, préférences de session). Aucun cookie publicitaire
          ou de tracking n'est utilisé.
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
  );
}
