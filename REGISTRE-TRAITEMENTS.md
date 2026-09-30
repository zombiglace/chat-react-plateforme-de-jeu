# Registre des traitements de données personnelles

**Responsable :** Julien Traineau
**Date de création :** 30 septembre 2026
**Dernière mise à jour :** 30 septembre 2026

## Traitement n°1 — Gestion des comptes utilisateurs

- **Finalité :** création, authentification, gestion des profils
- **Base légale :** exécution du contrat
- **Données :** pseudo, email, mot de passe (chiffré), date d'inscription, IP
- **Personnes concernées :** utilisateurs du site
- **Durée de conservation :** jusqu'à suppression + 3 ans d'inactivité
- **Destinataires :** hébergeur Neon (base de données)
- **Mesures de sécurité :** bcrypt, HTTPS, JWT, rate limiting

## Traitement n°2 — Chat et messagerie

- **Finalité :** permettre les échanges entre utilisateurs
- **Base légale :** exécution du contrat
- **Données :** contenu des messages, horodatage, expéditeur/destinataire
- **Personne concernées :** utilisateurs
- **Durée :** messages publics 7 jours / messages privés 1 an
- **Destinataires :** aucun (stockage interne uniquement)
- **Mesures de sécurité :** HTTPS, contrôle d'accès JWT

## Traitement n°3 — Modération

- **Finalité :** prévention des abus, bannissements
- **Base légale :** intérêt légitime
- **Données :** adresses email bannies, motifs, IP
- **Durée :** permanente (prévention des contournements)
- **Destinataires :** administrateurs du site

## Traitement n°4 — Jeux multijoueurs

- **Finalité :** fonctionnement des jeux UNO et Échecs
- **Base légale :** exécution du contrat
- **Données :** statistiques de victoires
- **Durée :** tant que le compte est actif
- **Destinataires :** autres utilisateurs (podium)

## Traitement n°5 — Logs techniques

- **Finalité :** sécurité, détection d'intrusion
- **Base légale :** intérêt légitime
- **Données :** adresse IP, horodatage, actions
- **Durée :** 6 mois maximum
- **Destinataires :** hébergeurs (Render, Vercel, Neon)
