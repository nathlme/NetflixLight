# NetflixLight

Application web inspiree de Netflix pour explorer des films et des series via TMDB, avec navigation SPA, authentification utilisateur, liste personnelle et PWA.

---

## Fonctionnalites

- Catalogue dynamique films et series (TMDB)
- Navigation SPA sans rechargement complet
- Page detail avec informations de contenu
- Lecteur video sur page dediee
- Authentification utilisateur (inscription, connexion, deconnexion)
- Ma liste en base SQLite
- Historique recemment regardes
- Page profil avec sections recemment regardes et ma liste
- PWA (manifest + service worker)

---

## Prerequis

- Node.js 18+
- npm

---

## Installation

1. Cloner le projet

```bash
git clone https://github.com/nathlme/NetflixLight.git
cd NetflixLight
```

1. Installer les dependances

```bash
npm install
```

1. Configurer les variables d environnement

Creer un fichier `.env` a la racine :

```env
API_TOKEN=<VOTRE_BEARER_TOKEN_TMDB>
API_KEY= <VOTRE_KEY_TMDB>
```

Notes :

- API_TOKEN est obligatoire.
- API_KEY est obligatoire.

1. Lancer le projet

En production locale :

```bash
npm start
```

En developpement (nodemon) :

```bash
npm run dev
```

1. Ouvrir l application

<http://localhost:3000>

---

## Scripts npm

- npm start : lance le serveur Express.
- npm run dev : lance le serveur avec nodemon.

---

## Architecture (resume)

```text
NetflixLight/
|-- src/
|   |-- app.js
|   |-- db.js
|   |-- loginCheck.js
|   |-- registerCheck.js
|   |-- db/
|       |-- NetflixDB.SQL
|
|-- static/
|   |-- css/
|   |-- img/
|   |-- javaScript/
|   |   |-- script.js
|   |   |-- movieDetails.js
|   |   |-- player.js
|   |   |-- login.js
|   |   |-- register.js
|   |   |-- pwa.js
|   |-- templates/
|   |   |-- layout.hbs
|   |   |-- index.html
|   |   |-- MovieDetails.html
|   |   |-- PlayerPage.html
|   |   |-- LoginPage.html
|   |   |-- RegisterPage.html
|   |   |-- ListPage.html
|   |   |-- ProfilePage.html
|   |-- manifest.webmanifest
|   |-- sw.js
|
|-- package.json
|-- package-lock.json
|-- README.md
```

---

## Stack technique

Backend

- Node.js
- Express
- express-session
- bcrypt
- sqlite3

Frontend

- HTML
- Tailwind CSS
- JavaScript vanilla

Templating

- Handlebars (hbs)

Navigation

- Router SPA client (fetch + history.pushState)

PWA

- manifest.webmanifest
- service worker (cache des assets et navigation)

---

## Base de donnees

Tables principales

- users
- user_watchlist
- user_recently_watched

La base SQLite est initialisee automatiquement au demarrage via `src/db.js`.

---

## Notes PWA

- Si l interface semble desynchronisee apres une mise a jour, vider le cache PWA dans le navigateur.
- Le service worker ne met pas en cache les routes `/api` afin d eviter les donnees utilisateur obsoletes.

---

## Auteurs

Leo Gaiguant - Nathan Lamarche
