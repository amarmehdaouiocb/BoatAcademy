# Boat Academy

Application SaaS pour auto-ecole nautique (permis bateau).

## Stack

- **admin-web**: Next.js 15 + Tailwind CSS
- **student-mobile**: Expo SDK 52 + NativeWind
- **Backend**: Supabase (Postgres + RLS + Edge Functions)
- **Paiements**: Stripe Checkout

## Structure

```
boat-academy/
├── apps/
│   ├── admin-web/        # Back-office admin/manager
│   └── student-mobile/   # App stagiaire iOS/Android
├── packages/
│   ├── shared/           # Types, Zod schemas, constantes
│   ├── api-client/       # Facade API
│   └── config/           # ESLint, TS configs
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── config.toml
└── docs/
    ├── PHASES.md         # Suivi des phases
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    └── API.md
```

## Demarrage rapide

### Prerequis

- Node.js >= 20
- pnpm >= 9
- Docker (pour Supabase local)
- Supabase CLI

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd boat-academy

# Installer les dependances
pnpm install

# Demarrer Supabase local
pnpm db:start

# Lancer le back-office
pnpm dev:web

# Lancer l'app mobile (dans un autre terminal)
pnpm dev:mobile
```

### Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir les valeurs:

```bash
cp .env.example .env.local
```

Les credentials Supabase locaux sont affiches lors de `pnpm db:start`.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Lance toutes les apps en mode dev |
| `pnpm dev:web` | Lance admin-web uniquement |
| `pnpm dev:mobile` | Lance student-mobile uniquement |
| `pnpm build` | Build de production |
| `pnpm lint` | Lint tous les packages |
| `pnpm typecheck` | Verification TypeScript |
| `pnpm db:start` | Demarre Supabase local |
| `pnpm db:stop` | Arrete Supabase local |
| `pnpm db:reset` | Reset la DB + seed |
| `pnpm db:types` | Genere les types TypeScript |

## Documentation

- [PHASES.md](./docs/PHASES.md) - Suivi de l'avancement
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Vue d'ensemble
- [DATABASE.md](./docs/DATABASE.md) - Schema de base de donnees
- [API.md](./docs/API.md) - Reference API

## Licence

Proprietaire - Boat Academy
