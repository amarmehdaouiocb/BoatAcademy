'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ConversationWithDetails = {
  id: string;
  created_at: string;
  student: {
    user_id: string;
    profile: { full_name: string | null } | null;
  } | null;
  site: {
    name: string;
  } | null;
  last_message: {
    body: string;
    created_at: string;
    sender: { full_name: string | null } | null;
  } | null;
};

export default function MessagesPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    setLoading(true);

    // Fetch conversations with student info
    const { data: conversationsData, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        student:students!inner(
          user_id,
          profile:profiles!inner(full_name)
        ),
        site:sites(name)
      `)
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      setLoading(false);
      return;
    }

    // Fetch last message for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversationsData || []).map(async (conv) => {
        const { data: messageData } = await supabase
          .from('messages')
          .select(`
            body,
            created_at,
            sender:profiles!messages_sender_user_id_fkey(full_name)
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          last_message: messageData as ConversationWithDetails['last_message'],
        };
      })
    );

    // Sort by last message date
    conversationsWithMessages.sort((a, b) => {
      const dateA = a.last_message?.created_at || a.created_at;
      const dateB = b.last_message?.created_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    setConversations(conversationsWithMessages as ConversationWithDetails[]);
    setLoading(false);
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const studentName = conv.student?.profile?.full_name?.toLowerCase() || '';
    return studentName.includes(search.toLowerCase());
  });

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Messages</h1>
        <p className="mt-1 text-navy-500">
          {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un stagiaire..."
          className="pl-10"
        />
      </div>

      {/* Conversations list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-navy-300" />
            <p className="mt-4 text-navy-500">
              {search ? 'Aucune conversation trouvee' : 'Aucune conversation'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-navy-100 rounded-xl border border-navy-200 bg-white overflow-hidden">
          {filteredConversations.map((conv) => {
            const studentName = conv.student?.profile?.full_name || 'Stagiaire';
            const initials = studentName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={conv.id}
                href={`/dashboard/messages/${conv.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-navy-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-navy-900 truncate">
                      {studentName}
                    </h3>
                    <span className="text-xs text-navy-400 whitespace-nowrap">
                      {conv.last_message
                        ? formatDate(conv.last_message.created_at)
                        : formatDate(conv.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-navy-500 truncate">
                    {conv.last_message ? (
                      <>
                        <span className="font-medium">
                          {conv.last_message.sender?.full_name?.split(' ')[0] || 'Vous'}:
                        </span>{' '}
                        {conv.last_message.body}
                      </>
                    ) : (
                      'Nouvelle conversation'
                    )}
                  </p>
                  <p className="text-xs text-navy-400">{conv.site?.name}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
