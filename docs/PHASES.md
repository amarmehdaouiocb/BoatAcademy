# Boat Academy MVP - Suivi des Phases

> Ce document trace l'avancement de toutes les phases d'implementation du MVP.

## Vue d'ensemble

| Phase | Nom | Status | Derniere MAJ |
|-------|-----|--------|--------------|
| 1 | Setup Monorepo | :white_check_mark: Termine | 2025-01-08 |
| 2 | DB Schema + RLS | :white_check_mark: Termine | 2025-01-08 |
| 3 | Edge Functions | :white_check_mark: Termine | 2025-01-08 |
| 4 | admin-web | :hourglass: Planifie | - |
| 5 | student-mobile | :hourglass: Planifie | - |
| 6 | Paiements Stripe | :hourglass: Planifie | - |
| 7 | Push notifications | :hourglass: Planifie | - |
| 8 | Hardening | :hourglass: Planifie | - |

---

## Phase 1 : Setup Monorepo

**Status**: :white_check_mark: Termine

### Taches

- [x] Creer branche `feature/setup-monorepo`
- [x] Structure racine (package.json, pnpm-workspace, turbo.json, tsconfig.base)
- [x] Documentation `/docs`
- [x] Package `@boatacademy/shared`
- [x] Package `@boatacademy/api-client`
- [x] Package `@boatacademy/config`
- [x] App `admin-web` (Next.js 15)
- [x] App `student-mobile` (Expo SDK 52)
- [x] Init Supabase local
- [x] Validation build complet

### Fichiers crees

```
boat-academy/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── .env.example
├── .prettierrc
├── .prettierignore
├── docs/
│   ├── PHASES.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── API.md
├── packages/
│   ├── shared/           # Types, Zod schemas, constantes
│   ├── api-client/       # Facade API (Edge Functions)
│   └── config/           # ESLint, TypeScript configs
├── apps/
│   ├── admin-web/        # Next.js 15 back-office
│   └── student-mobile/   # Expo SDK 52 app stagiaire
└── supabase/
    ├── config.toml
    ├── seed.sql
    ├── migrations/
    └── functions/_shared/
```

---

## Phase 2 : DB Schema + RLS

**Status**: :white_check_mark: Termine

### Taches

- [x] Enums : user_role, document_status, product_type, order_status, session_type, enrollment_status, penalty_type, notification_type
- [x] Tables principales (22 tables)
- [x] Fonctions helpers (current_user_id, current_role, has_site_access)
- [x] Triggers (handle_updated_at, handle_new_user)
- [x] RLS policies (50+ policies)
- [x] Seed data (document_types, demo site, products, exam_centers)

### Migrations creees

```
supabase/migrations/
├── 20250108000001_initial_schema.sql   # Schema complet
└── 20250108000002_rls_policies.sql     # Toutes les RLS policies
```

### Tables creees

| Table | Description |
|-------|-------------|
| sites | Sites multi-tenant |
| profiles | Profils utilisateurs |
| profile_sites | Association profil/site |
| students | Stagiaires |
| document_types | Types de documents requis |
| site_required_documents | Documents requis par site |
| student_documents | Documents uploades |
| products | Produits (permis, reactivation) |
| orders | Commandes |
| entitlements | Droits d'acces |
| sessions | Sessions de formation |
| enrollments | Inscriptions aux sessions |
| penalties | Penalites |
| exam_centers | Centres d'examen |
| external_learning_links | Liens apprentissage externe |
| conversations | Conversations messagerie |
| messages | Messages |
| notifications | Notifications in-app |
| device_tokens | Tokens push |
| audit_log | Journal d'audit |

---

## Phase 3 : Edge Functions

**Status**: :white_check_mark: Termine

### Taches

- [x] `checkout-create-session` : Creation session Stripe Checkout
- [x] `stripe-webhook` : Traitement paiements + creation entitlements
- [x] `sessions-assign-student` : Inscription sessions (etudiant/manager)
- [x] `documents-validate` : Validation/rejet documents (admin/manager)
- [x] `messages-send` : Envoi messages + notifications in-app
- [x] `push-register-token` : Enregistrement token push Expo
- [x] `push-send` : Envoi notifications push via Expo API

### Edge Functions creees

```
supabase/functions/
├── _shared/
│   ├── auth.ts              # getAuthedUser helper
│   ├── cors.ts              # CORS + JSON response helpers
│   └── supabaseAdmin.ts     # Admin client (service role)
├── checkout-create-session/
│   └── index.ts             # Stripe Checkout session creation
├── stripe-webhook/
│   └── index.ts             # Webhook handler (checkout.session.completed, expired)
├── sessions-assign-student/
│   └── index.ts             # Enrollment management
├── documents-validate/
│   └── index.ts             # Document approval/rejection + status update
├── messages-send/
│   └── index.ts             # Messaging + notifications
├── push-register-token/
│   └── index.ts             # Device token registration
└── push-send/
    └── index.ts             # Expo Push API integration
```

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Cle secrete Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `SUPABASE_URL` | URL Supabase (auto) |
| `SUPABASE_ANON_KEY` | Cle anon Supabase (auto) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service role (auto) |

---

## Phase 4 : admin-web

**Status**: :hourglass: Planifie

### Objectifs

- Auth (email/password)
- Dashboard avec stats
- CRUD Sites
- CRUD Etudiants
- CRUD Sessions
- Validation documents
- Messagerie
- Vue planning moniteur

---

## Phase 5 : student-mobile

**Status**: :hourglass: Planifie

### Objectifs

- Auth (email/password)
- Onboarding
- Upload documents
- Consultation sessions
- Inscription sessions
- Messagerie
- Profil + OEDIPP
- Push notifications

---

## Phase 6 : Paiements Stripe

**Status**: :hourglass: Planifie

### Objectifs

- Integration Stripe Checkout
- Webhook handler
- Entitlements (duree acces)
- Historique paiements

---

## Phase 7 : Push notifications

**Status**: :hourglass: Planifie

### Objectifs

- Expo Push Notifications
- APNs (iOS) + FCM (Android)
- Edge Function envoi push
- Notifications in-app

---

## Phase 8 : Hardening

**Status**: :hourglass: Planifie

### Objectifs

- Pagination partout
- Etats UI (loading, error, empty)
- Sentry integration
- Review RLS policies
- Tests E2E critiques
