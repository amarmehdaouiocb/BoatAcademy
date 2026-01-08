import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_read: boolean;
  sender: {
    full_name: string | null;
    role: string;
  } | null;
};

type Thread = {
  id: string;
  subject: string;
  created_at: string;
  messages: Message[];
};

export default function MessagesScreen() {
  const { user, student } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchOrCreateThread = useCallback(async () => {
    if (!user?.id || !student?.site_id) return;

    try {
      // Try to find existing thread for this student
      const { data: existingThreads, error: threadError } = await supabase
        .from('message_threads')
        .select('id, subject, created_at')
        .eq('site_id', student.site_id)
        .eq('student_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (threadError) throw threadError;

      let threadId: string;

      if (existingThreads && existingThreads.length > 0) {
        // Use existing thread
        threadId = existingThreads[0].id;
        setThread(existingThreads[0] as Thread);
      } else {
        // Create new thread
        const { data: newThread, error: createError } = await supabase
          .from('message_threads')
          .insert({
            site_id: student.site_id,
            student_user_id: user.id,
            subject: 'Conversation avec l\'ecole',
          })
          .select()
          .single();

        if (createError) throw createError;
        threadId = newThread.id;
        setThread(newThread as Thread);
      }

      // Fetch messages for this thread
      await fetchMessages(threadId);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, student?.site_id]);

  const fetchMessages = async (threadId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        thread_id,
        sender_id,
        body,
        created_at,
        is_read,
        sender:profiles!messages_sender_id_fkey(full_name, role)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as Message[]);

      // Mark unread messages as read
      const unreadIds = data
        ?.filter((m) => !m.is_read && m.sender_id !== user?.id)
        .map((m) => m.id);

      if (unreadIds && unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }
  };

  useEffect(() => {
    fetchOrCreateThread();
  }, [fetchOrCreateThread]);

  // Subscribe to new messages
  useEffect(() => {
    if (!thread?.id) return;

    const channel = supabase
      .channel(`messages:${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        async (payload) => {
          // Fetch the new message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              thread_id,
              sender_id,
              body,
              created_at,
              is_read,
              sender:profiles!messages_sender_id_fkey(full_name, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as Message]);

            // Mark as read if not from current user
            if (data.sender_id !== user?.id) {
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', data.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread?.id, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !thread?.id || !user?.id) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        thread_id: thread.id,
        sender_id: user.id,
        body: messageText,
        is_read: false,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="border-b border-gray-200 bg-white px-6 py-4">
            <Text className="text-xl font-bold text-gray-900">Messages</Text>
            <Text className="mt-1 text-sm text-gray-600">Echangez avec l'ecole</Text>
          </View>

          {/* Messages list */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-4"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-5xl">💬</Text>
                <Text className="mt-4 text-lg font-semibold text-gray-900">Aucun message</Text>
                <Text className="mt-2 text-center text-gray-600">
                  Envoyez un message pour commencer la conversation
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_id === user?.id}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View className="border-t border-gray-200 bg-white px-4 py-3">
            <View className="flex-row items-end space-x-3">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Votre message..."
                multiline
                maxLength={1000}
                editable={!sending}
                className="max-h-24 flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <Pressable
                onPress={handleSend}
                disabled={!newMessage.trim() || sending}
                className={`h-12 w-12 items-center justify-center rounded-full ${
                  !newMessage.trim() || sending ? 'bg-gray-300' : 'bg-navy-600'
                }`}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-xl text-white">➤</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: Message;
  isOwnMessage: boolean;
}) {
  const date = new Date(message.created_at);
  const timeString = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isOwnMessage ? 'rounded-br-md bg-navy-600' : 'rounded-bl-md bg-white'
        }`}
      >
        {!isOwnMessage && message.sender?.full_name && (
          <Text className="mb-1 text-xs font-medium text-navy-600">
            {message.sender.full_name}
            {message.sender.role !== 'student' && (
              <Text className="text-gray-400"> • Ecole</Text>
            )}
          </Text>
        )}
        <Text className={`text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
          {message.body}
        </Text>
        <Text
          className={`mt-1 text-xs ${isOwnMessage ? 'text-navy-200' : 'text-gray-400'}`}
        >
          {timeString}
        </Text>
      </View>
    </View>
  );
}
