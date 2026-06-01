# 🍽️ Recipes API

<p>
  <a href="https://github.com/DanyNaumann/node-training/actions/workflows/ci.yml"><img src="https://github.com/DanyNaumann/node-training/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Zod-validation-3E67B1?logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/OpenAPI-3-6BA539?logo=openapiinitiative&logoColor=white" alt="OpenAPI 3" />
  <img src="https://img.shields.io/badge/tests-39%20passing-success?logo=vitest&logoColor=white" alt="39 tests passing" />
  <img src="https://img.shields.io/badge/coverage-~92%25-success" alt="Coverage ~92%" />
  <img src="https://img.shields.io/badge/license-ISC-blue" alt="License ISC" />
</p>

API REST de gestion de recettes de cuisine, sécurisée par authentification
([Better Auth](https://better-auth.com)) et un système de permissions **RBAC à 3 rôles**.

Construite en **TypeScript** sur **Express 5**, avec persistance **SQLite via Drizzle ORM**,
validation **Zod** et documentation **OpenAPI / Swagger**.

---

## ✨ Fonctionnalités

- 🔐 **Authentification** email + mot de passe (sessions par cookie signé)
- 👥 **RBAC** à 3 rôles : `user`, `editor`, `admin`
- 🍳 **CRUD recettes** avec pagination et filtre par durée
- 🛠️ **Administration** des comptes (liste, changement de rôle)
- ✅ **Validation** des entrées avec Zod (erreurs détaillées)
- 📖 **Documentation interactive** Swagger sur `/docs`
- 🛡️ **Hardening** : Helmet, rate limiting, limite de payload, arrêt gracieux
- 🧪 **39 tests** (Vitest + Supertest), ~92 % de couverture

---

## 🧱 Stack technique

| Domaine            | Technologie                              |
| ------------------ | ---------------------------------------- |
| Langage            | TypeScript (ESM, NodeNext)               |
| Runtime            | Node.js 22+ (LTS)                        |
| Framework HTTP     | Express 5                                |
| Auth               | Better Auth (plugin `admin` pour le RBAC) |
| Base de données    | SQLite (`better-sqlite3`) + Drizzle ORM  |
| Validation         | Zod                                      |
| Documentation      | OpenAPI 3 + Swagger UI                   |
| Sécurité           | Helmet, express-rate-limit               |
| Tests              | Vitest + Supertest                       |

---

## 🚀 Démarrage

### Prérequis

- Node.js ≥ 22 (requis par la stack ; `kysely`, dépendance de Better Auth, exige Node 22+)
- npm

### Installation

```bash
npm install
```

### Configuration

Crée un fichier `.env` à la racine (voir `.env.example`) :

```env
BETTER_AUTH_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum
BETTER_AUTH_URL=http://localhost:3000
PORT=3000
```

> Génère un secret solide avec : `openssl rand -base64 32`

### Initialisation de la base

La base SQLite est partagée entre Better Auth (tables `user`, `session`…) et
l'application (table `recipe`). Deux migrations à lancer une fois :

```bash
npm run auth:migrate   # tables Better Auth
npm run db:migrate     # table recipe (Drizzle)
```

### Lancer le serveur

```bash
npm run dev      # développement (tsx watch, rechargement auto)
# ou
npm run build && npm start   # production (compilé vers dist/)
```

L'API écoute sur `http://localhost:3000`.
📖 Documentation interactive : **http://localhost:3000/docs**

---

## 📜 Scripts npm

| Script                 | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Démarre en mode dev (tsx watch)                    |
| `npm run build`        | Compile TypeScript → `dist/`                       |
| `npm start`            | Lance la version compilée                          |
| `npm run typecheck`    | Vérifie les types sans émettre de fichiers         |
| `npm test`             | Lance la suite de tests                            |
| `npm run test:watch`   | Tests en mode watch                                |
| `npm run test:coverage`| Tests + rapport de couverture                      |
| `npm run db:generate`  | Génère une migration Drizzle depuis le schéma      |
| `npm run db:migrate`   | Applique les migrations Drizzle                    |
| `npm run auth:migrate` | Crée/maj les tables Better Auth                    |

---

## 🔐 Rôles & permissions

| Rôle     | Lire | Créer | Modifier | Supprimer | Gérer les comptes |
| -------- | :--: | :---: | :------: | :-------: | :---------------: |
| `user`   |  ✅  |   ❌  |    ❌    |    ❌     |        ❌         |
| `editor` |  ✅  |   ✅  |    ✅    |    ❌     |        ❌         |
| `admin`  |  ✅  |   ✅  |    ✅    |    ✅     |        ✅         |

Tout nouveau compte reçoit le rôle `user` par défaut.

---

## 📡 Endpoints

### Authentification — `/api/auth/*` (fournis par Better Auth)

| Méthode | Route                        | Description              |
| ------- | ---------------------------- | ------------------------ |
| POST    | `/api/auth/sign-up/email`    | Créer un compte          |
| POST    | `/api/auth/sign-in/email`    | Se connecter             |
| POST    | `/api/auth/sign-out`         | Se déconnecter           |
| GET     | `/api/auth/get-session`      | Récupérer la session     |

### Recettes — `/api/v1/recipes` _(session requise)_

| Méthode | Route                   | Permission      | Détail                                   |
| ------- | ----------------------- | --------------- | ---------------------------------------- |
| GET     | `/api/v1/recipes`       | `recipe:read`   | Liste paginée. `?maxDuration=N&limit=&offset=` |
| GET     | `/api/v1/recipes/:id`   | `recipe:read`   | 404 si introuvable                       |
| POST    | `/api/v1/recipes`       | `recipe:create` | Création (validation Zod)                |
| PUT     | `/api/v1/recipes/:id`   | `recipe:update` | Mise à jour partielle                    |
| DELETE  | `/api/v1/recipes/:id`   | `recipe:delete` | 204 sans body                            |

### Administration — `/api/v1/admin` _(admin uniquement)_

| Méthode | Route                              | Détail                          |
| ------- | ---------------------------------- | ------------------------------- |
| GET     | `/api/v1/admin/users`              | Liste tous les comptes          |
| PATCH   | `/api/v1/admin/users/:id/role`     | Change le rôle d'un utilisateur |

### Divers

| Méthode | Route            | Détail                          |
| ------- | ---------------- | ------------------------------- |
| GET     | `/health`        | Sonde liveness/readiness        |
| GET     | `/docs`          | Swagger UI                      |
| GET     | `/openapi.json`  | Spécification OpenAPI brute     |

---

## 🧪 Exemples

```bash
# Créer un compte (rôle "user" par défaut)
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"name":"Alice","email":"alice@test.com","password":"password123"}' \
  -c cookies.txt

# Lister les recettes (avec le cookie de session)
curl http://localhost:3000/api/v1/recipes -b cookies.txt

# Filtrer + paginer
curl "http://localhost:3000/api/v1/recipes?maxDuration=20&limit=10&offset=0" -b cookies.txt
```

Réponse de la liste (paginée) :

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "name": "Pâtes carbonara",
      "ingredients": ["pâtes", "œufs", "lardons"],
      "duration": 20,
      "createdBy": "user-id",
      "createdAt": "2026-06-01T09:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

> ℹ️ Les routes qui modifient l'état (sign-in, sign-out…) exigent un en-tête
> `Origin` correspondant à `BETTER_AUTH_URL` (protection CSRF). Un navigateur
> l'envoie automatiquement ; en curl, ajoute `-H "Origin: http://localhost:3000"`.

---

## 🏗️ Architecture

```
recipes-api/
├── src/
│   ├── index.ts              # app Express : middlewares, montage des routes
│   ├── auth.ts               # config Better Auth + access control (rôles)
│   ├── db.ts                 # connexion SQLite + Drizzle + repository recettes
│   ├── schema.ts             # schéma Drizzle de la table recipe
│   ├── schemas.ts            # schémas Zod (validation + OpenAPI)
│   ├── openapi.ts            # génération du document OpenAPI
│   ├── middleware/
│   │   ├── session.ts        # authentification → 401
│   │   ├── rbac.ts           # autorisation (requirePermission) → 403
│   │   ├── validate.ts       # validation Zod (body/query/params) → 400
│   │   ├── rateLimit.ts      # limiteurs de débit
│   │   └── error.ts          # AppError, notFoundHandler, errorHandler
│   ├── routes/
│   │   ├── recipes.ts        # CRUD /api/v1/recipes
│   │   └── admin.ts          # /api/v1/admin/users
│   └── types/express.d.ts    # augmentation de Request (req.user, req.session)
├── drizzle/                  # migrations SQL générées
├── tests/                    # tests unitaires + intégration (Vitest)
├── drizzle.config.ts
├── tsconfig.json
└── vitest.config.js
```

### Chaîne d'une requête protégée

```
DELETE /api/v1/recipes/:id
   │
   ├─ sessionMiddleware      → 401 si pas de session valide (authentification)
   ├─ requirePermission()    → 403 si rôle insuffisant     (autorisation)
   ├─ validate()             → 400 si entrée invalide       (validation Zod)
   └─ handler                → 204
```

Distinction clé : **401** = non authentifié (« qui es-tu ? ») vs **403** =
authentifié mais sans la permission (« as-tu le droit ? »).

### Base de données

Un **unique fichier SQLite** (`auth.sqlite`) partagé par :

- **Better Auth** → tables `user`, `session`, `account`, `verification`
- **L'application** → table `recipe` (gérée par Drizzle)

Deux systèmes de migration distincts car deux propriétaires de tables distincts
(`auth:migrate` pour Better Auth, `db:migrate` pour Drizzle).

---

## 🛡️ Sécurité & fiabilité

- **Helmet** — en-têtes HTTP de sécurité + CSP explicite
- **Rate limiting** — global + renforcé sur `/api/auth` (anti brute-force) ;
  permissif en dev, strict en production (`NODE_ENV=production`)
- **Limite de payload** — `express.json({ limit: "100kb" })`
- **Mots de passe hashés** par Better Auth, jamais stockés en clair
- **Sessions révocables** côté serveur (vs JWT auto-porteur)
- **Validation stricte** — Zod `.strict()` rejette les champs inconnus
- **Arrêt gracieux** — SIGTERM/SIGINT : fin des requêtes en cours puis fermeture propre
- **Error handler global** — réponses JSON cohérentes, jamais de stack trace exposée

---

## 🧪 Tests

```bash
npm test              # 39 tests
npm run test:coverage # + rapport de couverture
```

- **Unitaires** : permissions RBAC, repository Drizzle
- **Intégration** (Supertest) : auth, CRUD recettes, RBAC, admin, hardening

Les tests utilisent une base SQLite jetable (isolée de la base de dev), recréée
automatiquement avant chaque exécution.

---

## 📝 Licence

ISC — projet d'entraînement.
# node-training
