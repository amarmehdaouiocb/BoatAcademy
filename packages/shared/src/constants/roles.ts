import type { UserRole } from '../types';

/**
 * All user roles
 */
export const USER_ROLES: UserRole[] = ['admin', 'manager', 'instructor', 'student'];

/**
 * Role labels (French)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  instructor: 'Moniteur',
  student: 'Stagiaire',
};

/**
 * Roles that can manage students
 */
export const MANAGER_ROLES: UserRole[] = ['admin', 'manager'];

/**
 * Roles that can manage sites
 */
export const ADMIN_ROLES: UserRole[] = ['admin'];

/**
 * Check if role can manage students
 */
export function canManageStudents(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}

/**
 * Check if role can manage sites
 */
export function canManageSites(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Check if role is staff (non-student)
 */
export function isStaff(role: UserRole): boolean {
  return role !== 'student';
}
