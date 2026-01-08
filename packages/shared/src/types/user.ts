/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'manager' | 'instructor' | 'student';

/**
 * Profile (extends auth.users)
 */
export interface Profile {
  user_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  primary_site_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Student extension of profile
 */
export interface Student {
  user_id: string;
  site_id: string;
  oedipp_number: string | null;
  oedipp_set_at: string | null;
  consent_marketing: boolean;
  created_at: string;
}

/**
 * Site (multi-tenant)
 */
export interface Site {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Profile with relations
 */
export interface ProfileWithRelations extends Profile {
  site?: Site;
  student?: Student;
}
