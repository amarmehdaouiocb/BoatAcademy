/**
 * Session type (theory or practice)
 */
export type SessionType = 'theory' | 'practice';

/**
 * Enrollment status
 */
export type EnrollmentStatus = 'assigned' | 'cancelled' | 'noshow' | 'completed';

/**
 * Penalty type
 */
export type PenaltyType = 'noshow' | 'late_cancel';

/**
 * Training session
 */
export interface Session {
  id: string;
  site_id: string;
  type: SessionType;
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string | null;
  instructor_user_id: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Session enrollment
 */
export interface Enrollment {
  id: string;
  site_id: string;
  session_id: string;
  student_user_id: string;
  status: EnrollmentStatus;
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
}

/**
 * Student penalty
 */
export interface Penalty {
  id: string;
  site_id: string;
  student_user_id: string;
  session_id: string | null;
  type: PenaltyType;
  occurred_at: string;
  notes: string | null;
  created_by: string | null;
}

/**
 * Session with enrollment count
 */
export interface SessionWithCount extends Session {
  enrolled_count: number;
  available_spots: number;
}

/**
 * Exam center
 */
export interface ExamCenter {
  id: string;
  site_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}
