import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedPressable } from '../../src/components/ui';

type Message = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender: {
    full_name: string | null;
    role: string;
  } | null;
};

type Conversation = {
  id: string;
  created_at: string;
};

export default function MessagesScreen() {
  const { user, student } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchOrCreateConversation = useCallback(async () => {
    if (!user?.id || !student?.site_id) return;

    try {
      const { data: existingConversations, error: convError } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('site_id', student.site_id)
        .eq('student_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (convError) throw convError;

      let conversationId: string;

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
        setConversation(existingConversations[0] as Conversation);
      } else {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            site_id: student.site_id,
            student_user_id: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;
        setConversation(newConv as Conversation);
      }

      await fetchMessages(conversationId);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, student?.site_id]);

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_user_id,
        body,
        created_at,
        sender:profiles!messages_sender_user_id_fkey(full_name, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as unknown as Message[]);
    }
  };

  useEffect(() => {
    fetchOrCreateConversation();
  }, [fetchOrCreateConversation]);

  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_user_id,
              body,
              created_at,
              sender:profiles!messages_sender_user_id_fkey(full_name, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as unknown as Message]);
            // Haptic feedback for new message from others
            if (data.sender_user_id !== user?.id) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation?.id || !user?.id || !student?.site_id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        site_id: student.site_id,
        conversation_id: conversation.id,
        sender_user_id: user.id,
        body: messageText,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending message:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0a1628', '#0f1f35']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <BlurView intensity={30} tint="dark" style={styles.header}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.headerTitle}>Messages</Text>
                  <Text style={styles.headerSubtitle}>Échangez avec l'école</Text>
                </View>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>En ligne</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Messages list */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
                <BlurView intensity={20} tint="dark" style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateIcon}>💬</Text>
                  <Text style={styles.emptyStateTitle}>Aucun message</Text>
                  <Text style={styles.emptyStateDescription}>
                    Envoyez un message pour commencer la conversation avec l'école
                  </Text>
                </BlurView>
              </Animated.View>
            ) : (
              <View style={styles.messagesContainer}>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_user_id === user?.id}
                    delay={index < 10 ? index * 50 : 0}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <Animated.View entering={FadeInUp.duration(600)}>
            <BlurView intensity={40} tint="dark" style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Votre message..."
                  multiline
                  maxLength={1000}
                  editable={!sending}
                  style={styles.textInput}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
                <AnimatedPressable
                  onPress={handleSend}
                  disabled={!newMessage.trim() || sending}
                  hapticStyle="medium"
                >
                  <LinearGradient
                    colors={
                      !newMessage.trim() || sending
                        ? ['rgba(107,114,128,0.3)', 'rgba(75,85,99,0.3)']
                        : ['#0ea5e9', '#0284c7']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButton}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.sendIcon}>➤</Text>
                    )}
                  </LinearGradient>
                </AnimatedPressable>
              </View>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
  delay = 0,
}: {
  message: Message;
  isOwnMessage: boolean;
  delay?: number;
}) {
  const date = new Date(message.created_at);
  const timeString = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      entering={isOwnMessage ? FadeInDown.delay(delay).springify() : FadeInDown.delay(delay).springify()}
      style={[
        styles.messageBubbleContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {isOwnMessage ? (
        <LinearGradient
          colors={['#0ea5e9', '#0284c7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, styles.ownMessageBubble]}
        >
          <Text style={styles.ownMessageText}>{message.body}</Text>
          <Text style={styles.ownMessageTime}>{timeString}</Text>
        </LinearGradient>
      ) : (
        <BlurView intensity={20} tint="dark" style={[styles.messageBubble, styles.otherMessageBubble]}>
          {message.sender?.full_name && (
            <View style={styles.senderInfo}>
              <Text style={styles.senderName}>{message.sender.full_name}</Text>
              {message.sender.role !== 'student' && (
                <View style={styles.schoolBadge}>
                  <Text style={styles.schoolBadgeText}>École</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.otherMessageText}>{message.body}</Text>
          <Text style={styles.otherMessageTime}>{timeString}</Text>
        </BlurView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  glowTop: {
    top: 50,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: '#8b5cf6',
  },
  glowBottom: {
    bottom: 150,
    left: -100,
    width: 280,
    height: 280,
    backgroundColor: '#0ea5e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messagesContainer: {
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 14,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  schoolBadge: {
    backgroundColor: 'rgba(14,165,233,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  schoolBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  ownMessageText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 21,
  },
  otherMessageText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 21,
  },
  ownMessageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'right',
  },
  otherMessageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100, // Space for floating tab bar
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#ffffff',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
});
