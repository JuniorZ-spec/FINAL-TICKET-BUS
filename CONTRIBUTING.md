# Guide de contribution — TICKET-BUS

## Workflow Git

### Branches

| Branche | Rôle |
|---------|------|
| `main` | Reflète la production — **aucun push direct** |
| `develop` | Intégration continue, reflète le staging — **aucun push direct** |
| `feature/<nom>` | Nouvelle fonctionnalité |
| `fix/<nom>` | Correction de bug |
| `refactor/<nom>` | Refactoring |

### Règles absolues

1. **Aucun push direct sur `main` ou `develop`.** Tout passe par Pull Request avec au moins 1 approbation.
2. **Aucun secret en dur dans le code.** Variables d'environnement uniquement, documentées dans `.env.example`.
3. **Toute PR touchant auth, paiements ou multi-tenant doit être revue par le lead technique.**

### Créer une branche de travail

```bash
# Partir toujours de develop à jour
git checkout develop
git pull origin develop

# Créer la branche
git checkout -b feature/nom-de-la-feature
# ou
git checkout -b fix/nom-du-bug
```

### Ouvrir une Pull Request

1. Pousser la branche : `git push origin feature/nom-de-la-feature`
2. Ouvrir une PR vers `develop` sur GitHub
3. Attendre au moins 1 approbation
4. Le CI doit passer au vert avant le merge
5. Merger via **Squash and merge** pour garder un historique propre

### Merge develop → main

Uniquement lors des releases, via PR de `develop` vers `main`, avec approbation du lead.

---

## Conventions de commits

Format : `type(scope): description courte`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation uniquement |
| `chore` | Tâches de maintenance (deps, config, CI) |

### Exemples

```
feat(auth): add JWT refresh token endpoint
fix(booking): correct seat count on concurrent reservations
refactor(trips): extract trip generation into service
chore(deps): upgrade prisma to 5.23.0
```

### Règles

- Description en **minuscules**, sans point final
- Maximum 72 caractères sur la première ligne
- Corps du message (optionnel) après une ligne vide pour expliquer le **pourquoi**

---

## Linting & formatage

Le pre-commit hook tourne automatiquement ESLint + Prettier sur les fichiers stagés.

Pour corriger manuellement avant de committer :

```bash
# Backend
npm run lint:backend
npm run format:backend

# Frontend
npm run lint:client
npm run format:client
```

---

## Variables d'environnement

Copier `.env.example` vers `backend/.env` et remplir les valeurs :

```bash
cp .env.example backend/.env
```

**Ne jamais committer un fichier `.env`.**

---

## Lancer le projet en local

```bash
# Prérequis : Node 20+, Redis (WSL2 ou Docker)

# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (autre terminal)
cd client
npm install
npm run dev
```

---

## Revue de code

- Commenter les lignes de code, pas les personnes
- Expliquer le **pourquoi** d'un changement demandé, pas seulement le quoi
- Une PR = une chose. Si le scope dérive, ouvrir une PR séparée
- Répondre aux commentaires avant de merger
