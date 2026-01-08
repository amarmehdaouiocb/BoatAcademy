# Boat Academy - Schema Base de Donnees

## Diagramme ER (simplifie)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    sites    │◄────│   profiles  │────►│   students  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  products   │     │   sessions  │     │  documents  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   │
┌─────────────┐     ┌─────────────┐           │
│   orders    │     │ enrollments │           │
└─────────────┘     └─────────────┘           │
       │                   │                   │
       ▼                   ▼                   │
┌─────────────┐     ┌─────────────┐           │
│ entitlements│     │  penalties  │           │
└─────────────┘     └─────────────┘           │
                                              │
┌─────────────┐     ┌─────────────┐           │
│conversations│────►│  messages   │           │
└─────────────┘     └─────────────┘           │
                                              │
┌─────────────┐     ┌─────────────┐           │
│notifications│     │  audit_log  │◄──────────┘
└─────────────┘     └─────────────┘
```

## Tables principales

### Tenancy & Users

| Table | Description |
|-------|-------------|
| `sites` | Centres/villes Boat Academy |
| `profiles` | Profils utilisateurs (role, nom, tel) |
| `profile_sites` | Liaison N:N profils <-> sites |
| `students` | Extension profil pour stagiaires |

### Documents

| Table | Description |
|-------|-------------|
| `document_types` | Types de documents requis |
| `site_required_documents` | Docs requis par site |
| `student_documents` | Documents uploades par stagiaires |

### Commerce

| Table | Description |
|-------|-------------|
| `products` | Produits (permis, reactivation, post-permis) |
| `orders` | Commandes Stripe |
| `entitlements` | Droits d'acces (duree) |

### Formation

| Table | Description |
|-------|-------------|
| `sessions` | Sessions theorie/pratique |
| `enrollments` | Inscriptions stagiaires |
| `penalties` | Penalites (no-show, annulation tardive) |
| `exam_centers` | Centres d'examen |

### Communication

| Table | Description |
|-------|-------------|
| `conversations` | Fils de discussion |
| `messages` | Messages |
| `notifications` | Notifications in-app |
| `device_tokens` | Tokens push (Expo) |

### Audit

| Table | Description |
|-------|-------------|
| `audit_log` | Log des actions importantes |

## Enums

```sql
-- Roles utilisateur
user_role: admin | manager | instructor | student

-- Status documents
document_status: missing | pending | approved | rejected

-- Types de produits
product_type: permit | reactivation | post_permit

-- Status commandes
order_status: pending | paid | failed | refunded

-- Types de sessions
session_type: theory | practice

-- Status inscriptions
enrollment_status: assigned | cancelled | noshow | completed

-- Types de penalites
penalty_type: noshow | late_cancel

-- Types de notifications
notification_type: message | system
```

## Fonctions RLS helpers

```sql
-- Obtenir l'ID de l'utilisateur courant
current_user_id() -> uuid

-- Obtenir le role de l'utilisateur courant
current_role() -> user_role

-- Verifier l'acces a un site
has_site_access(site_id uuid) -> boolean
```

## Indexes importants

Chaque table a des indexes sur :
- `site_id` (filtrage multi-tenant)
- Foreign keys
- Colonnes de recherche frequentes (status, dates)
