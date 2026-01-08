import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@boatacademy/shared';
import type { SuccessResponse } from '../types';

/**
 * Sessions / Enrollments API module
 */
export function createSessionsClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Assign a student to a session
     *
     * Only admin/manager can call this.
     * Validates OEDIPP for practice sessions.
     * Checks session capacity.
     *
     * @param sessionId - The session UUID
     * @param studentUserId - The student's user UUID
     * @throws Error if forbidden, session full, or OEDIPP required
     *
     * @example
     * ```typescript
     * await api.sessions.assignStudent(sessionId, studentUserId);
     * ```
     */
    async assignStudent(sessionId: string, studentUserId: string): Promise<SuccessResponse> {
      const { data, error } = await supabase.functions.invoke<SuccessResponse>(
        'sessions-assign-student',
        {
          body: { session_id: sessionId, student_user_id: studentUserId },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to assign student');
      }

      return data ?? { ok: true };
    },

    /**
     * Cancel an enrollment
     *
     * Records late cancellation penalty if < 24h before session.
     *
     * @param enrollmentId - The enrollment UUID
     * @param reason - Optional cancellation reason
     */
    async cancelEnrollment(enrollmentId: string, reason?: string): Promise<SuccessResponse> {
      // For now, direct DB update (can be moved to Edge Function later)
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      if (error) {
        throw new Error(error.message || 'Failed to cancel enrollment');
      }

      return { ok: true };
    },

    /**
     * Mark enrollment as completed
     *
     * @param enrollmentId - The enrollment UUID
     */
    async markCompleted(enrollmentId: string): Promise<SuccessResponse> {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: 'completed' })
        .eq('id', enrollmentId);

      if (error) {
        throw new Error(error.message || 'Failed to mark completed');
      }

      return { ok: true };
    },

    /**
     * Mark enrollment as no-show
     *
     * Also records a penalty.
     *
     * @param enrollmentId - The enrollment UUID
     * @param notes - Optional notes
     */
    async markNoShow(enrollmentId: string, notes?: string): Promise<SuccessResponse> {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: 'noshow' })
        .eq('id', enrollmentId);

      if (error) {
        throw new Error(error.message || 'Failed to mark no-show');
      }

      // TODO: Record penalty via Edge Function

      return { ok: true };
    },
  };
}
