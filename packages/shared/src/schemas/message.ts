import { z } from 'zod';

/**
 * Send message schema
 */
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Conversation invalide'),
  body: z.string().min(1, 'Message requis').max(5000, 'Message trop long (max 5000 caracteres)'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Create conversation schema (for new student)
 */
export const createConversationSchema = z.object({
  siteId: z.string().uuid('Site invalide'),
  studentUserId: z.string().uuid('Stagiaire invalide'),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

/**
 * Register push token schema
 */
export const registerPushTokenSchema = z.object({
  platform: z.enum(['ios', 'android']),
  expoPushToken: z.string().min(1, 'Token requis'),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

/**
 * Send push notification schema (internal)
 */
export const sendPushSchema = z.object({
  userId: z.string().uuid('Utilisateur invalide'),
  title: z.string().min(1, 'Titre requis'),
  body: z.string().min(1, 'Corps requis'),
  data: z.record(z.unknown()).optional(),
});

export type SendPushInput = z.infer<typeof sendPushSchema>;
