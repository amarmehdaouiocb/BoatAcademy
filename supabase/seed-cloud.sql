-- =====================================================
-- Boat Academy - Seed Cloud (minimal)
-- =====================================================
-- Version simplifiee pour Supabase Cloud
-- Les utilisateurs doivent etre crees via l'app ou le Dashboard
-- =====================================================

-- 1. SITES
INSERT INTO public.sites (id, name, city, region, timezone, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Boat Academy La Rochelle', 'La Rochelle', 'Nouvelle-Aquitaine', 'Europe/Paris', true),
  ('22222222-2222-2222-2222-222222222222', 'Boat Academy Marseille', 'Marseille', 'Provence-Alpes-Cote d''Azur', 'Europe/Paris', true),
  ('33333333-3333-3333-3333-333333333333', 'Boat Academy Brest', 'Brest', 'Bretagne', 'Europe/Paris', true)
ON CONFLICT (id) DO NOTHING;

-- 2. DOCUMENT TYPES
INSERT INTO public.document_types (id, key, label, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'identity', 'Piece d''identite', 'Carte d''identite ou passeport en cours de validite'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'photo', 'Photo d''identite', 'Photo d''identite recente au format numerique'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'medical', 'Certificat medical', 'Certificat medical de moins de 6 mois'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'proof_address', 'Justificatif de domicile', 'Facture ou attestation de moins de 3 mois')
ON CONFLICT (id) DO NOTHING;

-- 3. SITE REQUIRED DOCUMENTS
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
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true)
ON CONFLICT (site_id, document_type_id) DO NOTHING;

-- 4. PRODUCTS
INSERT INTO public.products (id, site_id, type, name, description, price_cents, currency, access_duration_days, is_active) VALUES
  -- La Rochelle
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'permit', 'Permis Cotier', 'Formation complete au permis cotier - theorie + pratique', 35000, 'EUR', 365, true),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111111', 'permit', 'Permis Fluvial', 'Formation au permis fluvial - navigation interieure', 25000, 'EUR', 365, true),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '11111111-1111-1111-1111-111111111111', 'permit', 'Extension Hauturiere', 'Extension hauturiere pour la navigation au large', 45000, 'EUR', 365, true),
  -- Marseille
  ('bbbbbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbb6', '22222222-2222-2222-2222-222222222222', 'permit', 'Permis Cotier', 'Formation complete au permis cotier', 38000, 'EUR', 365, true),
  ('bbbbbbb7-bbbb-bbbb-bbbb-bbbbbbbbbbb7', '22222222-2222-2222-2222-222222222222', 'permit', 'Permis Fluvial', 'Formation au permis fluvial', 28000, 'EUR', 365, true),
  -- Brest
  ('bbbbbbb9-bbbb-bbbb-bbbb-bbbbbbbbbbb9', '33333333-3333-3333-3333-333333333333', 'permit', 'Permis Cotier', 'Formation permis cotier en Bretagne', 32000, 'EUR', 365, true)
ON CONFLICT (id) DO NOTHING;

-- 5. EXAM CENTERS
INSERT INTO public.exam_centers (id, site_id, name, address, city, postal_code, phone, website, notes) VALUES
  ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'DDTM Charente-Maritime', '89 avenue des Cordeliers', 'La Rochelle', '17000', '05 46 51 51 51', 'https://www.charente-maritime.gouv.fr', 'Ouvert du lundi au vendredi 9h-12h'),
  ('eeeeeee3-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'DDTM Bouches-du-Rhone', '16 rue Antoine Zattara', 'Marseille', '13002', '04 91 28 40 40', 'https://www.bouches-du-rhone.gouv.fr', NULL),
  ('eeeeeee5-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'DDTM Finistere', '2 boulevard du Finistere', 'Quimper', '29000', '02 98 76 52 00', 'https://www.finistere.gouv.fr', NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FIN DU SEED CLOUD
-- =====================================================
--
-- Pour tester l'app, creez un compte via l'ecran d'inscription
-- en choisissant l'un des 3 sites disponibles.
-- =====================================================
