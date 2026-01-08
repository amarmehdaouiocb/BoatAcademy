import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@boatacademy/shared';
import type { SuccessResponse, PushResponse } from '../types';

/**
 * Push Notifications API module
 */
export function createPushClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Register a push token for the current user
     *
     * @param token - The Expo push token
     * @param platform - 'ios', 'android', or 'web'
     * @param deviceId - Optional device identifier for token management
     *
     * @example
     * ```typescript
     * const token = await Notifications.getExpoPushTokenAsync();
     * await api.push.registerToken(token.data, Platform.OS);
     * ```
     */
    async registerToken(
      token: string,
      platform: 'ios' | 'android' | 'web',
      deviceId?: string
    ): Promise<SuccessResponse> {
      const { data, error } = await supabase.functions.invoke<SuccessResponse>(
        'push-register-token',
        {
          body: { token, platform, deviceId },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to register push token');
      }

      return data ?? { ok: true };
    },

    /**
     * Unregister a push token
     *
     * Call this when user logs out.
     *
     * @param token - The push token to remove
     */
    async unregisterToken(token: string): Promise<SuccessResponse> {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('token', token);

      if (error) {
        throw new Error(error.message || 'Failed to unregister push token');
      }

      return { ok: true };
    },

    /**
     * Send push notifications to multiple users (admin/manager only)
     *
     * @param userIds - Array of user UUIDs to send to
     * @param title - Notification title
     * @param body - Notification body
     * @param data - Optional data payload
     */
    async sendToUsers(
      userIds: string[],
      title: string,
      body: string,
      data?: Record<string, unknown>
    ): Promise<PushResponse> {
      const { data: response, error } = await supabase.functions.invoke<PushResponse>('push-send', {
        body: { userIds, title, body, data },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send push');
      }

      return response ?? { ok: true, sent: 0 };
    },
  };
}
