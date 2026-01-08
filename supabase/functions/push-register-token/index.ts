import { getAuthedUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface RegisterTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate user
    const { user } = await getAuthedUser(req);
    const admin = supabaseAdmin();

    // Parse request body
    const body: RegisterTokenRequest = await req.json();
    const { token, platform, deviceId } = body;

    if (!token || !platform) {
      return errorResponse('Missing required fields: token, platform');
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return errorResponse('Invalid platform. Must be "ios", "android", or "web"');
    }

    // Check if token already exists
    const { data: existingToken } = await admin
      .from('device_tokens')
      .select('id, user_id')
      .eq('token', token)
      .single();

    if (existingToken) {
      if (existingToken.user_id === user.id) {
        // Token already registered for this user, just update
        await admin
          .from('device_tokens')
          .update({
            platform,
            device_id: deviceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        return jsonResponse({
          message: 'Token updated successfully',
          tokenId: existingToken.id,
        });
      } else {
        // Token registered to different user - reassign
        await admin
          .from('device_tokens')
          .update({
            user_id: user.id,
            platform,
            device_id: deviceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        return jsonResponse({
          message: 'Token reassigned successfully',
          tokenId: existingToken.id,
        });
      }
    }

    // If deviceId provided, remove old tokens for same device
    if (deviceId) {
      await admin
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('device_id', deviceId);
    }

    // Create new token
    const { data: newToken, error: insertError } = await admin
      .from('device_tokens')
      .insert({
        user_id: user.id,
        token,
        platform,
        device_id: deviceId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to register token:', insertError);
      return errorResponse('Failed to register token', 500);
    }

    return jsonResponse({
      message: 'Token registered successfully',
      tokenId: newToken.id,
    });
  } catch (error) {
    console.error('Token registration error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }

    return errorResponse('Internal server error', 500);
  }
});
