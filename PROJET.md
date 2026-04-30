# TICKET-BUS — Document de référence projet

> Ce document est destiné à toute personne rejoignant le projet.
> Il couvre le contexte, l'état actuel du code, les décisions techniques prises et la roadmap complète.

---

## 1. C'est quoi ce projet ?

Une plateforme SaaS de réservation de billets de bus, conçue pour le marché béninois (et potentiellement l'Afrique de l'Ouest).

**Le modèle :** plusieurs compagnies de transport s'inscrivent sur la plateforme. Les voyageurs recherchent des trajets, réservent et paient en ligne. La plateforme prend une commission sur chaque transaction et verse le reste à la compagnie.

**Trois types d'acteurs :**
- **Voyageurs** — cherchent des trajets, réservent, paient
- **Compagnies** — gèrent leurs bus, trajets, réservations
- **Admins** — gèrent la plateforme, valident les compagnies, fixent les commissions

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js 20 / Express |
| ORM | Prisma 5.22 |
| Base de données | PostgreSQL (Neon cloud en dev, RDS AWS en prod) |
| Cache / locks | Redis (WSL2 en dev local) |
| Frontend | React 18 / Vite / Ant Design / Tailwind CSS |
| État client | Redux Toolkit |
| Paiement | KKiaPay (intégration à refondre — voir LOT 11) |
| Auth | JWT + bcryptjs (en cours de refonte — voir LOT 8) |
| Conteneurs | Docker / Docker Compose |
| CI | GitHub Actions |
| Hébergement cible | AWS ECS Fargate + RDS + ElastiCache |

---

## 3. Structure du repo

```
TICKET-BUS/
├── backend/                  ← API Node.js/Express
│   ├── controllers/          ← logique métier (authController, tripController, etc.)
│   ├── routes/               ← définition des endpoints
│   ├── middlewares/          ← authMiddleware, requireRole
│   ├── prisma/
│   │   ├── schema.prisma     ← schéma de la base de données
│   │   └── migrations/       ← historique des migrations SQL
│   ├── prismaClient.js       ← instance Prisma partagée
│   ├── redisClient.js        ← instance Redis partagée
│   ├── scripts/seedAdmin.js  ← créer le premier admin
│   ├── server.js             ← point d'entrée
│   ├── Dockerfile            ← multi-stage, user non-root
│   └── .env.example          ← template des variables d'env
├── client/                   ← frontend React/Vite
│   ├── src/
│   │   ├── pages/            ← Admin/, Company/, voyageur
│   │   ├── components/       ← composants réutilisables
│   │   ├── redux/            ← store, slices
│   │   └── helpers/          ← axiosInstance (intercepteurs JWT)
│   ├── Dockerfile            ← multi-stage (build Vite → nginx)
│   └── nginx.conf            ← proxy /api → backend, SPA fallback
├── .github/workflows/ci.yml  ← pipeline CI GitHub Actions
├── docker-compose.yml        ← orchestration locale (backend + frontend + redis)
├── CONTRIBUTING.md           ← workflow Git, conventions de commits
└── .env.example              ← variables d'env racine
```

---

## 4. Schéma de base de données actuel

```
User          ← voyageur ou admin (UserRole: USER | ADMIN)
Company       ← entité compagnie (avec son propre mot de passe — à refondre LOT 8)
Bus           ← appartient à une Company
Station       ← appartient à une Company
Trip          ← un trajet (Bus + Station départ/arrivée + date + prix)
Booking       ← réservation (User + Trip + seats[])
Review        ← avis d'un User sur une Company
```

> **Important :** ce schéma est fonctionnel mais sera partiellement remplacé lors du LOT 8 (auth) et du LOT 10 (modèle Route/Schedule/Trip).

---

## 5. Ce qui est fait

### Migration MongoDB → PostgreSQL/Prisma
Le projet a été migré depuis une base MongoDB/Mongoose vers PostgreSQL via Prisma. Cette migration couvre :
- Schéma Prisma complet (User, Company, Bus, Station, Trip, Booking, Review)
- Tous les controllers réécrits avec Prisma (auth, admin, company, booking, trip, bus, station)
- Frontend entièrement aligné sur la nouvelle API (champs `id` au lieu de `_id`, stations en objets uniques, etc.)
- Middleware `requireRole` pour le RBAC basique
- Script `seedAdmin.js` pour créer le premier compte admin
- Redis pour le verrouillage des sièges lors des réservations

### LOT 1 — Discipline Git
- Branche `develop` créée, `main` et `develop` protégées sur GitHub (PR obligatoire, 1 approbation minimum)
- Workflow de branches : `feature/*`, `fix/*`, `refactor/*` → PR vers `develop` → release vers `main`
- Husky + lint-staged : ESLint + Prettier s'exécutent automatiquement avant chaque commit
- ESLint configuré sur backend (`.eslintrc.json`) et frontend (`.eslintrc.json`)
- Prettier configuré à la racine (`.prettierrc`)
- `CONTRIBUTING.md` : workflow Git, conventions de commits, règles de revue

**Conventions de commits :**
```
feat(scope): description     ← nouvelle fonctionnalité
fix(scope): description      ← correction de bug
refactor(scope): description ← refactoring
chore(scope): description    ← maintenance (deps, config, CI)
test(scope): description     ← tests
docs(scope): description     ← documentation
```

### LOT 6 — Docker
- **Backend Dockerfile** : multi-stage (builder génère le client Prisma, runner = image minimale en user non-root)
- **Frontend Dockerfile** : multi-stage (builder compile React/Vite, runner = nginx)
- **docker-compose.yml** : orchestre backend + frontend + redis avec healthchecks
- Endpoint `GET /health` sur le backend (utilisé par les healthchecks Docker et futur ECS)

### LOT 7 — CI GitHub Actions
Pipeline déclenché sur chaque PR et push vers `main` ou `develop` :

```
lint-backend  → ESLint + Prettier check (en parallèle)
lint-client   → ESLint + Prettier check (en parallèle)
security      → npm audit --audit-level=critical (en parallèle)
build         → Docker build backend + frontend (après lint seulement)
```

Fichier : `.github/workflows/ci.yml`

---

## 6. Comment lancer le projet en local

**Prérequis :** Node.js 20+, Redis actif (WSL2 : `sudo service redis-server start`)

```bash
# 1. Cloner le repo
git clone https://github.com/JuniorZ-spec/FINAL-TICKET-BUS.git
cd FINAL-TICKET-BUS

# 2. Configurer l'environnement backend
cp backend/.env.example backend/.env
# Remplir les valeurs dans backend/.env (DATABASE_URL, jwt_secret, EMAIL, etc.)

# 3. Installer et migrer
cd backend
npm install
npx prisma migrate dev
node scripts/seedAdmin.js    ← crée le premier compte admin
npm run dev                  ← démarre sur http://localhost:5000

# 4. Lancer le frontend (autre terminal)
cd client
npm install
npm run dev                  ← démarre sur http://localhost:5173
```

**Via Docker (redis + backend + frontend) :**
```bash
docker compose up --build
# Backend  → http://localhost:5000
# Frontend → http://localhost:80
```

---

## 7. Roadmap — Ce qui reste à faire

### LOT 8 — Refonte auth & autorisation ← PROCHAIN

**Pourquoi :** le modèle actuel (User/ADMIN + Company séparée) ne supporte pas le multi-tenant, ni les niveaux de sécurité requis.

**Ce qui change dans le schéma :**
```
users               ← table centrale (email, password_hash, user_type, statut, 2FA)
  ├── traveler_profiles    ← données voyageur
  ├── company_members      ← lie un user à une Company (rôle: owner/admin/operator)
  └── admin_profiles       ← données admin
user_sessions       ← refresh tokens stockés en base (révocables)
invitations         ← flux d'invitation compagnie (token à usage unique, hashé)
audit_logs          ← append-only, toutes les actions sensibles
```

**Ce qui change dans l'API :**
```
POST /api/traveler/auth/register
POST /api/traveler/auth/login
POST /api/company/auth/login
POST /api/company/auth/accept-invitation
POST /api/admin/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

**Points techniques clés :**
- JWT 15 minutes (au lieu de 1 jour actuellement)
- Refresh token en base, révocable, durée selon le type d'acteur
- Chaque endpoint vérifie strictement le `user_type` — un admin qui tente `/traveler/login` reçoit une erreur générique
- 2FA TOTP obligatoire pour company_member et admin (optionnel voyageur)
- Flux invitation : l'admin crée une Company → envoie un email d'invitation → le destinataire active son compte et configure son 2FA

---

### LOT 9 — Architecture multi-tenant

**Pourquoi :** garantir qu'une compagnie ne peut jamais voir les données d'une autre, même en cas de bug applicatif.

- `company_id` non nullable sur toutes les tables métier
- Repository pattern : filtre `company_id` injecté automatiquement dans toutes les requêtes
- Row-Level Security PostgreSQL activée sur toutes les tables multi-tenantes

---

### LOT 10 — Refonte modèle Route/Schedule/Trip

**Pourquoi :** le modèle Trip actuel est trop simple. Un trajet récurrent (ex: Cotonou→Porto-Novo tous les jours à 8h) ne devrait pas être créé manuellement un par un.

- `routes` : trajet entre deux arrêts
- `schedules` : pattern de récurrence (RFC 5545 rrule)
- `trips` : instances matérialisées par un job cron depuis les schedules
- `stops` : arrêts partagés entre compagnies, gérés par l'admin

---

### LOT 11 — Intégration PSP marketplace

- Choix du PSP (Stripe Connect / Flutterwave / Paystack selon les marchés cibles)
- Onboarding KYC des compagnies
- Flux de paiement avec split automatique (montant compagnie + commission plateforme)
- Gestion des remboursements et payouts
- Webhooks idempotents (signature HMAC, déduplication par event_id)
- Réconciliation quotidienne automatique

---

### LOT 12 — Notifications & jobs asynchrones

- BullMQ + Redis pour les jobs asynchrones
- Emails transactionnels : confirmation de réservation, invitation compagnie, reset password
- Génération de tickets PDF avec QR code
- Job cron de matérialisation des trips (depuis les schedules)

---

### LOT 13-15 — Infrastructure AWS

- Terraform : VPC, ECS Fargate, RDS PostgreSQL, ElastiCache Redis, S3, CloudFront
- Sous-domaines : `app.`, `pro.`, `admin.`, `api.`
- Pipeline CD : deploy automatique sur staging (merge develop), deploy prod manuel (merge main)
- Observabilité : logs structurés Pino → CloudWatch, Sentry, alertes Slack

---

### LOT 16-18 — Sécurité, tests, lancement

- Helmet, CORS strict, validation Zod sur tous les endpoints, rate limiting Redis
- Tests d'intégration (auth, paiements, multi-tenant)
- Tests de charge (k6)
- Audit de sécurité externe
- Beta fermée avec 1 compagnie partenaire pilote

---

## 8. Décisions techniques importantes

| Décision | Raison |
|----------|--------|
| PostgreSQL (Neon) au lieu de MongoDB | Données relationnelles, contraintes FK, Row-Level Security, meilleures performances pour les requêtes multi-tenant |
| Prisma au lieu de SQL brut | Migrations versionnées, type safety, DX, génération automatique du client |
| Redis pour le verrouillage des sièges | Évite les doubles réservations sur le même siège sans transactions distribuées complexes |
| JWT courte durée + refresh token | Un JWT longue durée ne peut pas être invalidé si un compte est compromis |
| Multi-stage Dockerfile | Image de prod minimale (pas de devDeps, user non-root) |
| Monorepo (backend + client dans le même repo) | Équipe réduite, deploy atomique, CI simplifié |

---

## 9. Variables d'environnement requises

Voir `backend/.env.example` pour la liste complète et documentée.

Variables critiques :
- `DATABASE_URL` — connexion PostgreSQL (Neon en dev)
- `REDIS_URL` — connexion Redis
- `jwt_secret` — clé de signature JWT (**ne jamais commiter la vraie valeur**)
- `EMAIL` / `EMAIL_PASS` — compte Gmail pour les emails transactionnels
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials du premier admin (script seedAdmin)

---

## 10. Contacts & ressources

- Repo GitHub : https://github.com/JuniorZ-spec/FINAL-TICKET-BUS
- Plan technique détaillé : `PLAN_REFONTE_EQUIPE.md` (document interne)
- Workflow de contribution : `CONTRIBUTING.md`
