# Boat Academy — MVP Option A (Supabase-first) — Plan d’implémentation “Claude Code” (V3 FULL / monorepo)

> **Objectif** : implémenter le **MVP Boat Academy** en **Option A (Supabase-first)** avec une architecture propre (sécurité, RLS, audit, maintenabilité) + une **UI mobile premium** (performances/animations) + **push notifications natives**, tout en gardant une **migration facile vers Option B** (API dédiée NestJS/Django) plus tard.
>
> **IMPORTANT (Front)** : utiliser le plugin / subagent **`frontend-design`** pour **toutes** les parties UI/UX (mobile + web) : design system, composants, layout, états, accessibilité, micro-interactions.
>
> **IMPORTANT (Architecture)** : toutes les actions métier critiques passent par la **Domain API** (Edge Functions) via `packages/api-client`. Le front ne contient pas de logique métier sensible.

---

## 0) Hypothèses MVP (défauts, ajustables)

On implémente avec ces valeurs par défaut :

1) **Périmètre** : `admin-web` (BO admin/manager) + `student-mobile` (app stagiaire)
2) **Auth** : email+password + email verification
3) **Paiement** : Stripe Checkout, devise EUR
4) **Durée d’accès** : 12 mois par défaut (configurable via produits)
5) **Pénalités** : on enregistre (no-show / annulation < 24h), pas de blocage auto MVP
6) **Centres d’examen** : CRUD manuel dans BO
7) **Messagerie** : stagiaire ↔ gestionnaires (instructeurs plus tard)
8) **Docs** : max 10MB, PDF/JPG/PNG
9) **RGPD** : consentement marketing + suppression/export sur demande (workflow simple)

---

## 1) Arborescence recommandée (monorepo GitHub unique)

```
boat-academy/
├─ apps/
│  ├─ admin-web/                 # Next.js (Back-office admin/gestionnaires)
│  │  ├─ app/
│  │  ├─ src/
│  │  │  ├─ components/          # UI components (frontend-design)
│  │  │  ├─ features/            # domain modules (students, sessions, docs, products...)
│  │  │  ├─ lib/                 # supabase, api-client wiring, utils
│  │  │  ├─ styles/
│  │  │  └─ types/
│  │  ├─ public/
│  │  ├─ next.config.js
│  │  └─ package.json
│  │
│  ├─ student-mobile/            # Expo RN (App stagiaire)
│  │  ├─ app/                    # Expo Router routes
│  │  ├─ src/
│  │  │  ├─ components/          # UI components (frontend-design)
│  │  │  ├─ features/            # docs, sessions, messages, access, profile...
│  │  │  ├─ lib/                 # supabase, api-client wiring, push, utils
│  │  │  ├─ hooks/               # TanStack Query hooks
│  │  │  └─ theme/               # tokens (colors/spacing/typography)
│  │  ├─ assets/
│  │  ├─ app.json
│  │  └─ package.json
│  │
│  ├─ admin-mobile/              # (Optionnel + tard) Expo RN (UX admin)
│  └─ student-web/               # (Optionnel) Next.js portail stagiaire web
│
├─ packages/
│  ├─ api-client/                # Abstraction Domain API (Edge today, API server later)
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  └─ transport/
│  │  │     ├─ edgeTransport.ts
│  │  │     └─ httpTransport.ts  # futur Option B
│  │  └─ package.json
│  │
│  ├─ shared/                    # Types, Zod schemas, constants
│  ├─ ui/                        # (Optionnel) design system partagé
│  └─ config/                    # (Optionnel) eslint/tsconfig/prettier partagés
│
├─ supabase/
│  ├─ migrations/
│  ├─ functions/
│  │  ├─ _shared/
│  │  ├─ checkout-create-session/
│  │  ├─ stripe-webhook/
│  │  ├─ sessions-assign-student/
│  │  ├─ documents-validate/
│  │  ├─ messages-send/
│  │  ├─ push-register-token/
│  │  └─ push-send/
│  └─ config.toml
│
├─ tooling/
│  ├─ scripts/
│  └─ seed/
│
├─ .github/workflows/
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
└─ README.md
```

**Bundle IDs suggérés**
- `student-mobile` → `com.boatacademy.student`
- `admin-mobile` → `com.boatacademy.admin`

---

## 2) Différences Option A vs Option B (rappel)

- **Option A (ce doc)** : Supabase DB + RLS + Storage + Edge Functions comme Domain API
- **Option B (plus tard)** : API dédiée (Nest/Django/FastAPI) remplace Edge Functions, sans casser les apps grâce à `packages/api-client`

---

## 3) Stack technologique (résumé)

### Web (admin-web)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form + Zod
- UI via `frontend-design`

### Mobile (student-mobile)
- Expo React Native + TypeScript + Expo Router
- TanStack Query
- RHF + Zod
- UI premium :
  - react-native-reanimated
  - react-native-gesture-handler
  - @shopify/flash-list
  - expo-haptics
  - (optionnel) expo-image

### Backend (Option A)
- Supabase Postgres + RLS
- Supabase Storage (private bucket)
- Supabase Edge Functions (Deno TS) = Domain API
- Stripe Checkout + Webhooks
- Push natives via Expo → APNs/FCM

Observabilité :
- Sentry (web + mobile + edge functions)

---

## 4) Setup monorepo (commandes)

### 4.1 Init
```bash
mkdir boat-academy && cd boat-academy
pnpm init
pnpm add -D turbo typescript eslint prettier
```

### 4.2 Créer les apps
```bash
# Admin web
pnpm dlx create-next-app@latest apps/admin-web --ts --tailwind --eslint --app

# Stagiaire mobile
pnpm dlx create-expo-app apps/student-mobile -t expo-template-blank-typescript
```

### 4.3 Packages
```bash
mkdir -p packages/shared packages/api-client packages/ui packages/config
```

### 4.4 Supabase
```bash
supabase init
supabase login
supabase link --project-ref <PROJECT_REF>
```

---

## 5) Environnements

Créer `.env.example` à la racine :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Public URLs
PUBLIC_APP_URL=
```

---

## 6) Base de données (Postgres) — schéma MVP (tables + indexes)

> Créer via migrations `supabase/migrations/*`.

### 6.1 Tenancy & Users

```sql
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  region text,
  timezone text not null default 'Europe/Paris',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.sites (is_active);

create type public.user_role as enum ('admin','manager','instructor','student');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text,
  phone text,
  primary_site_id uuid references public.sites(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_sites (
  user_id uuid references public.profiles(user_id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  primary key (user_id, site_id)
);
create index on public.profile_sites (site_id);
```

### 6.2 Students + OEDIPP + consent

```sql
create table public.students (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  site_id uuid not null references public.sites(id),
  oedipp_number text,
  oedipp_set_at timestamptz,
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.students (site_id);
create unique index students_site_oedipp_unique
on public.students(site_id, oedipp_number)
where oedipp_number is not null;
```

### 6.3 Documents (requirements + uploads + validation)

```sql
create type public.document_status as enum ('missing','pending','approved','rejected');

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.site_required_documents (
  site_id uuid references public.sites(id) on delete cascade,
  document_type_id uuid references public.document_types(id) on delete cascade,
  is_required boolean not null default true,
  primary key (site_id, document_type_id)
);

create table public.student_documents (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  student_user_id uuid not null references public.students(user_id) on delete cascade,
  document_type_id uuid not null references public.document_types(id),
  storage_path text not null,
  status public.document_status not null default 'pending',
  rejected_reason text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(user_id),
  unique (student_user_id, document_type_id)
);
create index on public.student_documents(site_id, status);
```

### 6.4 Produits, commandes, entitlements

```sql
create type public.product_type as enum ('permit','reactivation','post_permit');
create type public.order_status as enum ('pending','paid','failed','refunded');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  type public.product_type not null,
  name text not null,
  description text,
  price_cents int not null,
  currency text not null default 'EUR',
  access_duration_days int,
  stripe_price_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.products(site_id, is_active);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  user_id uuid not null references public.profiles(user_id),
  product_id uuid not null references public.products(id),
  status public.order_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents int not null,
  currency text not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on public.orders(user_id, status);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  user_id uuid not null references public.profiles(user_id),
  product_id uuid references public.products(id),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.entitlements(user_id, expires_at);
```

### 6.5 Sessions, enrollments, penalties

```sql
create type public.session_type as enum ('theory','practice');
create type public.enrollment_status as enum ('assigned','cancelled','noshow','completed');
create type public.penalty_type as enum ('noshow','late_cancel');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  type public.session_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 1,
  location text,
  instructor_user_id uuid references public.profiles(user_id),
  notes text,
  created_at timestamptz not null default now()
);
create index on public.sessions(site_id, starts_at);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_user_id uuid not null references public.students(user_id) on delete cascade,
  status public.enrollment_status not null default 'assigned',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(user_id),
  unique (session_id, student_user_id)
);
create index on public.enrollments(site_id, session_id);

create table public.penalties (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  student_user_id uuid not null references public.students(user_id),
  session_id uuid references public.sessions(id),
  type public.penalty_type not null,
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(user_id)
);
create index on public.penalties(student_user_id, occurred_at);
```

### 6.6 Centres d’examen

```sql
create table public.exam_centers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id),
  name text not null,
  address text,
  city text,
  postal_code text,
  phone text,
  website text,
  notes text,
  created_at timestamptz not null default now()
);
create index on public.exam_centers (city, postal_code);
```

### 6.7 Lien externe cours (par stagiaire)

```sql
create table public.external_learning_links (
  student_user_id uuid primary key references public.students(user_id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.8 Messagerie + notifications in-app

```sql
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  student_user_id uuid not null references public.students(user_id),
  created_at timestamptz not null default now(),
  unique(site_id, student_user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(user_id),
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.messages(conversation_id, created_at);

create type public.notification_type as enum ('message','system');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  site_id uuid references public.sites(id),
  type public.notification_type not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, read_at);
```

### 6.9 Audit log

```sql
create table public.audit_log (
  id bigserial primary key,
  site_id uuid,
  actor_user_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_log(site_id, created_at);
create index on public.audit_log(actor_user_id, created_at);
```

---

## 7) RLS — helpers + policies (MVP)

### 7.1 Fonctions helpers

```sql
create or replace function public.current_user_id()
returns uuid language sql stable as $$ select auth.uid() $$;

create or replace function public.current_role()
returns public.user_role language sql stable as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.has_site_access(_site_id uuid)
returns boolean language sql stable as $$
  select case
    when (select public.current_role()) = 'admin' then true
    when (select public.current_role()) in ('manager','instructor') then exists (
      select 1 from public.profile_sites ps
      where ps.user_id = auth.uid() and ps.site_id = _site_id
    )
    when (select public.current_role()) = 'student' then exists (
      select 1 from public.students s
      where s.user_id = auth.uid() and s.site_id = _site_id
    )
    else false
  end
$$;
```

### 7.2 Policies principales (exemples)

**sites**
```sql
alter table public.sites enable row level security;

create policy "sites_read_active"
on public.sites for select
using (is_active = true);

create policy "sites_admin_manage"
on public.sites for all
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');
```

**profiles**
```sql
alter table public.profiles enable row level security;

create policy "profiles_read_self_or_admin"
on public.profiles for select
using (user_id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_self"
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

**students**
```sql
alter table public.students enable row level security;

create policy "students_read"
on public.students for select
using (
  user_id = auth.uid()
  or (public.current_role() in ('admin','manager','instructor') and public.has_site_access(site_id))
);

create policy "students_manager_update"
on public.students for update
using (public.current_role() in ('admin','manager') and public.has_site_access(site_id))
with check (public.current_role() in ('admin','manager') and public.has_site_access(site_id));
```

**student_documents**
```sql
alter table public.student_documents enable row level security;

create policy "student_documents_read"
on public.student_documents for select
using (
  student_user_id = auth.uid()
  or (public.current_role() in ('admin','manager') and public.has_site_access(site_id))
);

create policy "student_documents_insert_student"
on public.student_documents for insert
with check (student_user_id = auth.uid());

create policy "student_documents_update_manager"
on public.student_documents for update
using (public.current_role() in ('admin','manager') and public.has_site_access(site_id))
with check (public.current_role() in ('admin','manager') and public.has_site_access(site_id));
```

**sessions/enrollments**
```sql
alter table public.sessions enable row level security;
alter table public.enrollments enable row level security;

create policy "sessions_read_site"
on public.sessions for select
using (public.has_site_access(site_id));

create policy "sessions_manage_admin_manager"
on public.sessions for all
using (public.current_role() in ('admin','manager') and public.has_site_access(site_id))
with check (public.current_role() in ('admin','manager') and public.has_site_access(site_id));

create policy "enrollments_read"
on public.enrollments for select
using (public.has_site_access(site_id));

create policy "enrollments_manage_admin_manager"
on public.enrollments for all
using (public.current_role() in ('admin','manager') and public.has_site_access(site_id))
with check (public.current_role() in ('admin','manager') and public.has_site_access(site_id));
```

**messaging**
```sql
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_read"
on public.conversations for select
using (
  student_user_id = auth.uid()
  or (public.current_role() in ('admin','manager') and public.has_site_access(site_id))
);

create policy "messages_read"
on public.messages for select
using (
  exists(select 1 from public.conversations c
    where c.id = conversation_id
      and (
        c.student_user_id = auth.uid()
        or (public.current_role() in ('admin','manager') and public.has_site_access(c.site_id))
      )
  )
);

create policy "messages_insert_sender_in_conversation"
on public.messages for insert
with check (
  sender_user_id = auth.uid()
  and exists(select 1 from public.conversations c
    where c.id = conversation_id
      and (
        c.student_user_id = auth.uid()
        or (public.current_role() in ('admin','manager') and public.has_site_access(c.site_id))
      )
  )
);
```

---

## 8) Edge Functions (Domain API) — code (Deno TS)

### 8.1 Shared helpers

`supabase/functions/_shared/supabaseAdmin.ts`
```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
```

`supabase/functions/_shared/auth.ts`
```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthedUser(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } }
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return { supabase, user: data.user };
}
```

### 8.2 checkout-create-session
`supabase/functions/checkout-create-session/index.ts`
```ts
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { getAuthedUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  try {
    const { user } = await getAuthedUser(req);
    const { product_id } = await req.json();
    const sb = supabaseAdmin();

    const { data: product, error: pErr } = await sb
      .from("products").select("*").eq("id", product_id).single();
    if (pErr || !product) throw new Error("PRODUCT_NOT_FOUND");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: product.currency.toLowerCase(),
          product_data: { name: product.name, description: product.description ?? undefined },
          unit_amount: product.price_cents,
        },
        quantity: 1,
      }],
      success_url: `${Deno.env.get("PUBLIC_APP_URL")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("PUBLIC_APP_URL")}/payment/cancel`,
      metadata: { user_id: user.id, product_id: product.id, site_id: product.site_id },
    });

    const { error: oErr } = await sb.from("orders").insert({
      site_id: product.site_id,
      user_id: user.id,
      product_id: product.id,
      status: "pending",
      stripe_checkout_session_id: session.id,
      amount_cents: product.price_cents,
      currency: product.currency,
    });
    if (oErr) throw oErr;

    return Response.json({ url: session.url });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

### 8.3 stripe-webhook
`supabase/functions/stripe-webhook/index.ts`
```ts
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (_err) {
    return new Response("Invalid signature", { status: 400 });
  }

  const sb = supabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const user_id = session.metadata?.user_id!;
    const product_id = session.metadata?.product_id!;
    const site_id = session.metadata?.site_id!;

    const { data: product } = await sb.from("products").select("*").eq("id", product_id).single();

    await sb.from("orders").update({
      status: "paid",
      stripe_payment_intent_id: String(session.payment_intent ?? ""),
      paid_at: new Date().toISOString(),
    }).eq("stripe_checkout_session_id", session.id);

    const now = new Date();
    const durationDays = product?.access_duration_days ?? 365;
    const expires = new Date(now.getTime() + durationDays * 86400000);

    await sb.from("entitlements").insert({
      site_id,
      user_id,
      product_id,
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });

    await sb.from("audit_log").insert({
      site_id,
      actor_user_id: user_id,
      action: "payment_completed",
      entity_type: "orders",
      metadata: { stripe_session_id: session.id, product_id, durationDays },
    });
  }

  return new Response("ok");
});
```

### 8.4 sessions-assign-student
`supabase/functions/sessions-assign-student/index.ts`
```ts
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { getAuthedUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  try {
    const { user } = await getAuthedUser(req);
    const { session_id, student_user_id } = await req.json();
    const sb = supabaseAdmin();

    const { data: actor } = await sb.from("profiles").select("role").eq("user_id", user.id).single();
    if (!actor || !["admin","manager"].includes(actor.role)) throw new Error("FORBIDDEN");

    const { data: session } = await sb.from("sessions").select("*").eq("id", session_id).single();
    if (!session) throw new Error("SESSION_NOT_FOUND");

    if (actor.role !== "admin") {
      const { data: ps } = await sb.from("profile_sites")
        .select("site_id").eq("user_id", user.id).eq("site_id", session.site_id).maybeSingle();
      if (!ps) throw new Error("FORBIDDEN_SITE");
    }

    if (session.type === "practice") {
      const { data: st } = await sb.from("students").select("oedipp_number").eq("user_id", student_user_id).single();
      if (!st?.oedipp_number) throw new Error("OEDIPP_REQUIRED");
    }

    const { count } = await sb.from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session_id)
      .eq("status", "assigned");
    if ((count ?? 0) >= session.capacity) throw new Error("SESSION_FULL");

    const { error } = await sb.from("enrollments").insert({
      site_id: session.site_id,
      session_id,
      student_user_id,
      status: "assigned",
    });
    if (error) throw error;

    await sb.from("audit_log").insert({
      site_id: session.site_id,
      actor_user_id: user.id,
      action: "enrollment_assigned",
      entity_type: "sessions",
      entity_id: session_id,
      metadata: { student_user_id },
    });

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

### 8.5 documents-validate
`supabase/functions/documents-validate/index.ts`
```ts
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { getAuthedUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  try {
    const { user } = await getAuthedUser(req);
    const { student_document_id, status, rejected_reason } = await req.json();
    const sb = supabaseAdmin();

    const { data: actor } = await sb.from("profiles").select("*").eq("user_id", user.id).single();
    if (!actor || !["admin","manager"].includes(actor.role)) throw new Error("FORBIDDEN");

    const { data: doc } = await sb.from("student_documents").select("*").eq("id", student_document_id).single();
    if (!doc) throw new Error("DOC_NOT_FOUND");

    if (actor.role !== "admin") {
      const { data: ps } = await sb.from("profile_sites")
        .select("*").eq("user_id", user.id).eq("site_id", doc.site_id).maybeSingle();
      if (!ps) throw new Error("FORBIDDEN_SITE");
    }

    await sb.from("student_documents").update({
      status,
      rejected_reason: status === "rejected" ? (rejected_reason ?? "Document refusé") : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq("id", student_document_id);

    await sb.from("audit_log").insert({
      site_id: doc.site_id,
      actor_user_id: user.id,
      action: `document_${status}`,
      entity_type: "student_documents",
      entity_id: doc.id,
      metadata: { student_user_id: doc.student_user_id, document_type_id: doc.document_type_id },
    });

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

### 8.6 messages-send
`supabase/functions/messages-send/index.ts`
```ts
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { getAuthedUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  try {
    const { user } = await getAuthedUser(req);
    const { conversation_id, body } = await req.json();
    const sb = supabaseAdmin();

    const { data: convo } = await sb.from("conversations").select("*").eq("id", conversation_id).single();
    if (!convo) throw new Error("CONVO_NOT_FOUND");

    const { data: senderProfile } = await sb.from("profiles").select("role").eq("user_id", user.id).single();
    if (!senderProfile) throw new Error("SENDER_PROFILE_MISSING");

    const { data: msg, error: mErr } = await sb.from("messages").insert({
      site_id: convo.site_id,
      conversation_id,
      sender_user_id: user.id,
      body,
    }).select("id, created_at").single();
    if (mErr) throw mErr;

    // In-app notifications (MVP)
    if (senderProfile.role === "student") {
      const { data: managers } = await sb.from("profiles").select("user_id, role").in("role", ["manager","admin"]);
      const rows = (managers ?? []).map(m => ({
        user_id: m.user_id,
        site_id: convo.site_id,
        type: "message",
        title: "Nouveau message stagiaire",
        body: "Un stagiaire a envoyé un message.",
      }));
      if (rows.length) await sb.from("notifications").insert(rows);
    } else {
      await sb.from("notifications").insert({
        user_id: convo.student_user_id,
        site_id: convo.site_id,
        type: "message",
        title: "Nouveau message",
        body: "Vous avez reçu un message de l'école.",
      });
    }

    return Response.json({ ok: true, message: msg });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

---

## 9) `packages/api-client` — façade stable

`packages/api-client/src/index.ts`
```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export function createApiClient(supabase: SupabaseClient) {
  return {
    checkout: {
      async createSession(product_id: string) {
        const { data, error } = await supabase.functions.invoke("checkout-create-session", { body: { product_id } });
        if (error) throw error;
        return data as { url: string };
      },
    },
    sessions: {
      async assignStudent(session_id: string, student_user_id: string) {
        const { data, error } = await supabase.functions.invoke("sessions-assign-student", {
          body: { session_id, student_user_id }
        });
        if (error) throw error;
        return data as { ok: true };
      },
    },
    documents: {
      async validate(student_document_id: string, status: "approved"|"rejected", rejected_reason?: string) {
        const { data, error } = await supabase.functions.invoke("documents-validate", {
          body: { student_document_id, status, rejected_reason }
        });
        if (error) throw error;
        return data as { ok: true };
      },
    },
    messages: {
      async send(conversation_id: string, body: string) {
        const { data, error } = await supabase.functions.invoke("messages-send", { body: { conversation_id, body } });
        if (error) throw error;
        return data as { ok: true };
      },
    },
  };
}
```

---

## 10) Appendix — UI mobile premium (perfs/animations)

### 10.1 Dependencies (student-mobile)
```bash
cd apps/student-mobile
pnpm add react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context @shopify/flash-list expo-haptics
pnpm add expo-image
```

### 10.2 Reanimated config
`apps/student-mobile/babel.config.js`
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

### 10.3 FlashList
```tsx
import { FlashList } from "@shopify/flash-list";
<FlashList data={items} renderItem={({ item }) => <Row item={item} />} estimatedItemSize={72} />
```

---

## 11) Appendix — Push natives (Expo → APNs/FCM)

### 11.1 Table device tokens
```sql
create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  platform text not null check (platform in ('ios','android')),
  expo_push_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);
```

### 11.2 Edge: register token
`supabase/functions/push-register-token/index.ts`
```ts
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { getAuthedUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  try {
    const { user } = await getAuthedUser(req);
    const { platform, expo_push_token } = await req.json();

    const sb = supabaseAdmin();
    await sb.from("device_tokens").upsert({
      user_id: user.id,
      platform,
      expo_push_token,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,expo_push_token" });

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

### 11.3 Edge: send push
`supabase/functions/push-send/index.ts`
```ts
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  try {
    const { user_id, title, body, data } = await req.json();
    const sb = supabaseAdmin();

    const { data: tokens } = await sb
      .from("device_tokens")
      .select("expo_push_token")
      .eq("user_id", user_id);

    const messages = (tokens ?? []).map(t => ({
      to: t.expo_push_token,
      sound: "default",
      title,
      body,
      data: data ?? {},
    }));

    if (!messages.length) return Response.json({ ok: true, sent: 0 });

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const json = await res.json();
    return Response.json({ ok: true, result: json });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

---

## 12) Plan d’implémentation & DoD

### Phases
1) Monorepo + apps + packages + envs
2) DB + RLS + Storage
3) Edge Functions Domain API + Stripe
4) admin-web (frontend-design)
5) student-mobile (frontend-design + premium UI + push)
6) hardening (pagination, states, Sentry, review RLS)

### DoD MVP
- BO web ok
- App stagiaire ok
- Stripe + entitlements
- Docs + validation
- Sessions + assign + capacity + OEDIPP gate
- Messaging + notifs + push natives
- Audit log actions clés
- Option B-ready via `api-client`
