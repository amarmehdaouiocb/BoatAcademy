import { getAuthedUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface SendMessageRequest {
  conversationId?: string; // Existing conversation
  recipientUserId?: string; // For new conversation (student -> site)
  siteId?: string; // For new conversation
  content: string;
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
    const body: SendMessageRequest = await req.json();
    const { conversationId, recipientUserId, siteId, content } = body;

    if (!content || content.trim().length === 0) {
      return errorResponse('Message content is required');
    }

    if (content.length > 5000) {
      return errorResponse('Message too long (max 5000 characters)');
    }

    let targetConversationId = conversationId;
    let targetSiteId = siteId;

    // Get user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const userRole = profile?.role || 'student';

    // If no conversation ID, create new conversation
    if (!targetConversationId) {
      if (userRole === 'student') {
        // Student creating conversation - need site from their student record
        if (!targetSiteId) {
          const { data: student } = await admin
            .from('students')
            .select('site_id')
            .eq('user_id', user.id)
            .single();

          if (!student) {
            return errorResponse('Student record not found');
          }
          targetSiteId = student.site_id;
        }

        // Create conversation
        const { data: conversation, error: convError } = await admin
          .from('conversations')
          .insert({
            student_user_id: user.id,
            site_id: targetSiteId,
            subject: 'Nouvelle conversation',
          })
          .select()
          .single();

        if (convError) {
          console.error('Failed to create conversation:', convError);
          return errorResponse('Failed to create conversation', 500);
        }

        targetConversationId = conversation.id;
      } else {
        // Manager/admin creating conversation with a student
        if (!recipientUserId || !targetSiteId) {
          return errorResponse('recipientUserId and siteId required for new conversation');
        }

        // Check if conversation already exists
        const { data: existingConv } = await admin
          .from('conversations')
          .select('id')
          .eq('student_user_id', recipientUserId)
          .eq('site_id', targetSiteId)
          .single();

        if (existingConv) {
          targetConversationId = existingConv.id;
        } else {
          // Create new conversation
          const { data: conversation, error: convError } = await admin
            .from('conversations')
            .insert({
              student_user_id: recipientUserId,
              site_id: targetSiteId,
              subject: 'Message de l\'equipe',
            })
            .select()
            .single();

          if (convError) {
            console.error('Failed to create conversation:', convError);
            return errorResponse('Failed to create conversation', 500);
          }

          targetConversationId = conversation.id;
        }
      }
    }

    // Verify user has access to conversation
    const { data: conversation, error: convError } = await admin
      .from('conversations')
      .select('student_user_id, site_id')
      .eq('id', targetConversationId)
      .single();

    if (convError || !conversation) {
      return errorResponse('Conversation not found', 404);
    }

    // Check access
    if (userRole === 'student' && conversation.student_user_id !== user.id) {
      return errorResponse('No access to this conversation', 403);
    }

    if (['manager', 'instructor'].includes(userRole)) {
      const { data: siteAccess } = await admin
        .from('profile_sites')
        .select('id')
        .eq('user_id', user.id)
        .eq('site_id', conversation.site_id)
        .single();

      if (!siteAccess) {
        return errorResponse('No access to this site', 403);
      }
    }

    // Create message
    const { data: message, error: msgError } = await admin
      .from('messages')
      .insert({
        conversation_id: targetConversationId,
        sender_user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Failed to send message:', msgError);
      return errorResponse('Failed to send message', 500);
    }

    // Update conversation last_message_at
    await admin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', targetConversationId);

    // Determine recipient for notification
    const recipientId = userRole === 'student'
      ? null // Manager/admin will see unread count
      : conversation.student_user_id;

    // Create notification for recipient
    if (recipientId) {
      const senderName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : 'Boat Academy';

      await admin.from('notifications').insert({
        user_id: recipientId,
        type: 'new_message',
        title: 'Nouveau message',
        body: `${senderName}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        data: { conversation_id: targetConversationId, message_id: message.id },
      });

      // Trigger push notification (will be handled by push-send)
      await triggerPushNotification(admin, recipientId, {
        title: 'Nouveau message',
        body: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: { conversation_id: targetConversationId },
      });
    }

    return jsonResponse({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Message send error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }

    return errorResponse('Internal server error', 500);
  }
});

/**
 * Trigger push notification to user
 */
async function triggerPushNotification(
  admin: ReturnType<typeof supabaseAdmin>,
  userId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    // Get user's device tokens
    const { data: tokens } = await admin
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId);

    if (!tokens || tokens.length === 0) {
      return;
    }

    // Queue push notifications (would normally call push-send or external service)
    // For now, we just log it - actual sending will be handled by push-send function
    console.log(`Push notification queued for user ${userId}:`, notification);
  } catch (error) {
    console.error('Failed to trigger push notification:', error);
  }
}
