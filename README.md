# NetflixLight

> Une application web inspirée de Netflix pour explorer films et séries avec une interface immersive et une navigation fluide.

---

##  Fonctionnalités

-  Catalogue dynamique (films & séries)
-  Interface moderne inspirée Netflix
-  Navigation SPA sans rechargement
-  Page détail complète (casting, similaires…)
-  Système de favoris
-  Lecteur vidéo 

---

##  Installation

### 1. Cloner le projet

    git clone https://github.com/nathlme/NetflixLight.git
    cd NetflixLight

### 2. Installer les dépendances

    npm install

### 3. Lancer le serveur

    node src/app.js

Accès :

    http://localhost:3000

---

##  Configuration API TMDB

1. Créer un compte sur TMDB  
2. Aller dans **Settings → API**  
3. Copier le **Bearer Token (v4)**

### Créer un fichier `.env`

    API_TOKEN= <COPIER LE TOKEN TMDB>

---

##  Architecture du projet

    NetflixLight/
    │
    ├── src/
    |   |── db/
    │   │   └── NetflixDB.SQL
    │   ├── app.js
    │   ├── db.js
    │   ├── loginCheck.js
    │   └── registerCheck.js
    │
    ├── static/
    │   ├── css/
    │   │   ├── output.css
    │   │   └── custom.css
    │   │
    │   ├── javaScript/
    │   │   ├── login.js
    │   │   ├── register.js
    │   │   ├── player.js
    │   │   ├── script.js
    │   │   ├── movieDetails.js
    │   │   └── moviePlayer.js
    │   │
    │   └── templates/
    │       ├── layout.hbs
    │       ├── index.html
    │       ├── LoginPage.html
    │       ├── RegisterPage.html
    │       ├── MovieDetails.html
    │       ├── videoPlayer.html
    │       └── PlayerPage.html
    │
    ├── .env
    ├── .gitignore
    ├── package-lock.json
    ├── package.json
    └── README.md

---

##  Choix techniques

### Backend
- Node.js + Express
- Gestion des routes et proxy API

### Frontend
- HTML + Tailwind CSS
- Interface moderne et rapide à développer

### Templates
- Handlebars (HBS)
- Layout global avec header/footer

### Navigation
- SPA avec `fetch` + `history.pushState`
- Navigation fluide sans rechargement

### Base de données
- SQLite
- Stockage des utilisateurs

### Authentification
- `express-session`
- `bcrypt` pour sécuriser les mots de passe

---

##  Fonctionnalités principales

- Navigation par catégories
- Page détail dynamique :
  - informations complètes
  - casting
  - contenus similaires
- Lecteur vidéo
- Gestion des favoris
- Authentification utilisateur

---

##  Notes

- Les vidéos proviennent de sources externes
- Une connexion internet est nécessaire pour les appels à l’API TMDB

---

##  Améliorations possibles

- Favoris en base de données
- Gestion des saisons/épisodes
- Recherche avancée
- Lazy loading des images
- Optimisation SEO

---

##  Auteur

Léo Gaiguant - Nathan Lamarche.