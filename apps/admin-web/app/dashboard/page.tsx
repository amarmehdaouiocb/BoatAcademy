import { Users, Calendar, FileText, Bell, Plus, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import type { Profile, UserRole } from '@/lib/supabase/types';

// Types for joined queries
type StudentWithProfile = {
  user_id: string;
  created_at: string;
  profile: { full_name: string | null } | null;
};

type SessionWithSite = {
  id: string;
  starts_at: string;
  type: 'theory' | 'practice';
  site: { name: string } | null;
};

type ProfileForDashboard = Pick<Profile, 'role' | 'primary_site_id'>;

async function getDashboardStats() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile with explicit type
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, primary_site_id')
    .eq('user_id', user.id)
    .single<ProfileForDashboard>();

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const siteId = profile.primary_site_id;

  // Parallel queries for stats
  const [
    studentsResult,
    sessionsResult,
    documentsResult,
    notificationsResult,
    recentStudentsResult,
    upcomingSessionsResult,
  ] = await Promise.all([
    // Active students count
    isAdmin
      ? supabase.from('students').select('user_id', { count: 'exact', head: true })
      : supabase
          .from('students')
          .select('user_id', { count: 'exact', head: true })
          .eq('site_id', siteId!),

    // Upcoming sessions count (next 7 days)
    isAdmin
      ? supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .gte('starts_at', new Date().toISOString())
          .lte('starts_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      : supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId!)
          .gte('starts_at', new Date().toISOString())
          .lte('starts_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),

    // Pending documents count
    isAdmin
      ? supabase
          .from('student_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
      : supabase
          .from('student_documents')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId!)
          .eq('status', 'pending'),

    // Unread notifications count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),

    // Recent students (last 5) - join students with profiles
    isAdmin
      ? supabase
          .from('students')
          .select('user_id, created_at, profile:profiles!inner(full_name)')
          .order('created_at', { ascending: false })
          .limit(5)
      : supabase
          .from('students')
          .select('user_id, created_at, profile:profiles!inner(full_name)')
          .eq('site_id', siteId!)
          .order('created_at', { ascending: false })
          .limit(5),

    // Upcoming sessions (next 5)
    isAdmin
      ? supabase
          .from('sessions')
          .select('id, starts_at, type, site:sites(name)')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5)
      : supabase
          .from('sessions')
          .select('id, starts_at, type, site:sites(name)')
          .eq('site_id', siteId!)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5),
  ]);

  return {
    stats: {
      students: studentsResult.count || 0,
      sessions: sessionsResult.count || 0,
      documents: documentsResult.count || 0,
      notifications: notificationsResult.count || 0,
    },
    recentStudents: (recentStudentsResult.data || []) as StudentWithProfile[],
    upcomingSessions: (upcomingSessionsResult.data || []) as SessionWithSite[],
    role: profile.role as UserRole,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardStats();

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-navy-500">Erreur de chargement des donnees</p>
      </div>
    );
  }

  const { stats, recentStudents, upcomingSessions, role } = data;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Tableau de bord</h1>
        <p className="mt-1 text-navy-500">Vue d&apos;ensemble de votre activite</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Stagiaires actifs"
          value={stats.students}
          icon={Users}
          iconColor="navy"
        />
        <StatCard
          title="Sessions a venir"
          value={stats.sessions}
          icon={Calendar}
          iconColor="success"
        />
        <StatCard
          title="Documents en attente"
          value={stats.documents}
          icon={FileText}
          iconColor="warning"
        />
        <StatCard
          title="Notifications"
          value={stats.notifications}
          icon={Bell}
          iconColor="error"
        />
      </div>

      {/* Quick actions */}
      {(role === 'admin' || role === 'manager') && (
        <Card>
          <CardHeader title="Actions rapides" />
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/students/new">
                <Button icon={Plus}>Ajouter un stagiaire</Button>
              </Link>
              <Link href="/dashboard/sessions/new">
                <Button variant="secondary" icon={Plus}>
                  Creer une session
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button variant="outline" icon={CheckCircle}>
                  Valider des documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two column layout for lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent students */}
        <Card padding="none">
          <div className="border-b border-navy-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy-900">Derniers stagiaires</h3>
              <Link
                href="/dashboard/students"
                className="text-sm font-medium text-navy-600 hover:text-navy-800"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="divide-y divide-navy-100">
            {recentStudents.length === 0 ? (
              <div className="px-6 py-8 text-center text-navy-500">
                Aucun stagiaire inscrit
              </div>
            ) : (
              recentStudents.map((student) => {
                const fullName = student.profile?.full_name || 'Sans nom';
                const initials = fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    key={student.user_id}
                    href={`/dashboard/students/${student.user_id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-navy-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{fullName}</p>
                        <p className="text-sm text-navy-500">
                          Inscrit le{' '}
                          {new Date(student.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Upcoming sessions */}
        <Card padding="none">
          <div className="border-b border-navy-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy-900">Prochaines sessions</h3>
              <Link
                href="/dashboard/sessions"
                className="text-sm font-medium text-navy-600 hover:text-navy-800"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="divide-y divide-navy-100">
            {upcomingSessions.length === 0 ? (
              <div className="px-6 py-8 text-center text-navy-500">
                Aucune session planifiee
              </div>
            ) : (
              upcomingSessions.map((session) => {
                const startsAt = new Date(session.starts_at);

                return (
                  <Link
                    key={session.id}
                    href={`/dashboard/sessions/${session.id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-navy-50"
                  >
                    <div>
                      <p className="font-medium text-navy-900">
                        {session.type === 'theory' ? 'Theorie' : 'Pratique'}
                      </p>
                      <p className="text-sm text-navy-500">
                        {startsAt.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}{' '}
                        a{' '}
                        {startsAt.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status="confirmed" />
                      <p className="mt-1 text-xs text-navy-500">{session.site?.name}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
