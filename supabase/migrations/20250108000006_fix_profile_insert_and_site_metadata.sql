-- =====================================================
-- Fix: Allow users to insert their own profile
-- Fix: Use site_id from user metadata in trigger
-- =====================================================

-- Add INSERT policy for profiles (users can create their own profile)
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add UPDATE policy for students (users can update their own student record)
CREATE POLICY "students_update_self"
  ON public.students FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Update handle_new_user trigger to use site_id from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  site_id_from_meta UUID;
  default_site_id UUID;
  final_site_id UUID;
BEGIN
  -- Try to get site_id from user metadata first
  site_id_from_meta := (NEW.raw_user_meta_data->>'site_id')::UUID;

  -- If no site_id in metadata, get the default site (first active site)
  IF site_id_from_meta IS NULL THEN
    SELECT id INTO default_site_id
    FROM public.sites
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    final_site_id := default_site_id;
  ELSE
    final_site_id := site_id_from_meta;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, role, full_name, phone)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );

  -- Create student record if we have a site
  IF final_site_id IS NOT NULL THEN
    INSERT INTO public.students (user_id, site_id, access_expires_at)
    VALUES (
      NEW.id,
      final_site_id,
      NOW() + INTERVAL '1 year'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
