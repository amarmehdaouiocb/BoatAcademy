# Boat Academy MVP - Suivi des Phases

> Ce document trace l'avancement de toutes les phases d'implementation du MVP.

## Vue d'ensemble

| Phase | Nom | Status | Derniere MAJ |
|-------|-----|--------|--------------|
| 1 | Setup Monorepo | :white_check_mark: Termine | 2025-01-08 |
| 2 | DB Schema + RLS | :hourglass: Planifie | - |
| 3 | Edge Functions | :hourglass: Planifie | - |
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

**Status**: :hourglass: Planifie

### Objectifs

- Tables : sites, profiles, students, documents, products, orders, sessions, etc.
- Indexes optimises
- RLS policies pour isolation multi-tenant
- Fonctions helpers (current_user_id, current_role, has_site_access)

---

## Phase 3 : Edge Functions

**Status**: :hourglass: Planifie

### Objectifs

- `checkout-create-session` : Creation session Stripe
- `stripe-webhook` : Traitement paiements
- `sessions-assign-student` : Inscription sessions
- `documents-validate` : Validation documents
- `messages-send` : Envoi messages + notifications
- `push-register-token` / `push-send` : Push notifications

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
