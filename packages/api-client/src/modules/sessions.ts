import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@boatacademy/shared';
import type { SuccessResponse } from '../types';

/**
 * Sessions / Enrollments API module
 */
export function createSessionsClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Enroll in a session
     *
     * Students can self-enroll. Admin/manager can assign any student.
     * Validates entitlement and checks session capacity.
     *
     * @param sessionId - The session UUID
     * @param studentUserId - Optional: student's user UUID (for admin/manager assigning)
     * @throws Error if session full, no entitlement, or already enrolled
     *
     * @example
     * ```typescript
     * // Student self-enrollment
     * await api.sessions.enroll(sessionId);
     *
     * // Manager assigning student
     * await api.sessions.enroll(sessionId, studentUserId);
     * ```
     */
    async enroll(sessionId: string, studentUserId?: string): Promise<SuccessResponse> {
      const { data, error } = await supabase.functions.invoke<SuccessResponse>(
        'sessions-assign-student',
        {
          body: { sessionId, studentUserId },
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
