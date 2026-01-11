-- Add access_expires_at column to students table
-- This tracks when a student's access to the platform expires

ALTER TABLE public.students
ADD COLUMN access_expires_at TIMESTAMPTZ;

-- Set default expiry to 1 year from now for existing students
UPDATE public.students
SET access_expires_at = NOW() + INTERVAL '1 year'
WHERE access_expires_at IS NULL;

COMMENT ON COLUMN public.students.access_expires_at IS 'Date when student access to the platform expires';
