import { Link } from "react-router-dom";

export default function MentionsLegales() {
  return (
    <div className="legal-page">
      <Link to="/" className="legal-back">← Retour</Link>

      <h1>Mentions légales</h1>
      <p className="legal-updated">Dernière mise à jour : 30 septembre 2026</p>

      <section>
        <h2>1. Éditeur du site</h2>
        <p>
          <strong>Nom :</strong> Julien Traineau<br />
          <strong>Statut :</strong> Particulier<br />
          <strong>Email :</strong> julientraineau17@gmail.com<br />
        </p>
      </section>

      <section>
        <h2>2. Directeur de la publication</h2>
        <p>
          <strong>Directeur de la publication :</strong> Julien Traineau<br />
          <strong>Contact :</strong> julientraineau17@gmail.com
        </p>
      </section>

      <section>
        <h2>3. Hébergement</h2>
        <p>
          Ce site est hébergé par les services suivants :
        </p>
        <ul>
          <li>
            <strong>Frontend :</strong> Vercel Inc.<br />
            440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
          </li>
          <li>
            <strong>Backend :</strong> Render Services, Inc.<br />
            525 Brannan St, San Francisco, CA 94107, États-Unis<br />
            <a href="https://render.com" target="_blank" rel="noreferrer">render.com</a>
          </li>
          <li>
            <strong>Base de données :</strong> Neon Inc.<br />
            2093 Philadelphia Pike #9726, Claymont, DE 19703, États-Unis<br />
            <a href="https://neon.tech" target="_blank" rel="noreferrer">neon.tech</a>
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu de ce site (code source, design, textes, images) est la propriété
          exclusive de l'éditeur, sauf mention contraire. Toute reproduction, distribution,
          modification ou utilisation sans autorisation écrite préalable est interdite.
        </p>
        <p>
          Les marques et logos cités (UNO, échecs) appartiennent à leurs propriétaires respectifs.
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
          L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées
          sur ce site. Toutefois, il ne peut garantir l'exactitude, la précision ou l'exhaustivité
          des informations mises à disposition. En conséquence, l'utilisateur reconnaît utiliser
          ces informations sous sa responsabilité exclusive.
        </p>
      </section>

      <section>
        <h2>7. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige,
          les tribunaux français seront seuls compétents.
        </p>
      </section>
    </div>
  );
}
