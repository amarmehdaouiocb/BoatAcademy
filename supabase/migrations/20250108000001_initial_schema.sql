-- =====================================================
-- Boat Academy - Initial Schema Migration
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'instructor', 'student');
CREATE TYPE public.document_status AS ENUM ('missing', 'pending', 'approved', 'rejected');
CREATE TYPE public.product_type AS ENUM ('permit', 'reactivation', 'post_permit');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.session_type AS ENUM ('theory', 'practice');
CREATE TYPE public.enrollment_status AS ENUM ('assigned', 'cancelled', 'noshow', 'completed');
CREATE TYPE public.penalty_type AS ENUM ('noshow', 'late_cancel');
CREATE TYPE public.notification_type AS ENUM ('message', 'system');

-- =====================================================
-- 2. TENANCY & USERS
-- =====================================================

-- Sites (multi-tenant)
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  region TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sites_is_active ON public.sites (is_active);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  phone TEXT,
  primary_site_id UUID REFERENCES public.sites(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profile-Sites junction (N:N for staff)
CREATE TABLE public.profile_sites (
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, site_id)
);
CREATE INDEX idx_profile_sites_site ON public.profile_sites (site_id);

-- =====================================================
-- 3. STUDENTS
-- =====================================================

CREATE TABLE public.students (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id),
  oedipp_number TEXT,
  oedipp_set_at TIMESTAMPTZ,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_site ON public.students (site_id);
CREATE UNIQUE INDEX idx_students_site_oedipp_unique
  ON public.students(site_id, oedipp_number)
  WHERE oedipp_number IS NOT NULL;

-- =====================================================
-- 4. DOCUMENTS
-- =====================================================

-- Document types
CREATE TABLE public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site required documents
CREATE TABLE public.site_required_documents (
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (site_id, document_type_id)
);

-- Student documents
CREATE TABLE public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  student_user_id UUID NOT NULL REFERENCES public.students(user_id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id),
  storage_path TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  rejected_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(user_id),
  UNIQUE (student_user_id, document_type_id)
);
CREATE INDEX idx_student_documents_site_status ON public.student_documents(site_id, status);

-- =====================================================
-- 5. PRODUCTS & ORDERS
-- =====================================================

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  type public.product_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  access_duration_days INTEGER,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_site_active ON public.products(site_id, is_active);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  status public.order_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX idx_orders_user_status ON public.orders(user_id, status);

-- Entitlements
CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  product_id UUID REFERENCES public.products(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_entitlements_user_expires ON public.entitlements(user_id, expires_at);

-- =====================================================
-- 6. SESSIONS & ENROLLMENTS
-- =====================================================

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  type public.session_type NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  instructor_user_id UUID REFERENCES public.profiles(user_id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_site_starts ON public.sessions(site_id, starts_at);

-- Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES public.students(user_id) ON DELETE CASCADE,
  status public.enrollment_status NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(user_id),
  UNIQUE (session_id, student_user_id)
);
CREATE INDEX idx_enrollments_site_session ON public.enrollments(site_id, session_id);

-- Penalties
CREATE TABLE public.penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  student_user_id UUID NOT NULL REFERENCES public.students(user_id),
  session_id UUID REFERENCES public.sessions(id),
  type public.penalty_type NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(user_id)
);
CREATE INDEX idx_penalties_student_occurred ON public.penalties(student_user_id, occurred_at);

-- =====================================================
-- 7. EXAM CENTERS
-- =====================================================

CREATE TABLE public.exam_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exam_centers_city ON public.exam_centers (city, postal_code);

-- =====================================================
-- 8. EXTERNAL LEARNING LINKS
-- =====================================================

CREATE TABLE public.external_learning_links (
  student_user_id UUID PRIMARY KEY REFERENCES public.students(user_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 9. MESSAGING
-- =====================================================

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  student_user_id UUID NOT NULL REFERENCES public.students(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, student_user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id),
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read_at);

-- Device tokens (push notifications)
CREATE TABLE public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  expo_push_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

-- =====================================================
-- 10. AUDIT LOG
-- =====================================================

CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  site_id UUID,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_site_created ON public.audit_log(site_id, created_at);
CREATE INDEX idx_audit_log_actor_created ON public.audit_log(actor_user_id, created_at);

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Get current user ID
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()
$$;

-- Get current user role
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Check if user has access to a site
CREATE OR REPLACE FUNCTION public.has_site_access(_site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN (SELECT public.current_role()) = 'admin' THEN true
    WHEN (SELECT public.current_role()) IN ('manager', 'instructor') THEN EXISTS (
      SELECT 1 FROM public.profile_sites ps
      WHERE ps.user_id = auth.uid() AND ps.site_id = _site_id
    )
    WHEN (SELECT public.current_role()) = 'student' THEN EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid() AND s.site_id = _site_id
    )
    ELSE false
  END
$$;

-- =====================================================
-- 12. TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER external_learning_links_updated_at
  BEFORE UPDATE ON public.external_learning_links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
