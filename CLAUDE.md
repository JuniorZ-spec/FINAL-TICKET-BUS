# Ticket Bus (AliGo.bj) : déploiement

## Vue d'ensemble
Monorepo : `backend/` (Node.js, Express, TypeScript, Prisma) et `client/` (React, Vite).
Repo : github.com/JuniorZ-spec/FINAL-TICKET-BUS

## Production réelle (la démo publique)
| Couche | Hébergeur | Adresse |
|---|---|---|
| Frontend (client/) | Vercel | https://ticket-bus-taupe.vercel.app |
| Backend (backend/) | Render (offre gratuite) | https://final-ticket-bus.onrender.com |
| Base PostgreSQL | Neon | voir DATABASE_URL sur Render |
| Cache Redis | À COMPLÉTER (fournisseur ?) | REDIS_URL sur Render |
| Paiement | KKiaPay (script chargé dans le frontend) | |

Le backend gratuit de Render s'endort : la première requête met 30 à 60 s.
`GET /` renvoie 404 sur le backend, c'est normal (pas de route racine). Santé : `GET /health`.

## Ce qui est déployé automatiquement
- Frontend : Vercel redéploie à chaque push. À COMPLÉTER : branche, dossier racine (`client`), commande de build.
- Backend : Render. À COMPLÉTER : déploiement auto depuis GitHub ou manuel, branche. Scripts du dépôt : build `npm run build` (`tsc`), démarrage `npm start` (`node dist/server.js`). Aucune migration n'est lancée au démarrage.

## Piège à connaître
`.github/workflows/deploy.yml` (CD) se déclenche après la CI sur `main`/`develop`, construit et pousse
des images Docker vers AWS ECR. Ce n'est PAS le déploiement de la démo : c'est un pipeline prévu pour
une production AWS (voir `terraform/` et `docs/decisions.md`). Ne pas le confondre avec Vercel + Render.
`ci.yml` (lint, TypeScript, audit, build) est lui bien actif. L'audit de sécurité et Trivy échouent
déjà sur `main` (constat du 2026-09-20), ils ne bloquent pas la fusion.

## Variables d'environnement (noms uniquement, jamais les valeurs)
Backend (Render) : DATABASE_URL, REDIS_URL, jwt_secret, EMAIL, EMAIL_PASS,
FRONTEND_URL (adresse Vercel, pour les liens de réinitialisation), PORT.
Frontend (Vercel) :
- `VITE_API_URL` : adresse du backend Render (sans elle, le front appelle `/api` sur Vercel lui-même et échoue).
- `VITE_KKIAPAY_KEY` : clé publique KKiaPay.
- `VITE_KKIAPAY_SANDBOX` : `true` en démo, `false` uniquement pour de vrais paiements.
Voir `client/.env.example`.

## Base de données
Prisma. Migrations : `backend/prisma/migrations`. En production : `npx prisma migrate deploy`.
Ne jamais lancer `prisma migrate dev` ni `db push` contre la base de production.
Ne jamais passer une vraie base en `--shadow-database-url` (ex. avec `prisma migrate diff`) :
Prisma la réinitialise et efface toutes les données (incident du 2026-09-16 sur la base de dev).
La base de Render est distincte de la base Neon de développement : appliquer les migrations sur chacune.
Migration à appliquer avant de déployer les avis voyageurs : `20260916205913_add_review_booking_link`.

## Comptes de démo (base locale/dev uniquement, pas la production)
Semés par `backend/scripts/seedBeninDemo.ts`, `seedTripsUntilYearEnd.ts`, `seedBackofficeDemo.ts`.
Mots de passe et emails : voir ces scripts. Ne jamais les utiliser sur la production.

## Règles
- Ne jamais écrire de secret dans un fichier versionné.
- Toute nouvelle variable d'environnement doit aussi être ajoutée dans le tableau de bord Render ou Vercel.
- Les appels API du front passent par `client/src/helpers/axiosInstance.jsx`, jamais par `axios` brut avec un chemin `/api` relatif.
