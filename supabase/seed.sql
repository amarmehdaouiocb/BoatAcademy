-- Boat Academy Seed Data
-- Run after migrations with: supabase db reset

-- =====================================================
-- Default Document Types
-- =====================================================
INSERT INTO public.document_types (key, label, description) VALUES
  ('identity', 'Piece d''identite', 'Carte d''identite ou passeport en cours de validite'),
  ('photo', 'Photo d''identite', 'Photo d''identite recente (format ANTS)'),
  ('medical', 'Certificat medical', 'Certificat medical de moins de 6 mois'),
  ('residence', 'Justificatif de domicile', 'Facture ou attestation de moins de 3 mois')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Demo Site
-- =====================================================
INSERT INTO public.sites (id, name, city, region, timezone, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Boat Academy Paris', 'Paris', 'Ile-de-France', 'Europe/Paris', true)
ON CONFLICT (id) DO NOTHING;

-- Link document requirements to demo site
INSERT INTO public.site_required_documents (site_id, document_type_id, is_required)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  true
FROM public.document_types
ON CONFLICT (site_id, document_type_id) DO NOTHING;

-- =====================================================
-- Demo Products
-- =====================================================
INSERT INTO public.products (id, site_id, type, name, description, price_cents, currency, access_duration_days, is_active) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'permit', 'Permis cotier', 'Formation complete au permis cotier', 35000, 'EUR', 365, true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'permit', 'Permis fluvial', 'Formation complete au permis fluvial', 25000, 'EUR', 365, true),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'reactivation', 'Reactivation acces', 'Reouverture de l''acces a la plateforme', 5000, 'EUR', 180, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Demo Exam Centers
-- =====================================================
INSERT INTO public.exam_centers (id, site_id, name, city, postal_code, address) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Centre d''examen Paris Nord', 'Paris', '75019', '123 Quai de la Seine'),
  ('00000000-0000-0000-0000-000000000022', NULL, 'Centre d''examen Marseille', 'Marseille', '13001', '45 Quai du Port')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Next Steps (manual):
-- 1. Create an admin user via Supabase Dashboard or CLI
-- 2. Update their profile role:
--    UPDATE public.profiles SET role = 'admin' WHERE user_id = '<uuid>';
-- =====================================================
