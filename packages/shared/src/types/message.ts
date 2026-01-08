/**
 * Notification type
 */
export type NotificationType = 'message' | 'system';

/**
 * Conversation (student <-> managers)
 */
export interface Conversation {
  id: string;
  site_id: string;
  student_user_id: string;
  created_at: string;
}

/**
 * Message in a conversation
 */
export interface Message {
  id: string;
  site_id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
}

/**
 * In-app notification
 */
export interface Notification {
  id: string;
  user_id: string;
  site_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Device token for push notifications
 */
export interface DeviceToken {
  id: string;
  user_id: string;
  platform: 'ios' | 'android';
  expo_push_token: string;
  created_at: string;
  updated_at: string;
}

/**
 * Message with sender info
 */
export interface MessageWithSender extends Message {
  sender: {
    full_name: string | null;
    role: string;
  };
}

/**
 * Conversation with last message
 */
export interface ConversationWithLastMessage extends Conversation {
  last_message: Message | null;
  unread_count: number;
}
