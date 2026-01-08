'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Message = {
  id: string;
  body: string;
  created_at: string;
  sender_user_id: string;
  sender: {
    full_name: string | null;
    role: string;
  } | null;
};

type ConversationInfo = {
  id: string;
  student: {
    user_id: string;
    profile: { full_name: string | null } | null;
  } | null;
  site: {
    name: string;
    id: string;
  } | null;
};

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const supabase = createClient();

  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    subscribeToMessages();

    return () => {
      supabase.channel(`messages:${conversationId}`).unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchData() {
    setLoading(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    // Fetch conversation info
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        student:students!inner(
          user_id,
          profile:profiles!inner(full_name)
        ),
        site:sites(id, name)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !convData) {
      console.error('Error fetching conversation:', convError);
      setLoading(false);
      return;
    }

    setConversation(convData as ConversationInfo);

    // Fetch messages
    const { data: messagesData } = await supabase
      .from('messages')
      .select(`
        id,
        body,
        created_at,
        sender_user_id,
        sender:profiles!messages_sender_user_id_fkey(full_name, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages((messagesData || []) as Message[]);
    setLoading(false);
  }

  function subscribeToMessages() {
    supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: newMsg } = await supabase
            .from('messages')
            .select(`
              id,
              body,
              created_at,
              sender_user_id,
              sender:profiles!messages_sender_user_id_fkey(full_name, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg as Message]);
          }
        }
      )
      .subscribe();
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !currentUserId) return;

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        site_id: conversation.site?.id || '',
        sender_user_id: currentUserId,
        body: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';

  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      const lastGroup = groupedMessages[groupedMessages.length - 1];
      if (lastGroup) {
        lastGroup.messages.push(msg);
      }
    }
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-navy-500">Conversation non trouvee</p>
        <Link href="/dashboard/messages" className="mt-4">
          <Button variant="outline">Retour aux messages</Button>
        </Link>
      </div>
    );
  }

  const studentName = conversation.student?.profile?.full_name || 'Stagiaire';

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-navy-100 pb-4">
        <Link
          href="/dashboard/messages"
          className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
            {studentName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-navy-900">{studentName}</h1>
            <p className="text-sm text-navy-500">{conversation.site?.name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {groupedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-navy-400">Aucun message</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="rounded-full bg-navy-100 px-3 py-1 text-xs text-navy-500">
                  {formatDate(group.date)}
                </div>
              </div>

              {/* Messages in this group */}
              {group.messages.map((msg) => {
                const isOwnMessage = msg.sender_user_id === currentUserId;
                const isStaff =
                  msg.sender?.role === 'admin' ||
                  msg.sender?.role === 'manager' ||
                  msg.sender?.role === 'instructor';

                return (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-navy-600 text-white'
                          : isStaff
                            ? 'bg-success-100 text-success-900'
                            : 'bg-navy-100 text-navy-900'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs font-medium opacity-70 mb-1">
                          {msg.sender?.full_name || 'Inconnu'}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-navy-200' : 'opacity-50'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 border-t border-navy-100 pt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ecrivez votre message..."
          className="flex-1 rounded-full border border-navy-200 px-4 py-3 text-navy-900 placeholder-navy-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        />
        <Button
          type="submit"
          icon={Send}
          loading={sending}
          disabled={!newMessage.trim()}
          className="rounded-full"
        >
          Envoyer
        </Button>
      </form>
    </div>
  );
}
