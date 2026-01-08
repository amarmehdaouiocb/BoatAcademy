import { getAuthedUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushSendRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate user (must be admin or manager)
    const { user } = await getAuthedUser(req);
    const admin = supabaseAdmin();

    // Check if user is admin or manager
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return errorResponse('Only admin and manager can send push notifications', 403);
    }

    // Parse request body
    const body: PushSendRequest = await req.json();
    const { userIds, title, body: messageBody, data } = body;

    if (!userIds || userIds.length === 0) {
      return errorResponse('userIds array is required');
    }

    if (!title || !messageBody) {
      return errorResponse('title and body are required');
    }

    // Get device tokens for all users
    const { data: tokens, error: tokensError } = await admin
      .from('device_tokens')
      .select('token, user_id, platform')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('Failed to fetch tokens:', tokensError);
      return errorResponse('Failed to fetch device tokens', 500);
    }

    if (!tokens || tokens.length === 0) {
      return jsonResponse({
        message: 'No device tokens found for specified users',
        sent: 0,
        failed: 0,
      });
    }

    // Filter Expo tokens (start with ExponentPushToken)
    const expoTokens = tokens.filter(t =>
      t.token.startsWith('ExponentPushToken') || t.token.startsWith('expo')
    );

    if (expoTokens.length === 0) {
      return jsonResponse({
        message: 'No Expo push tokens found',
        sent: 0,
        failed: 0,
      });
    }

    // Prepare messages
    const messages: ExpoPushMessage[] = expoTokens.map(t => ({
      to: t.token,
      title,
      body: messageBody,
      data,
      sound: 'default',
      channelId: 'default',
    }));

    // Send to Expo Push API
    const result = await sendExpoPushNotifications(messages);

    // Log the notification send
    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'push_notification_sent',
      table_name: 'device_tokens',
      new_data: {
        user_count: userIds.length,
        token_count: expoTokens.length,
        title,
        body: messageBody,
      },
    });

    return jsonResponse({
      message: 'Push notifications sent',
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Push send error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }

    return errorResponse('Internal server error', 500);
  }
});

/**
 * Send push notifications via Expo Push API
 */
async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  try {
    // Expo recommends batching in chunks of 100
    const chunks = chunkArray(messages, 100);

    for (const chunk of chunks) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text();
        errors.push(`Expo API error: ${response.status} - ${errorText}`);
        failed += chunk.length;
        continue;
      }

      const result = await response.json();

      // Process results
      if (result.data) {
        for (const item of result.data) {
          if (item.status === 'ok') {
            sent++;
          } else {
            failed++;
            if (item.message) {
              errors.push(item.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Expo push error:', error);
    errors.push(`Network error: ${error}`);
    failed = messages.length;
  }

  return { sent, failed, errors };
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
