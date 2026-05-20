# 🍽️ Vite & Gourmand

Application web de présentation et commande de menus pour la société **Vite & Gourmand**, entreprise de traiteur basée à Bordeaux.

---

## 📋 Description

Vite & Gourmand propose ses prestations pour tout type d'événement (Noël, Pâques, événements professionnels...). Cette application permet :
- De consulter les menus disponibles
- De passer commande en ligne
- De gérer les commandes (espace utilisateur, employé et administrateur)

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Front-end | HTML5, CSS3, SCSS, JavaScript |
| Back-end | PHP (PDO) |
| Base de données relationnelle | MySQL / MariaDB |
| Base de données NoSQL | MongoDB |
| Déploiement | fly.io / Vercel |

---

## ⚙️ Prérequis

Avant de lancer le projet en local, assurez-vous d'avoir installé :

- [PHP](https://www.php.net/) >= 8.0
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) >= 18
- [MySQL](https://www.mysql.com/) ou [MariaDB](https://mariadb.org/)
- [MongoDB](https://www.mongodb.com/)
- [Git](https://git-scm.com/)

---

## 🚀 Installation en local

### 1. Cloner le dépôt

```bash
git clone https://github.com/joujjj/Vite-Gourmand.git
cd Vite-Gourmand
```

### 2. Installer les dépendances front-end

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copier le fichier `.env.example` en `.env` :

```bash
cp .env.example .env
```

Puis renseigner les valeurs dans `.env` :

```env
# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vite_gourmand
DB_USER=root
DB_PASSWORD=

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=vite_gourmand_stats

# Mail (SMTP)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=contact@vitegourmand.fr
MAIL_PASSWORD=
MAIL_FROM=contact@vitegourmand.fr

# Application
APP_URL=http://localhost:8000
APP_SECRET=changez_cette_valeur
```

### 4. Créer la base de données

```bash
# Créer la base et les tables
mysql -u root -p < database/create.sql

# Insérer les données de test
mysql -u root -p vite_gourmand < database/seed.sql
```

### 5. Lancer le serveur PHP

```bash
php -S localhost:8000
```

### 6. Compiler le SCSS (optionnel)

```bash
npm run dev
```

L'application est accessible sur **http://localhost:8000**

---

## 👤 Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@vitegourmand.fr | Admin@1234 |
| Employé | employe@vitegourmand.fr | Employe@1234 |
| Utilisateur | utilisateur@vitegourmand.fr | User@1234 |

---

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

- `main` : branche de production (stable)
- `develop` : branche de développement
- `feature/*` : une branche par fonctionnalité, issue de `develop`

---

## 📁 Structure du projet

```
Vite-Gourmand/
├── css/              # Fichiers CSS compilés
├── scss/             # Sources SCSS
├── js/               # Scripts JavaScript
├── images/           # Assets images
├── pages/            # Pages HTML
├── Router/           # Routeur PHP
├── database/
│   ├── create.sql    # Création des tables
│   └── seed.sql      # Données de test
├── .env.example      # Exemple de configuration
├── .gitignore
├── index.html
└── README.md
```

---

## 🔒 Sécurité

- Mots de passe hashés (bcrypt)
- Protection contre les injections SQL (PDO avec requêtes préparées)
- Validation des entrées côté serveur
- Gestion des rôles et accès restreints par route
- Conformité RGPD

---

## ♿ Accessibilité

L'application respecte les critères du **RGAA** (Référentiel Général d'Amélioration de l'Accessibilité).

---

## 📄 Licence

Projet réalisé dans le cadre de l'ECF — TP Développeur Web et Web Mobile (Studi).
