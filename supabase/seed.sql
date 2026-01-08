-- =====================================================
-- Boat Academy - Seed Data
-- =====================================================
-- Mock data credibles pour tester l'application
-- Run with: supabase db reset (includes migrations + seed)
-- =====================================================

-- Nettoyer les donnees existantes (dans l'ordre des dependances)
TRUNCATE public.audit_log CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.messages CASCADE;
TRUNCATE public.conversations CASCADE;
TRUNCATE public.device_tokens CASCADE;
TRUNCATE public.external_learning_links CASCADE;
TRUNCATE public.penalties CASCADE;
TRUNCATE public.enrollments CASCADE;
TRUNCATE public.sessions CASCADE;
TRUNCATE public.entitlements CASCADE;
TRUNCATE public.orders CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.student_documents CASCADE;
TRUNCATE public.site_required_documents CASCADE;
TRUNCATE public.document_types CASCADE;
TRUNCATE public.exam_centers CASCADE;
TRUNCATE public.students CASCADE;
TRUNCATE public.profile_sites CASCADE;
TRUNCATE public.profiles CASCADE;
TRUNCATE public.sites CASCADE;

-- Supprimer les utilisateurs auth existants (sauf le service role)
DELETE FROM auth.users WHERE email LIKE '%@boatacademy.fr' OR email LIKE '%@example.com';

-- =====================================================
-- 1. SITES (Ecoles de navigation)
-- =====================================================

INSERT INTO public.sites (id, name, city, region, timezone, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Boat Academy La Rochelle', 'La Rochelle', 'Nouvelle-Aquitaine', 'Europe/Paris', true),
  ('22222222-2222-2222-2222-222222222222', 'Boat Academy Marseille', 'Marseille', 'Provence-Alpes-Cote d''Azur', 'Europe/Paris', true),
  ('33333333-3333-3333-3333-333333333333', 'Boat Academy Brest', 'Brest', 'Bretagne', 'Europe/Paris', true);

-- =====================================================
-- 2. DOCUMENT TYPES
-- =====================================================

INSERT INTO public.document_types (id, key, label, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'identity', 'Piece d''identite', 'Carte d''identite ou passeport en cours de validite'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'photo', 'Photo d''identite', 'Photo d''identite recente au format numerique'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'medical', 'Certificat medical', 'Certificat medical de moins de 6 mois'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'proof_address', 'Justificatif de domicile', 'Facture ou attestation de moins de 3 mois');

-- Documents requis par site
INSERT INTO public.site_required_documents (site_id, document_type_id, is_required) VALUES
  -- La Rochelle
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', false),
  -- Marseille
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
  -- Brest
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);

-- =====================================================
-- 3. EXAM CENTERS
-- =====================================================

INSERT INTO public.exam_centers (id, site_id, name, address, city, postal_code, phone, website, notes) VALUES
  -- La Rochelle
  ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'DDTM Charente-Maritime', '89 avenue des Cordeliers', 'La Rochelle', '17000', '05 46 51 51 51', 'https://www.charente-maritime.gouv.fr', 'Ouvert du lundi au vendredi 9h-12h'),
  ('eeeeeee2-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Centre Nautique Rochelais', '12 quai Louis Prunier', 'La Rochelle', '17000', '05 46 34 56 78', NULL, 'Examens pratiques uniquement'),
  -- Marseille
  ('eeeeeee3-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'DDTM Bouches-du-Rhone', '16 rue Antoine Zattara', 'Marseille', '13002', '04 91 28 40 40', 'https://www.bouches-du-rhone.gouv.fr', NULL),
  ('eeeeeee4-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Port de la Pointe Rouge', '2 promenade Georges Pompidou', 'Marseille', '13008', '04 91 73 25 25', NULL, 'Examens pratiques'),
  -- Brest
  ('eeeeeee5-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'DDTM Finistere', '2 boulevard du Finistere', 'Quimper', '29000', '02 98 76 52 00', 'https://www.finistere.gouv.fr', NULL);

-- =====================================================
-- 4. PRODUCTS (Permis et formations)
-- =====================================================

INSERT INTO public.products (id, site_id, type, name, description, price_cents, currency, access_duration_days, is_active) VALUES
  -- La Rochelle
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'permit', 'Permis Cotier', 'Formation complete au permis cotier - theorie + pratique', 35000, 'EUR', 365, true),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111111', 'permit', 'Permis Fluvial', 'Formation au permis fluvial - navigation interieure', 25000, 'EUR', 365, true),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '11111111-1111-1111-1111-111111111111', 'permit', 'Extension Hauturiere', 'Extension hauturiere pour la navigation au large', 45000, 'EUR', 365, true),
  ('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '11111111-1111-1111-1111-111111111111', 'reactivation', 'Reactivation acces (6 mois)', 'Prolongation de l''acces a l''espace stagiaire', 5000, 'EUR', 180, true),
  ('bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '11111111-1111-1111-1111-111111111111', 'post_permit', 'Stage Perfectionnement Manoeuvres', 'Perfectionnement aux manoeuvres de port', 15000, 'EUR', 30, true),
  -- Marseille
  ('bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', '22222222-2222-2222-2222-222222222222', 'permit', 'Permis Cotier', 'Formation complete au permis cotier', 38000, 'EUR', 365, true),
  ('bbbbbbb7-bbbb-bbbb-bbbb-bbbbbbbbbbb7', '22222222-2222-2222-2222-222222222222', 'permit', 'Permis Fluvial', 'Formation au permis fluvial', 28000, 'EUR', 365, true),
  ('bbbbbbb8-bbbb-bbbb-bbbb-bbbbbbbbbbb8', '22222222-2222-2222-2222-222222222222', 'reactivation', 'Reactivation acces (6 mois)', 'Prolongation acces espace stagiaire', 5000, 'EUR', 180, true),
  -- Brest
  ('bbbbbbb9-bbbb-bbbb-bbbb-bbbbbbbbbbb9', '33333333-3333-3333-3333-333333333333', 'permit', 'Permis Cotier', 'Formation permis cotier en Bretagne', 32000, 'EUR', 365, true),
  ('bbbbbb10-bbbb-bbbb-bbbb-bbbbbbbbbb10', '33333333-3333-3333-3333-333333333333', 'permit', 'Extension Hauturiere', 'Navigation au large - Atlantique', 42000, 'EUR', 365, true);

-- =====================================================
-- 5. USERS (via auth.users + profiles)
-- =====================================================
-- IMPORTANT: GoTrue requires certain text fields to be non-NULL (empty string instead)
-- Fields: confirmation_token, recovery_token, email_change, email_change_token_new, etc.
-- Also raw_app_meta_data must be valid JSONB (not NULL)

-- Admin global
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, aud, role,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@boatacademy.fr',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"full_name": "Pierre Durand"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  now(), now(), 'authenticated', 'authenticated',
  '', '', '', '', ''
);

-- Managers
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, aud, role,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'manager.larochelle@boatacademy.fr', crypt('Manager123!', gen_salt('bf')), now(), '{"full_name": "Marie Lefebvre"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'manager.marseille@boatacademy.fr', crypt('Manager123!', gen_salt('bf')), now(), '{"full_name": "Jean-Marc Pagnol"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', '');

-- Instructors
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, aud, role,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'moniteur.paul@boatacademy.fr', crypt('Moniteur123!', gen_salt('bf')), now(), '{"full_name": "Paul Martin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'moniteur.sophie@boatacademy.fr', crypt('Moniteur123!', gen_salt('bf')), now(), '{"full_name": "Sophie Dubois"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'moniteur.luc@boatacademy.fr', crypt('Moniteur123!', gen_salt('bf')), now(), '{"full_name": "Luc Moreau"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', '');

-- Students
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, aud, role,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
) VALUES
  -- La Rochelle students
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000000', 'alice.bernard@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Alice Bernard", "phone": "06 12 34 56 78", "site_id": "11111111-1111-1111-1111-111111111111"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000000', 'thomas.petit@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Thomas Petit", "phone": "06 23 45 67 89", "site_id": "11111111-1111-1111-1111-111111111111"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000000', 'emma.robert@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Emma Robert", "phone": "06 34 56 78 90", "site_id": "11111111-1111-1111-1111-111111111111"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000000', 'lucas.richard@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Lucas Richard", "phone": "06 45 67 89 01", "site_id": "11111111-1111-1111-1111-111111111111"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  -- Marseille students
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000000', 'lea.simon@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Lea Simon", "phone": "06 56 78 90 12", "site_id": "22222222-2222-2222-2222-222222222222"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000000', 'hugo.laurent@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Hugo Laurent", "phone": "06 67 89 01 23", "site_id": "22222222-2222-2222-2222-222222222222"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000000', 'chloe.michel@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Chloe Michel", "phone": "06 78 90 12 34", "site_id": "22222222-2222-2222-2222-222222222222"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  -- Brest students
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000000', 'maxime.leroy@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Maxime Leroy", "phone": "06 89 01 23 45", "site_id": "33333333-3333-3333-3333-333333333333"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000000', 'camille.roux@example.com', crypt('Student123!', gen_salt('bf')), now(), '{"full_name": "Camille Roux", "phone": "06 90 12 34 56", "site_id": "33333333-3333-3333-3333-333333333333"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', '');

-- =====================================================
-- 6. PROFILES (crees manuellement car le trigger ne s'applique pas au seed)
-- =====================================================

-- Admin (update role from trigger-created 'student' to 'admin')
INSERT INTO public.profiles (user_id, role, full_name, phone, primary_site_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Pierre Durand', '06 00 00 00 01', NULL)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, primary_site_id = EXCLUDED.primary_site_id;

-- Managers
INSERT INTO public.profiles (user_id, role, full_name, phone, primary_site_id) VALUES
  ('00000000-0000-0000-0000-000000000002', 'manager', 'Marie Lefebvre', '06 00 00 00 02', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000003', 'manager', 'Jean-Marc Pagnol', '06 00 00 00 03', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, primary_site_id = EXCLUDED.primary_site_id;

-- Instructors
INSERT INTO public.profiles (user_id, role, full_name, phone, primary_site_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'instructor', 'Paul Martin', '06 00 00 00 10', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000011', 'instructor', 'Sophie Dubois', '06 00 00 00 11', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000012', 'instructor', 'Luc Moreau', '06 00 00 00 12', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, primary_site_id = EXCLUDED.primary_site_id;

-- Students
INSERT INTO public.profiles (user_id, role, full_name, phone, primary_site_id) VALUES
  ('00000000-0000-0000-0000-000000000101', 'student', 'Alice Bernard', '06 12 34 56 78', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000102', 'student', 'Thomas Petit', '06 23 45 67 89', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000103', 'student', 'Emma Robert', '06 34 56 78 90', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000104', 'student', 'Lucas Richard', '06 45 67 89 01', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000105', 'student', 'Lea Simon', '06 56 78 90 12', '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000106', 'student', 'Hugo Laurent', '06 67 89 01 23', '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000107', 'student', 'Chloe Michel', '06 78 90 12 34', '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000108', 'student', 'Maxime Leroy', '06 89 01 23 45', '33333333-3333-3333-3333-333333333333'),
  ('00000000-0000-0000-0000-000000000109', 'student', 'Camille Roux', '06 90 12 34 56', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, primary_site_id = EXCLUDED.primary_site_id;

-- Delete auto-created student records for non-student users (admin, managers, instructors)
DELETE FROM public.students WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001', -- admin
  '00000000-0000-0000-0000-000000000002', -- manager
  '00000000-0000-0000-0000-000000000003', -- manager
  '00000000-0000-0000-0000-000000000010', -- instructor
  '00000000-0000-0000-0000-000000000011', -- instructor
  '00000000-0000-0000-0000-000000000012'  -- instructor
);

-- =====================================================
-- 7. PROFILE_SITES (rattachement staff aux sites)
-- =====================================================

INSERT INTO public.profile_sites (user_id, site_id) VALUES
  -- Manager La Rochelle
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
  -- Manager Marseille (+ acces Brest)
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333'),
  -- Instructeurs La Rochelle
  ('00000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111'),
  -- Instructeur Marseille
  ('00000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222');

-- =====================================================
-- 8. STUDENTS (donnees stagiaires)
-- =====================================================

INSERT INTO public.students (user_id, site_id, oedipp_number, oedipp_set_at, consent_marketing) VALUES
  -- La Rochelle - Alice a son OEDIPP
  ('00000000-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'OEDIPP-2024-LR-001', now() - interval '30 days', true),
  -- La Rochelle - Thomas a son OEDIPP
  ('00000000-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'OEDIPP-2024-LR-002', now() - interval '15 days', false),
  -- La Rochelle - Emma en attente OEDIPP
  ('00000000-0000-0000-0000-000000000103', '11111111-1111-1111-1111-111111111111', NULL, NULL, true),
  -- La Rochelle - Lucas en attente OEDIPP
  ('00000000-0000-0000-0000-000000000104', '11111111-1111-1111-1111-111111111111', NULL, NULL, false),
  -- Marseille
  ('00000000-0000-0000-0000-000000000105', '22222222-2222-2222-2222-222222222222', 'OEDIPP-2024-MA-001', now() - interval '45 days', true),
  ('00000000-0000-0000-0000-000000000106', '22222222-2222-2222-2222-222222222222', 'OEDIPP-2024-MA-002', now() - interval '20 days', false),
  ('00000000-0000-0000-0000-000000000107', '22222222-2222-2222-2222-222222222222', NULL, NULL, true),
  -- Brest
  ('00000000-0000-0000-0000-000000000108', '33333333-3333-3333-3333-333333333333', 'OEDIPP-2024-BR-001', now() - interval '60 days', false),
  ('00000000-0000-0000-0000-000000000109', '33333333-3333-3333-3333-333333333333', NULL, NULL, true)
ON CONFLICT (user_id) DO UPDATE SET site_id = EXCLUDED.site_id, oedipp_number = EXCLUDED.oedipp_number, oedipp_set_at = EXCLUDED.oedipp_set_at, consent_marketing = EXCLUDED.consent_marketing;

-- =====================================================
-- 9. STUDENT_DOCUMENTS
-- =====================================================

INSERT INTO public.student_documents (id, site_id, student_user_id, document_type_id, storage_path, status, rejected_reason, reviewed_at, reviewed_by) VALUES
  -- Alice (tous documents valides)
  ('dddddd01-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'documents/101/identity.pdf', 'approved', NULL, now() - interval '25 days', '00000000-0000-0000-0000-000000000002'),
  ('dddddd02-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'documents/101/photo.jpg', 'approved', NULL, now() - interval '25 days', '00000000-0000-0000-0000-000000000002'),
  ('dddddd03-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'documents/101/medical.pdf', 'approved', NULL, now() - interval '25 days', '00000000-0000-0000-0000-000000000002'),
  -- Thomas (documents en cours)
  ('dddddd04-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'documents/102/identity.pdf', 'approved', NULL, now() - interval '10 days', '00000000-0000-0000-0000-000000000002'),
  ('dddddd05-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'documents/102/photo.jpg', 'pending', NULL, NULL, NULL),
  ('dddddd06-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'documents/102/medical.pdf', 'rejected', 'Certificat de plus de 6 mois', now() - interval '5 days', '00000000-0000-0000-0000-000000000002'),
  -- Emma (quelques documents)
  ('dddddd07-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000103', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'documents/103/identity.pdf', 'pending', NULL, NULL, NULL),
  -- Lea Marseille (tous valides)
  ('dddddd08-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'documents/105/identity.pdf', 'approved', NULL, now() - interval '40 days', '00000000-0000-0000-0000-000000000003'),
  ('dddddd09-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'documents/105/photo.jpg', 'approved', NULL, now() - interval '40 days', '00000000-0000-0000-0000-000000000003'),
  ('dddddd10-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'documents/105/medical.pdf', 'approved', NULL, now() - interval '40 days', '00000000-0000-0000-0000-000000000003');

-- =====================================================
-- 10. ORDERS & ENTITLEMENTS
-- =====================================================

-- Commandes payees
INSERT INTO public.orders (id, site_id, user_id, product_id, status, amount_cents, currency, paid_at) VALUES
  ('0d0d0d01-0d0d-0d0d-0d0d-0d0d0d0d0d01', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'paid', 35000, 'EUR', now() - interval '60 days'),
  ('0d0d0d02-0d0d-0d0d-0d0d-0d0d0d0d0d02', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'paid', 35000, 'EUR', now() - interval '30 days'),
  ('0d0d0d03-0d0d-0d0d-0d0d-0d0d0d0d0d03', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000103', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'paid', 35000, 'EUR', now() - interval '15 days'),
  ('0d0d0d04-0d0d-0d0d-0d0d-0d0d0d0d0d04', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105', 'bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'paid', 38000, 'EUR', now() - interval '90 days'),
  ('0d0d0d05-0d0d-0d0d-0d0d-0d0d0d0d0d05', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000106', 'bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'paid', 38000, 'EUR', now() - interval '45 days'),
  ('0d0d0d06-0d0d-0d0d-0d0d-0d0d0d0d0d06', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000108', 'bbbbbbb9-bbbb-bbbb-bbbb-bbbbbbbbbbb9', 'paid', 32000, 'EUR', now() - interval '120 days');

-- Droits d'acces
INSERT INTO public.entitlements (id, site_id, user_id, product_id, starts_at, expires_at) VALUES
  ('e0e0e0e1-e0e0-e0e0-e0e0-e0e0e0e0e0e1', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', now() - interval '60 days', now() + interval '305 days'),
  ('e0e0e0e2-e0e0-e0e0-e0e0-e0e0e0e0e0e2', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', now() - interval '30 days', now() + interval '335 days'),
  ('e0e0e0e3-e0e0-e0e0-e0e0-e0e0e0e0e0e3', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000103', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', now() - interval '15 days', now() + interval '350 days'),
  ('e0e0e0e4-e0e0-e0e0-e0e0-e0e0e0e0e0e4', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105', 'bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', now() - interval '90 days', now() + interval '275 days'),
  ('e0e0e0e5-e0e0-e0e0-e0e0-e0e0e0e0e0e5', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000106', 'bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', now() - interval '45 days', now() + interval '320 days'),
  ('e0e0e0e6-e0e0-e0e0-e0e0-e0e0e0e0e0e6', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000108', 'bbbbbbb9-bbbb-bbbb-bbbb-bbbbbbbbbbb9', now() - interval '120 days', now() + interval '245 days');

-- =====================================================
-- 11. SESSIONS (formations)
-- =====================================================

INSERT INTO public.sessions (id, site_id, type, starts_at, ends_at, capacity, location, instructor_user_id, notes) VALUES
  -- Sessions passees La Rochelle
  ('5e5510e1-5e55-5e55-5e55-5e55555e5501', '11111111-1111-1111-1111-111111111111', 'theory', now() - interval '20 days', now() - interval '20 days' + interval '3 hours', 12, 'Salle Atlantique - 15 rue du Port', '00000000-0000-0000-0000-000000000010', 'Code de la mer et balisage'),
  ('5e5510e2-5e55-5e55-5e55-5e55555e5502', '11111111-1111-1111-1111-111111111111', 'practice', now() - interval '15 days', now() - interval '15 days' + interval '4 hours', 4, 'Port des Minimes - Ponton B', '00000000-0000-0000-0000-000000000011', 'Manoeuvres de base'),

  -- Sessions a venir La Rochelle
  ('5e5510e3-5e55-5e55-5e55-5e55555e5503', '11111111-1111-1111-1111-111111111111', 'theory', now() + interval '3 days', now() + interval '3 days' + interval '3 hours', 12, 'Salle Atlantique - 15 rue du Port', '00000000-0000-0000-0000-000000000010', 'Navigation et meteo'),
  ('5e5510e4-5e55-5e55-5e55-5e55555e5504', '11111111-1111-1111-1111-111111111111', 'practice', now() + interval '5 days', now() + interval '5 days' + interval '4 hours', 4, 'Port des Minimes - Ponton B', '00000000-0000-0000-0000-000000000011', 'Navigation cotiere'),
  ('5e5510e5-5e55-5e55-5e55-5e55555e5505', '11111111-1111-1111-1111-111111111111', 'theory', now() + interval '10 days', now() + interval '10 days' + interval '3 hours', 12, 'Salle Atlantique - 15 rue du Port', '00000000-0000-0000-0000-000000000010', 'Examen blanc theorique'),
  ('5e5510e6-5e55-5e55-5e55-5e55555e5506', '11111111-1111-1111-1111-111111111111', 'practice', now() + interval '12 days', now() + interval '12 days' + interval '4 hours', 4, 'Port des Minimes - Ponton B', '00000000-0000-0000-0000-000000000011', 'Preparation examen pratique'),

  -- Sessions Marseille
  ('5e5510e7-5e55-5e55-5e55-5e55555e5507', '22222222-2222-2222-2222-222222222222', 'theory', now() - interval '10 days', now() - interval '10 days' + interval '3 hours', 15, 'Salle Mediterranee - Vieux Port', '00000000-0000-0000-0000-000000000012', 'Initiation navigation'),
  ('5e5510e8-5e55-5e55-5e55-5e55555e5508', '22222222-2222-2222-2222-222222222222', 'practice', now() + interval '7 days', now() + interval '7 days' + interval '4 hours', 6, 'Pointe Rouge - Base nautique', '00000000-0000-0000-0000-000000000012', 'Sorties en mer'),
  ('5e5510e9-5e55-5e55-5e55-5e55555e5509', '22222222-2222-2222-2222-222222222222', 'theory', now() + interval '14 days', now() + interval '14 days' + interval '3 hours', 15, 'Salle Mediterranee - Vieux Port', '00000000-0000-0000-0000-000000000012', 'Securite en mer'),

  -- Sessions Brest
  ('5e551010-5e55-5e55-5e55-5e55555e5510', '33333333-3333-3333-3333-333333333333', 'theory', now() + interval '5 days', now() + interval '5 days' + interval '3 hours', 10, 'Centre nautique de Brest', NULL, 'Formation theorique intensive'),
  ('5e551011-5e55-5e55-5e55-5e55555e5511', '33333333-3333-3333-3333-333333333333', 'practice', now() + interval '8 days', now() + interval '8 days' + interval '5 hours', 3, 'Port de plaisance du Moulin Blanc', NULL, 'Navigation en rade de Brest');

-- =====================================================
-- 12. ENROLLMENTS (inscriptions aux sessions)
-- =====================================================

INSERT INTO public.enrollments (id, site_id, session_id, student_user_id, status) VALUES
  -- Sessions passees
  ('e0011001-e001-e001-e001-e001e001e001', '11111111-1111-1111-1111-111111111111', '5e5510e1-5e55-5e55-5e55-5e55555e5501', '00000000-0000-0000-0000-000000000101', 'completed'),
  ('e0011002-e001-e001-e001-e001e001e002', '11111111-1111-1111-1111-111111111111', '5e5510e1-5e55-5e55-5e55-5e55555e5501', '00000000-0000-0000-0000-000000000102', 'completed'),
  ('e0011003-e001-e001-e001-e001e001e003', '11111111-1111-1111-1111-111111111111', '5e5510e2-5e55-5e55-5e55-5e55555e5502', '00000000-0000-0000-0000-000000000101', 'completed'),

  -- Sessions a venir La Rochelle
  ('e0011004-e001-e001-e001-e001e001e004', '11111111-1111-1111-1111-111111111111', '5e5510e3-5e55-5e55-5e55-5e55555e5503', '00000000-0000-0000-0000-000000000101', 'assigned'),
  ('e0011005-e001-e001-e001-e001e001e005', '11111111-1111-1111-1111-111111111111', '5e5510e3-5e55-5e55-5e55-5e55555e5503', '00000000-0000-0000-0000-000000000102', 'assigned'),
  ('e0011006-e001-e001-e001-e001e001e006', '11111111-1111-1111-1111-111111111111', '5e5510e3-5e55-5e55-5e55-5e55555e5503', '00000000-0000-0000-0000-000000000103', 'assigned'),
  ('e0011007-e001-e001-e001-e001e001e007', '11111111-1111-1111-1111-111111111111', '5e5510e4-5e55-5e55-5e55-5e55555e5504', '00000000-0000-0000-0000-000000000101', 'assigned'),
  ('e0011008-e001-e001-e001-e001e001e008', '11111111-1111-1111-1111-111111111111', '5e5510e4-5e55-5e55-5e55-5e55555e5504', '00000000-0000-0000-0000-000000000102', 'assigned'),

  -- Sessions Marseille
  ('e0011009-e001-e001-e001-e001e001e009', '22222222-2222-2222-2222-222222222222', '5e5510e7-5e55-5e55-5e55-5e55555e5507', '00000000-0000-0000-0000-000000000105', 'completed'),
  ('e0011010-e001-e001-e001-e001e001e010', '22222222-2222-2222-2222-222222222222', '5e5510e7-5e55-5e55-5e55-5e55555e5507', '00000000-0000-0000-0000-000000000106', 'noshow'),
  ('e0011011-e001-e001-e001-e001e001e011', '22222222-2222-2222-2222-222222222222', '5e5510e8-5e55-5e55-5e55-5e55555e5508', '00000000-0000-0000-0000-000000000105', 'assigned'),
  ('e0011012-e001-e001-e001-e001e001e012', '22222222-2222-2222-2222-222222222222', '5e5510e8-5e55-5e55-5e55-5e55555e5508', '00000000-0000-0000-0000-000000000106', 'assigned'),

  -- Sessions Brest
  ('e0011013-e001-e001-e001-e001e001e013', '33333333-3333-3333-3333-333333333333', '5e551010-5e55-5e55-5e55-5e55555e5510', '00000000-0000-0000-0000-000000000108', 'assigned'),
  ('e0011014-e001-e001-e001-e001e001e014', '33333333-3333-3333-3333-333333333333', '5e551011-5e55-5e55-5e55-5e55555e5511', '00000000-0000-0000-0000-000000000108', 'assigned');

-- =====================================================
-- 13. PENALTIES
-- =====================================================

INSERT INTO public.penalties (id, site_id, student_user_id, session_id, type, occurred_at, notes, created_by) VALUES
  ('de0de001-de0d-de0d-de0d-de0de0de0de1', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000106', '5e5510e7-5e55-5e55-5e55-5e55555e5507', 'noshow', now() - interval '10 days', 'Absence non justifiee a la session theorique', '00000000-0000-0000-0000-000000000003');

-- =====================================================
-- 14. CONVERSATIONS & MESSAGES
-- =====================================================

-- Conversations
INSERT INTO public.conversations (id, site_id, student_user_id) VALUES
  ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c001', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101'),
  ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102'),
  ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c003', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105'),
  ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c004', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000106');

-- Messages
INSERT INTO public.messages (id, site_id, conversation_id, sender_user_id, body, created_at) VALUES
  -- Conversation Alice
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a001', '11111111-1111-1111-1111-111111111111', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c001', '00000000-0000-0000-0000-000000000101', 'Bonjour, je voudrais savoir quand aura lieu mon prochain cours pratique ?', now() - interval '5 days'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a002', '11111111-1111-1111-1111-111111111111', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c001', '00000000-0000-0000-0000-000000000002', 'Bonjour Alice ! Votre prochaine session pratique est prevue dans 5 jours au Port des Minimes. Vous recevrez un rappel la veille.', now() - interval '5 days' + interval '2 hours'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a003', '11111111-1111-1111-1111-111111111111', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c001', '00000000-0000-0000-0000-000000000101', 'Parfait, merci beaucoup ! Dois-je apporter quelque chose ?', now() - interval '4 days'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a004', '11111111-1111-1111-1111-111111111111', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c001', '00000000-0000-0000-0000-000000000002', 'Pensez a prendre des vetements chauds et des chaussures antiderapantes. On fournit les gilets de sauvetage.', now() - interval '4 days' + interval '1 hour'),

  -- Conversation Thomas
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a005', '11111111-1111-1111-1111-111111111111', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c002', '00000000-0000-0000-0000-000000000102', 'Mon certificat medical a ete refuse. Que dois-je faire ?', now() - interval '3 days'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a006', '11111111-1111-1111-1111-111111111111', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c002', '00000000-0000-0000-0000-000000000002', 'Bonjour Thomas, votre certificat datait de plus de 6 mois. Il vous suffit d''en demander un nouveau a votre medecin et de le telecharger a nouveau dans votre espace.', now() - interval '3 days' + interval '3 hours'),

  -- Conversation Lea (Marseille)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a007', '22222222-2222-2222-2222-222222222222', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c003', '00000000-0000-0000-0000-000000000105', 'Bonjour, est-il possible de changer de creneau pour la session du 15 ?', now() - interval '2 days'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a008', '22222222-2222-2222-2222-222222222222', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c003', '00000000-0000-0000-0000-000000000003', 'Bonjour Lea, je regarde les disponibilites et je reviens vers vous rapidement.', now() - interval '2 days' + interval '4 hours'),

  -- Conversation Hugo (apres penalite)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a009', '22222222-2222-2222-2222-222222222222', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c004', '00000000-0000-0000-0000-000000000003', 'Hugo, vous etiez absent a la session theorique du 10. Merci de nous prevenir en cas d''empechement.', now() - interval '9 days'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a010', '22222222-2222-2222-2222-222222222222', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c004', '00000000-0000-0000-0000-000000000106', 'Toutes mes excuses, j''ai eu un imprevu familial. Est-il possible de rattraper cette session ?', now() - interval '8 days'),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a011', '22222222-2222-2222-2222-222222222222', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c004', '00000000-0000-0000-0000-000000000003', 'Pas de souci, je vous ai inscrit a la prochaine session du 14. Pensez a bien noter la date !', now() - interval '8 days' + interval '2 hours');

-- =====================================================
-- 15. NOTIFICATIONS
-- =====================================================

INSERT INTO public.notifications (id, user_id, site_id, type, title, body, read_at, created_at) VALUES
  -- Alice
  ('f0f0f001-f0f0-f0f0-f0f0-f0f0f0f0f001', '00000000-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'system', 'Session confirmee', 'Votre inscription a la session "Navigation et meteo" du 11/01 est confirmee.', now() - interval '1 day', now() - interval '2 days'),
  ('f0f0f002-f0f0-f0f0-f0f0-f0f0f0f0f002', '00000000-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'message', 'Nouveau message', 'Marie Lefebvre vous a envoye un message.', NULL, now() - interval '4 days'),
  -- Thomas
  ('f0f0f003-f0f0-f0f0-f0f0-f0f0f0f0f003', '00000000-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'system', 'Document refuse', 'Votre certificat medical a ete refuse. Motif : document perime.', now() - interval '2 days', now() - interval '5 days'),
  -- Hugo
  ('f0f0f004-f0f0-f0f0-f0f0-f0f0f0f0f004', '00000000-0000-0000-0000-000000000106', '22222222-2222-2222-2222-222222222222', 'system', 'Penalite appliquee', 'Une penalite pour absence a ete enregistree sur votre dossier.', NULL, now() - interval '10 days');

-- =====================================================
-- 16. EXTERNAL LEARNING LINKS
-- =====================================================

INSERT INTO public.external_learning_links (student_user_id, url) VALUES
  ('00000000-0000-0000-0000-000000000101', 'https://permis-bateau-online.fr/espace/alice-bernard'),
  ('00000000-0000-0000-0000-000000000105', 'https://permis-bateau-online.fr/espace/lea-simon');

-- =====================================================
-- FIN DU SEED
-- =====================================================

-- Resume des comptes crees :
-- =====================================================
-- ADMIN:
--   admin@boatacademy.fr / Admin123!
--
-- MANAGERS:
--   manager.larochelle@boatacademy.fr / Manager123!
--   manager.marseille@boatacademy.fr / Manager123!
--
-- INSTRUCTEURS:
--   moniteur.paul@boatacademy.fr / Moniteur123!
--   moniteur.sophie@boatacademy.fr / Moniteur123!
--   moniteur.luc@boatacademy.fr / Moniteur123!
--
-- STAGIAIRES:
--   alice.bernard@example.com / Student123! (La Rochelle, OEDIPP OK, docs OK)
--   thomas.petit@example.com / Student123! (La Rochelle, OEDIPP OK, doc refuse)
--   emma.robert@example.com / Student123! (La Rochelle, pas OEDIPP)
--   lucas.richard@example.com / Student123! (La Rochelle, pas OEDIPP)
--   lea.simon@example.com / Student123! (Marseille, OEDIPP OK)
--   hugo.laurent@example.com / Student123! (Marseille, OEDIPP OK, penalite)
--   chloe.michel@example.com / Student123! (Marseille, pas OEDIPP)
--   maxime.leroy@example.com / Student123! (Brest, OEDIPP OK)
--   camille.roux@example.com / Student123! (Brest, pas OEDIPP)
-- =====================================================
