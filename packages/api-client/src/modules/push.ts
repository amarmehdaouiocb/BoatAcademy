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
     * @param platform - 'ios' or 'android'
     * @param expoPushToken - The Expo push token
     *
     * @example
     * ```typescript
     * const token = await Notifications.getExpoPushTokenAsync();
     * await api.push.registerToken(Platform.OS, token.data);
     * ```
     */
    async registerToken(
      platform: 'ios' | 'android',
      expoPushToken: string
    ): Promise<SuccessResponse> {
      const { data, error } = await supabase.functions.invoke<SuccessResponse>(
        'push-register-token',
        {
          body: { platform, expo_push_token: expoPushToken },
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
     * @param expoPushToken - The Expo push token to remove
     */
    async unregisterToken(expoPushToken: string): Promise<SuccessResponse> {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('expo_push_token', expoPushToken);

      if (error) {
        throw new Error(error.message || 'Failed to unregister push token');
      }

      return { ok: true };
    },

    /**
     * Send a push notification to a user (internal/admin use)
     *
     * @param userId - The user UUID to send to
     * @param title - Notification title
     * @param body - Notification body
     * @param data - Optional data payload
     */
    async sendToUser(
      userId: string,
      title: string,
      body: string,
      data?: Record<string, unknown>
    ): Promise<PushResponse> {
      const { data: response, error } = await supabase.functions.invoke<PushResponse>('push-send', {
        body: { user_id: userId, title, body, data },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send push');
      }

      return response ?? { ok: true, sent: 0 };
    },
  };
}
