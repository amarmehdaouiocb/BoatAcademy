-- =====================================================
-- Fix RLS helper functions - Add SECURITY DEFINER
-- =====================================================
-- The current_role() function needs to bypass RLS to avoid
-- circular dependency when used in profiles table RLS policies

-- Recreate current_role with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Recreate has_site_access with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_site_access(_site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin' THEN true
    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('manager', 'instructor') THEN EXISTS (
      SELECT 1 FROM public.profile_sites ps
      WHERE ps.user_id = auth.uid() AND ps.site_id = _site_id
    )
    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'student' THEN EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid() AND s.site_id = _site_id
    )
    ELSE false
  END
$$;
