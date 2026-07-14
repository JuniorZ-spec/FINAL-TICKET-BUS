# TICKET-BUS

Plateforme de réservation de billets de bus multi-tenant, conçue pour la gestion de compagnies, voyageurs et administrateurs.

## Table des matières

- [À propos](#à-propos)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Installation locale](#installation-locale)
- [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
- [Lancer en local](#lancer-en-local)
- [Exécution avec Docker Compose](#exécution-avec-docker-compose)
- [API disponibles](#api-disponibles)
- [CI / GitHub Actions](#ci--github-actions)
- [Roadmap et points à améliorer](#roadmap-et-points-à-améliorer)
- [Contribuer](#contribuer)

## À propos

TICKET-BUS est une application de réservation de billets de bus qui met en relation :

- les voyageurs,
- les compagnies de transport,
- les administrateurs de la plateforme.

L'objectif est de fournir une interface web permettant de gérer les trajets, bus, gares, réservations, et comptes utilisateurs.

## Stack technique

- Backend : Node.js + Express
- Base de données : PostgreSQL via Prisma
- Cache / sessions : Redis
- Frontend : React + Vite + Tailwind CSS + Ant Design
- Authentification : JWT + bcrypt
- Orchestration locale : Docker Compose
- CI : GitHub Actions

## Structure du projet

```
TICKET-BUS/
├── backend/                  # API Node.js / Prisma
│   ├── controllers/          # logique métier
│   ├── routes/               # routes Express
│   ├── middlewares/          # middlewares auth et RBAC
│   ├── prisma/               # schéma Prisma et migrations
│   ├── scripts/seedAdmin.ts  # création du premier admin
│   ├── server.ts             # point d'entrée de l'API
│   ├── Dockerfile            # image backend
│   └── .env.example          # variables d'environnement backend
├── client/                   # front React/Vite
│   ├── src/                  # code source React
│   ├── components/           # composants réutilisables
│   ├── pages/                # pages utilisateur
│   ├── redux/                # store et slices
│   ├── Dockerfile            # image frontend
│   └── nginx.conf            # configuration nginx pour la SPA
├── docker-compose.yml        # orchestration locale backend / frontend / redis
├── .github/workflows/ci.yml  # pipeline CI
├── CONTRIBUTING.md          # règles de contribution et conventions Git
└── .env.example              # template de variables d'environnement principal
```

## Fonctionnalités principales

- gestion des comptes voyageur, compagnie et administrateur
- gestion des bus, stations, trajets et réservations
- création de réservations avec suivi de sièges
- interface admin pour supervision
- API REST pour le frontend
- healthcheck backend disponible sur `/health`

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/JuniorZ-spec/FINAL-TICKET-BUS.git
cd FINAL-TICKET-BUS
```

### 2. Configurer les variables d'environnement

- Copier `backend/.env.example` vers `backend/.env`
- Remplir les variables :
  - `DATABASE_URL`
  - `REDIS_URL`
  - `jwt_secret`
  - `EMAIL` / `EMAIL_PASS`
  - `FRONTEND_URL`
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  - `PORT` (optionnel)

Si besoin, consulter le fichier `.env.example` de la racine pour un template PostgreSQL.

### 3. Installer les dépendances

Backend :

```bash
cd backend
npm install
```

Frontend :

```bash
cd ../client
npm install
```

### 4. Lancer la base de données et Prisma

Depuis `backend` :

```bash
npx prisma migrate dev
node scripts/seedAdmin.js
```

Le script `seedAdmin.js` crée le premier compte administrateur si aucun admin n'existe.

## Lancer en local

### Démarrer le backend

```bash
cd backend
npm run dev
```

Le backend est accessible sur `http://localhost:5000`.

### Démarrer le frontend

```bash
cd client
npm run dev
```

Le frontend Vite est accessible sur `http://localhost:5173`.

## Exécution avec Docker Compose

Le projet contient un `docker-compose.yml` qui lance :

- un service Redis
- le backend
- le frontend

```bash
docker compose up --build
```

Endpoints :

- Backend : `http://localhost:5000`
- Frontend : `http://localhost`

## API disponibles

L'API expose les routes suivantes :

- `GET /api/users/*`
- `GET /api/buses/*`
- `GET /api/bookings/*`
- `GET /api/companys/*`
- `GET /api/admin/*`
- `GET /api/trips/*`
- `GET /api/stations/*`
- `GET /health`

> Les routes exactes sont définies dans `backend/routes/`.

## CI / GitHub Actions

Le workflow CI est défini dans `.github/workflows/ci.yml`.

Il exécute :

- lint backend (ESLint + Prettier)
- lint frontend (ESLint + Prettier)
- vérification TypeScript backend
- audit de sécurité
- build Docker backend et frontend

## Roadmap et points à améliorer

- refonte complète de l'authentification et des rôles utilisateur
- gestion multi-tenant des compagnies
- ajout de tests automatisés pour backend et frontend
- amélioration du modèle de réservation et de paiement
- enrichissement des pages Admin / Company

## Contribuer

Ce projet utilise des conventions Git classiques :

- `feat(scope): description`
- `fix(scope): description`
- `refactor(scope): description`
- `chore(scope): description`
- `docs(scope): description`

Avant chaque commit, le dépôt exécute Husky + lint-staged pour formatter le code avec Prettier et corriger les erreurs ESLint.

Pour plus de détails sur la contribution, consulter `CONTRIBUTING.md`.
