-- Update handle_new_user trigger to also create student record
-- Uses a default site for new signups (can be changed later by admin)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_site_id UUID;
BEGIN
  -- Get the default site (first active site)
  SELECT id INTO default_site_id
  FROM public.sites
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- Create profile
  INSERT INTO public.profiles (user_id, role, full_name, phone)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );

  -- Create student record if we have a default site
  IF default_site_id IS NOT NULL THEN
    INSERT INTO public.students (user_id, site_id, access_expires_at)
    VALUES (
      NEW.id,
      default_site_id,
      NOW() + INTERVAL '1 year'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
