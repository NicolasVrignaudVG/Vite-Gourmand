# 🍽️ Vite & Gourmand

Application web de présentation et commande de menus pour la société Vite & Gourmand, entreprise de traiteur basée à Bordeaux.

## 📋 Description

Vite & Gourmand propose ses prestations pour tout type d'événement (Noël, Pâques, événements professionnels...). Cette application permet :

- De consulter les menus disponibles et de composer son repas plat par plat
- De passer commande en ligne avec calcul automatique des frais de livraison
- De gérer les commandes (espace utilisateur, employé et administrateur)
- De valider/refuser les avis clients
- De consulter les statistiques via MongoDB

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Front-end | HTML5, CSS3, SCSS, JavaScript vanilla |
| Back-end | PHP 8.4 — Symfony 8 |
| ORM | Doctrine |
| Authentification | JWT (LexikJWTAuthenticationBundle) |
| Base de données relationnelle | MySQL 8.0 |
| Base de données NoSQL | MongoDB Atlas |
| Mails transactionnels | Brevo API |
| Calcul livraison | OpenRouteService API |
| Déploiement front | Vercel |
| Déploiement back | Render (Docker) |
| Base de données production | Clever Cloud MySQL |

## ⚙️ Prérequis

- PHP >= 8.4
- Composer
- Symfony CLI
- MySQL >= 8.0
- Git
- Extension PHP : `pdo_mysql`, `fileinfo`, `mongodb`, `zip`

## 🚀 Installation en local

### 1. Cloner les dépôts

```bash
# Front-end
git clone https://github.com/NicolasVrignaudVG/Vite-Gourmand.git
cd Vite-Gourmand

# Back-end
git clone https://github.com/NicolasVrignaudVG/Vite-Gourmand-back.git
cd Vite-Gourmand-back
```

### 2. Installer les dépendances back-end

```bash
composer install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du back-end (référez-vous à `.env.production` pour la liste des clés attendues) :

```
APP_ENV=dev
APP_SECRET=votre_secret_32_caracteres

# Base de données MySQL locale
DATABASE_URL=mysql://root:@127.0.0.1:3306/vite_gourmand?serverVersion=8.0&charset=utf8mb4

# MongoDB Atlas
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/
MONGO_DB=vite_gourmand_stats

# Mails (Brevo API)
MAILER_DSN=brevo+api://VOTRE_CLE_API@default
MAILER_SENDER_EMAIL=votre@email.com
MAILER_SENDER_NAME=Vite & Gourmand

# Calcul livraison
ORS_API_KEY=votre_cle_openrouteservice

# JWT
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=

# Messenger
MESSENGER_TRANSPORT_DSN=sync://

# CORS
CORS_ALLOW_ORIGIN=^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$
```

### 4. Générer les clés JWT

Les clés sont déjà générées dans `config/jwt/` (exclues du dépôt via `.gitignore`). Si elles sont absentes sur votre machine :

```bash
php bin/console lexik:jwt:generate-keypair
```

### 5. Créer la base de données et appliquer les migrations

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
```

### 6. Charger les données de test

```bash
mysql -u root -p vite_gourmand < data_only.sql
```

> **Note** : le fichier `database.sql` (structure + données, en SQL brut, sans dépendance à Doctrine) est fourni séparément comme livrable démontrant la maîtrise du langage SQL, conformément à l'exigence de l'énoncé ECF (*"L'utilisation de fixture et/ou de migration n'implique pas que vous maitrisez le SQL"*). Le schéma réellement utilisé par l'application est celui généré par les migrations Doctrine ci-dessus, alimenté par `data_only.sql`.

### 7. Lancer les serveurs

Back-end :

```bash
symfony server:start
```

Front-end :

```bash
php -S localhost:3000
```

L'application est accessible sur `http://localhost:3000`

## 👤 Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@vitegourmand.fr | Admin@1234 |
| Employé | employe@vitegourmand.fr | Employe@1234 |
| Utilisateur | marie.dupont24@email.com | Visiteur@12345 |

## 🌐 Application en ligne

| Service | URL |
|---|---|
| Front-end | https://project-8562e.vercel.app |
| Back-end | https://vite-gourmand-back-chap.onrender.com |

## 🌿 Organisation des branches Git

```
main
└── develop
    ├── feature/authentification
    ├── feature/gestion-menus
    ├── feature/commandes
    ├── feature/espace-utilisateur
    ├── feature/espace-employe
    └── feature/espace-admin
```

## 📁 Structure du projet

```
Vite-Gourmand/          ← Front-end
├── css/                # CSS compilé
├── scss/               # Sources SCSS
├── js/
│   ├── api.js          # Appels API centralisés
│   ├── script.js       # Logique applicative
│   └── Router/         # Routeur SPA
├── images/             # Assets
├── pages/              # Pages HTML (SPA)
├── index.html          # Point d'entrée
└── README.md

Vite-Gourmand-back/     ← Back-end Symfony
├── src/
│   ├── Controller/     # Routes API REST
│   ├── Entity/         # Entités Doctrine
│   ├── Repository/     # Requêtes BDD
│   └── Service/        # Services (Mail, Livraison, MongoDB)
├── config/             # Configuration Symfony
├── migrations/         # Migrations Doctrine
└── public/             # Point d'entrée Apache
```

## 🔒 Sécurité

- Authentification JWT (tokens signés RS256)
- Mots de passe hashés (bcrypt)
- Protection CSRF via tokens
- Validation des entrées côté serveur (Symfony Validator)
- Gestion des rôles : `ROLE_USER`, `ROLE_EMPLOYE`, `ROLE_ADMIN`
- Protection XSS côté front (`sanitize()`)
- CORS configuré (NelmioCorsBundle)
- Content Security Policy stricte (NelmioSecurityBundle)
- Conformité RGPD

## ♿ Accessibilité

L'application respecte les critères du RGAA (Référentiel Général d'Amélioration de l'Accessibilité) :

- Skip links
- Attributs `aria-*`
- Navigation clavier
- Contraste suffisant

## 🔗 Gestion de projet

Tableau de suivi : Notion

## 📄 Licence

Projet réalisé dans le cadre de l'ECF — TP Développeur Web et Web Mobile (Studi).
