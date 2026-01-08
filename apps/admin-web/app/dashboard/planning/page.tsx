'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Users, MapPin, Clock } from 'lucide-react';
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
  site: { name: string } | null;
  enrollments: { id: string; status: string }[];
};

export default function PlanningPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));

  // Get the start of the week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Get week days
  function getWeekDays(start: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }

  // Navigate weeks
  function prevWeek() {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  }

  function nextWeek() {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  }

  function goToToday() {
    setCurrentWeek(getWeekStart(new Date()));
  }

  useEffect(() => {
    fetchSessions();
  }, [currentWeek]);

  async function fetchSessions() {
    setLoading(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Calculate week boundaries
    const weekEnd = new Date(currentWeek);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Build query
    const query = supabase
      .from('sessions')
      .select(`
        id,
        type,
        starts_at,
        ends_at,
        capacity,
        location,
        site:sites(name),
        enrollments(id, status)
      `)
      .gte('starts_at', currentWeek.toISOString())
      .lt('starts_at', weekEnd.toISOString())
      .order('starts_at', { ascending: true });

    // Filter by instructor if not admin/manager
    if (profile?.role === 'instructor') {
      query.eq('instructor_user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data as SessionWithDetails[]);
    }

    setLoading(false);
  }

  // Group sessions by day
  function getSessionsForDay(date: Date): SessionWithDetails[] {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.starts_at);
      return sessionDate.toDateString() === date.toDateString();
    });
  }

  // Format time
  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const weekDays = getWeekDays(currentWeek);
  const today = new Date().toDateString();

  // Week label
  const lastDay = weekDays[6] || currentWeek;
  const weekLabel = `${currentWeek.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })} - ${lastDay.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Mon planning</h1>
          <p className="mt-1 text-navy-500">
            {sessions.length} session{sessions.length > 1 ? 's' : ''} cette semaine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] text-center font-medium text-navy-900">
              {weekLabel}
            </span>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-7">
          {weekDays.map((day) => {
            const daySessions = getSessionsForDay(day);
            const isToday = day.toDateString() === today;
            const isPast = day < new Date() && !isToday;

            return (
              <div key={day.toISOString()} className="min-h-[200px]">
                {/* Day header */}
                <div
                  className={`mb-2 rounded-lg p-2 text-center ${
                    isToday
                      ? 'bg-navy-600 text-white'
                      : isPast
                        ? 'bg-navy-50 text-navy-400'
                        : 'bg-navy-100 text-navy-700'
                  }`}
                >
                  <p className="text-xs font-medium uppercase">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold">{day.getDate()}</p>
                </div>

                {/* Sessions */}
                <div className="space-y-2">
                  {daySessions.length === 0 ? (
                    <p className="text-center text-xs text-navy-300 py-4">-</p>
                  ) : (
                    daySessions.map((session) => {
                      const enrolledCount = session.enrollments?.filter(
                        (e) => e.status !== 'cancelled'
                      ).length || 0;

                      return (
                        <Card
                          key={session.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            session.type === 'theory'
                              ? 'border-l-4 border-l-success-500'
                              : 'border-l-4 border-l-warning-500'
                          }`}
                        >
                          <CardContent className="p-2">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-semibold text-navy-900">
                                {session.type === 'theory' ? 'Theorie' : 'Pratique'}
                              </span>
                              <StatusBadge status="confirmed" />
                            </div>

                            <div className="space-y-1 text-xs text-navy-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(session.starts_at)} -{' '}
                                  {formatTime(session.ends_at)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>
                                  {enrolledCount}/{session.capacity}
                                </span>
                              </div>

                              {session.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{session.location}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-navy-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success-500" />
          <span>Theorie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning-500" />
          <span>Pratique</span>
        </div>
      </div>
    </div>
  );
}
