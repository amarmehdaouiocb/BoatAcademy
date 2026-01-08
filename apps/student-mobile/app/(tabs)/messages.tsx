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
      // Try to find existing conversation for this student
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
        // Use existing conversation
        conversationId = existingConversations[0].id;
        setConversation(existingConversations[0] as Conversation);
      } else {
        // Create new conversation
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

      // Fetch messages for this conversation
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

  // Subscribe to new messages
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
          // Fetch the new message with sender info
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation?.id || !user?.id || !student?.site_id) return;

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
            <Text className="mt-1 text-sm text-gray-600">Échangez avec l'école</Text>
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
                    isOwnMessage={message.sender_user_id === user?.id}
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
              <Text className="text-gray-400"> • École</Text>
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
