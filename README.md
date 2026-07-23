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
- [Migration cloud AWS (projet DevOps)](#migration-cloud-aws-projet-devops)
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

## Migration cloud AWS (projet DevOps)

En parallèle du développement produit, ce repo sert de **projet vitrine
DevOps** : migration d'un déploiement EC2/SSH manuel vers une architecture
AWS managée, pilotée en Terraform + GitHub Actions OIDC. Aucune nouvelle
fonctionnalité métier — l'objectif est l'infrastructure elle-même.

**Contrainte** : ~60$ de crédits AWS → infra **éphémère**. Tout se
développe en local (`docker compose`), AWS ne sert que pour des sessions de
démo (`terraform apply` → démo → `terraform destroy`). Pas de NAT Gateway,
rien ne tourne en permanence sauf le frontend (S3/CloudFront), le state
Terraform et les repos ECR (stockage seul).

### Architecture cible

| Composant | Service AWS |
| --- | --- |
| CI/CD | GitHub Actions, OIDC (pas de clé AWS statique), scan Trivy, push ECR |
| Frontend | S3 + CloudFront |
| API | ECS Fargate + ALB, secrets en SSM Parameter Store |
| Base de données | RDS PostgreSQL |
| Réservation de siège | SQS FIFO + Lambda + DLQ (garantie zéro double réservation) |

### État d'avancement

| Phase | Statut | Détail |
| --- | --- | --- |
| 0 — Fondations (state Terraform, OIDC, budget) | ✅ Fait, appliqué sur AWS | `terraform/bootstrap` |
| 1 — Réseau (VPC, subnets publics, security groups) | ✅ Fait, vérifié puis détruit | `terraform/network` |
| 2 — CI/CD (OIDC, Trivy, ECR) | ✅ Fait | `.github/workflows/`, `terraform/ecr` |
| 3 — Frontend (S3 + CloudFront) | ⏸️ Bloqué | S3/OAC créés ; CloudFront refusé (`AccessDenied`, compte AWS à vérifier via un ticket AWS Support) — `terraform/frontend` |
| 4/5 — API ECS Fargate + ALB + RDS | ✅ Fait, vérifié bout-en-bout sur AWS réel (`/health` → 200, migration + seed OK) | `terraform/backend` |
| 6 — Réservation asynchrone SQS + Lambda + DLQ | 🚧 En cours | Code fait (`bookingController`, `lambda/booking-processor`, `terraform/async`) ; build/push des images et test bout-en-bout en cours |
| 7 — Test de charge k6 (50 users / 40 sièges) | ⏳ À faire | |
| 8 — Runbook démo & destroy | 🚧 Partiel | Séquence rédigée (`docs/demo-runbook.md`), tableau de coûts réels à compléter |

### Ce qu'il reste à faire

- Finir la Phase 6 : pousser des images backend/Lambda à jour, `terraform apply` du module `async`, vérifier qu'une double réservation simultanée produit bien une confirmation et un refus propre (pas de doublon)
- Débloquer la Phase 3 (ticket AWS Support pour la vérification CloudFront)
- Écrire et lancer le test k6 (Phase 7) : 50 utilisateurs, 40 sièges, objectif 40 confirmations / 10 refus propres / 0 doublon
- Compléter le tableau de coûts réels par session de démo (Phase 8)

### Décisions techniques notables

- **Bug corrigé, pas juste déplacé** : l'ancienne logique de réservation avait une race condition (lecture optimiste puis écriture, sans contrainte DB). La contrainte `@@unique([tripId, seat])` sur `BookingSeat` est ce qui garantit réellement l'absence de doublon, indépendamment de l'ordre de traitement — voir `backend/prisma/schema.prisma` et `lambda/booking-processor/index.ts`.
- IAM du role de déploiement CI construit **incrémentalement** (un statement ajouté par service introduit), visible commit par commit dans `terraform/bootstrap/iam-policy.tf`.
- RDS en subnet public + security group verrouillé (pas de NAT Gateway) : compromis budget assumé et documenté, pas un oubli.
- Images ECR immutables, pas de tag `latest` — chaque déploiement référence un sha de commit exact.

### Documentation détaillée

- [`docs/decisions.md`](docs/decisions.md) — journal des choix techniques et résultats chiffrés, phase par phase (bugs rencontrés inclus)
- [`docs/demo-runbook.md`](docs/demo-runbook.md) — séquence exacte pour lancer/vérifier/détruire une session de démo
- [`terraform/README.md`](terraform/README.md) — structure des modules Terraform

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

## Notes

- Vérification de connectivité Git (push de test) effectuée le 2026-07-22.
