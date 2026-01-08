import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@boatacademy/shared';
import type { MessageResponse, SuccessResponse } from '../types';

/**
 * Messages / Conversations API module
 */
export function createMessagesClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Send a message in a conversation
     *
     * Creates in-app notifications for recipients.
     *
     * @param conversationId - The conversation UUID
     * @param body - The message text
     *
     * @example
     * ```typescript
     * await api.messages.send(conversationId, 'Bonjour !');
     * ```
     */
    async send(conversationId: string, body: string): Promise<MessageResponse> {
      const { data, error } = await supabase.functions.invoke<MessageResponse>('messages-send', {
        body: { conversation_id: conversationId, body },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send message');
      }

      return data ?? { ok: true, message: { id: '', created_at: '' } };
    },

    /**
     * Get or create a conversation for a student
     *
     * Students have one conversation per site.
     *
     * @param siteId - The site UUID
     * @param studentUserId - The student's user UUID
     * @returns The conversation
     */
    async getOrCreateConversation(
      siteId: string,
      studentUserId: string
    ): Promise<{ id: string; created: boolean }> {
      // Try to find existing
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('site_id', siteId)
        .eq('student_user_id', studentUserId)
        .single();

      if (existing) {
        return { id: existing.id, created: false };
      }

      // Create new
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          site_id: siteId,
          student_user_id: studentUserId,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create conversation');
      }

      return { id: newConvo.id, created: true };
    },

    /**
     * Mark notifications as read
     *
     * @param notificationIds - Array of notification UUIDs
     */
    async markNotificationsRead(notificationIds: string[]): Promise<SuccessResponse> {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (error) {
        throw new Error(error.message || 'Failed to mark notifications read');
      }

      return { ok: true };
    },

    /**
     * Mark all notifications as read for a user
     *
     * @param userId - The user UUID
     */
    async markAllNotificationsRead(userId: string): Promise<SuccessResponse> {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        throw new Error(error.message || 'Failed to mark all notifications read');
      }

      return { ok: true };
    },
  };
}
