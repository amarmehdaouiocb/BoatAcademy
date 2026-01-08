# Boat Academy - Architecture

## Vue d'ensemble

```
                    ┌─────────────────────┐
                    │   admin-web         │
                    │   (Next.js 15)      │
                    │   Back-office       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   @boatacademy/     │
                    │   api-client        │◄───────────────────┐
                    │   (Facade API)      │                    │
                    └──────────┬──────────┘                    │
                               │                               │
                               ▼                               │
┌─────────────────────────────────────────────────────┐        │
│                   SUPABASE                           │        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │        │
│  │  Postgres   │  │   Storage   │  │    Edge     │  │        │
│  │  + RLS      │  │   (docs)    │  │  Functions  │  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  │        │
└─────────────────────────────────────────────────────┘        │
                               ▲                               │
                               │                               │
                    ┌──────────┴──────────┐                    │
                    │   @boatacademy/     │                    │
                    │   api-client        │────────────────────┘
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   student-mobile    │
                    │   (Expo RN)         │
                    │   App stagiaire     │
                    └─────────────────────┘
```

## Stack Technique

### Frontend

| App | Technologie | Description |
|-----|-------------|-------------|
| admin-web | Next.js 15 + App Router | Back-office admin/manager/instructor |
| student-mobile | Expo SDK 52 + Expo Router | App stagiaire iOS/Android |

### Backend (Option A - Supabase-first)

| Service | Role |
|---------|------|
| Postgres | Base de donnees avec RLS |
| Storage | Stockage documents (private bucket) |
| Edge Functions | Domain API (logique metier) |
| Auth | Authentification email/password |
| Realtime | (futur) Notifications temps reel |

### Packages partages

| Package | Description |
|---------|-------------|
| @boatacademy/shared | Types TS, schemas Zod, constantes |
| @boatacademy/api-client | Facade vers Edge Functions |
| @boatacademy/config | Configs ESLint, TypeScript, Prettier |

## Principes d'architecture

### 1. Domain API via Edge Functions

Toutes les actions metier critiques passent par les Edge Functions :
- Checkout Stripe
- Inscription sessions
- Validation documents
- Envoi messages

Le frontend ne contient PAS de logique metier sensible.

### 2. RLS (Row Level Security)

Chaque table a des policies RLS pour :
- Isolation multi-tenant (par site)
- Controle d'acces par role
- Protection des donnees sensibles

### 3. Migration-ready (Option B)

Grace a `@boatacademy/api-client`, on peut migrer vers une API dediee (NestJS/Django) sans casser les apps frontend.

```typescript
// Aujourd'hui (Option A)
const client = createApiClient(supabase);
await client.checkout.createSession(productId);

// Demain (Option B) - meme interface
const client = createApiClient({ baseUrl: 'https://api.boatacademy.com' });
await client.checkout.createSession(productId);
```

## Roles et permissions

| Role | Scope | Actions |
|------|-------|---------|
| admin | Global | Tout |
| manager | Site(s) | Gestion stagiaires, sessions, docs |
| instructor | Site(s) | Lecture planning, infos stagiaires |
| student | Son compte | Upload docs, inscription sessions, messages |

## Multi-tenant

Chaque entite est rattachee a un `site_id` :
- Stagiaires
- Sessions
- Documents
- Messages
- Produits

Les policies RLS filtrent automatiquement par site selon le role de l'utilisateur.
