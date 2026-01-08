'use client';

import { useEffect, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';

type SessionWithDetails = {
  id: string;
  type: 'theory' | 'practice';
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string | null;
  site: {
    name: string;
  } | null;
  instructor: {
    full_name: string | null;
  } | null;
  enrollments: { id: string }[];
};

export default function SessionsPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        type,
        starts_at,
        ends_at,
        capacity,
        location,
        site:sites(name),
        instructor:profiles!sessions_instructor_user_id_fkey(full_name),
        enrollments(id)
      `)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data as SessionWithDetails[]);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Sessions</h1>
          <p className="mt-1 text-navy-500">
            Gerez les sessions de formation ({sessions.length} session{sessions.length > 1 ? 's' : ''} a venir)
          </p>
        </div>
        <Link href="/dashboard/sessions/new">
          <Button icon={Plus}>Creer une session</Button>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-navy-300" />
            <p className="mt-4 text-navy-500">Aucune session planifiee</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-navy-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Moniteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Places
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Lieu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {sessions.map((session) => {
                const date = new Date(session.starts_at);
                const enrolled = session.enrollments?.length || 0;
                const remaining = session.capacity - enrolled;

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-navy-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/sessions/${session.id}`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/sessions/${session.id}`}
                        className="font-medium text-navy-900 hover:text-navy-700"
                      >
                        {session.type === 'theory' ? 'Theorie' : 'Pratique'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-navy-900">
                        {date.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="ml-2 text-sm text-navy-500">
                        {date.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-navy-600">
                      {session.site?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-navy-600">
                      {session.instructor?.full_name || 'Non assigne'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${remaining > 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {enrolled}/{session.capacity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-500">
                      {session.location || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status="confirmed" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
