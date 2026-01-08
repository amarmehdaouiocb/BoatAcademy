'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, Users, UserPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';

type SessionDetail = {
  id: string;
  type: 'theory' | 'practice';
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string | null;
  notes: string | null;
  site_id: string;
  instructor_user_id: string | null;
  site: { name: string } | null;
  instructor: { full_name: string | null } | null;
};

type EnrollmentWithStudent = {
  id: string;
  status: 'assigned' | 'cancelled' | 'noshow' | 'completed';
  student: {
    user_id: string;
    profile: { full_name: string | null } | null;
  } | null;
};

type SelectOption = {
  value: string;
  label: string;
};

const sessionTypes = [
  { value: 'theory', label: 'Theorie' },
  { value: 'practice', label: 'Pratique' },
];

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const supabase = createClient();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithStudent[]>([]);
  const [instructors, setInstructors] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'theory' as 'theory' | 'practice',
    date: '',
    start_time: '09:00',
    end_time: '12:00',
    capacity: '10',
    location: '',
    notes: '',
    instructor_user_id: '',
  });

  useEffect(() => {
    async function fetchData() {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          type,
          starts_at,
          ends_at,
          capacity,
          location,
          notes,
          site_id,
          instructor_user_id,
          site:sites(name),
          instructor:profiles!sessions_instructor_user_id_fkey(full_name)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        setError('Session non trouvee');
        setLoading(false);
        return;
      }

      const typedSession = sessionData as SessionDetail;
      setSession(typedSession);

      const startsAt = new Date(typedSession.starts_at);
      const endsAt = new Date(typedSession.ends_at);

      setFormData({
        type: typedSession.type,
        date: startsAt.toISOString().split('T')[0] || '',
        start_time: startsAt.toTimeString().slice(0, 5),
        end_time: endsAt.toTimeString().slice(0, 5),
        capacity: String(typedSession.capacity),
        location: typedSession.location || '',
        notes: typedSession.notes || '',
        instructor_user_id: typedSession.instructor_user_id || '',
      });

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          student:students!inner(
            user_id,
            profile:profiles!inner(full_name)
          )
        `)
        .eq('session_id', sessionId)
        .neq('status', 'cancelled');

      if (enrollmentsData) {
        setEnrollments(enrollmentsData as EnrollmentWithStudent[]);
      }

      // Fetch instructors
      const { data: instructorsData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('role', ['instructor', 'manager', 'admin'])
        .order('full_name');

      if (instructorsData) {
        setInstructors([
          { value: '', label: 'Non assigne' },
          ...instructorsData.map((instructor) => ({
            value: instructor.user_id,
            label: instructor.full_name || 'Sans nom',
          })),
        ]);
      }

      setLoading(false);
    }

    fetchData();
  }, [sessionId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const startsAt = new Date(`${formData.date}T${formData.start_time}`);
      const endsAt = new Date(`${formData.date}T${formData.end_time}`);

      if (endsAt <= startsAt) {
        throw new Error("L'heure de fin doit etre apres l'heure de debut");
      }

      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          type: formData.type,
          instructor_user_id: formData.instructor_user_id || null,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          capacity: parseInt(formData.capacity, 10),
          location: formData.location || null,
          notes: formData.notes || null,
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      router.push('/dashboard/sessions');
      router.refresh();
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Etes-vous sur de vouloir supprimer cette session ?')) return;

    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) throw deleteError;

      router.push('/dashboard/sessions');
      router.refresh();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!confirm('Annuler cette inscription ?')) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', enrollmentId);

      if (error) throw error;

      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } catch (err) {
      console.error('Error cancelling enrollment:', err);
      setError('Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-navy-500">{error || 'Session non trouvee'}</p>
        <Link href="/dashboard/sessions" className="mt-4">
          <Button variant="outline">Retour aux sessions</Button>
        </Link>
      </div>
    );
  }

  const enrolledCount = enrollments.length;
  const remainingPlaces = session.capacity - enrolledCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sessions"
            className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              {session.type === 'theory' ? 'Theorie' : 'Pratique'} -{' '}
              {new Date(session.starts_at).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h1>
            <p className="mt-1 text-navy-500">{session.site?.name}</p>
          </div>
        </div>
        <Button
          variant="danger"
          icon={Trash2}
          onClick={handleDelete}
          loading={deleting}
        >
          Supprimer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Details de la session" />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'theory' | 'practice' })
                    }
                    options={sessionTypes}
                  />

                  <Select
                    label="Moniteur"
                    value={formData.instructor_user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, instructor_user_id: e.target.value })
                    }
                    options={instructors}
                  />
                </div>

                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Heure de debut"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />

                  <Input
                    label="Heure de fin"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Capacite"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />

                  <Input
                    label="Lieu"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Salle A"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy-700">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes internes..."
                    rows={3}
                    className="w-full rounded-lg border border-navy-200 px-4 py-3 text-navy-900 placeholder-navy-400 transition-colors focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                  />
                </div>

                <div className="flex justify-end border-t border-navy-100 pt-6">
                  <Button type="submit" loading={saving}>
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Enrollments */}
        <div className="space-y-6">
          <Card padding="none">
            <div className="border-b border-navy-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-navy-500" />
                  <h3 className="font-semibold text-navy-900">
                    Inscrits ({enrolledCount}/{session.capacity})
                  </h3>
                </div>
                <span
                  className={`text-sm font-medium ${
                    remainingPlaces > 0 ? 'text-success-600' : 'text-error-600'
                  }`}
                >
                  {remainingPlaces} place{remainingPlaces > 1 ? 's' : ''} restante{remainingPlaces > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="divide-y divide-navy-100">
              {enrollments.length === 0 ? (
                <div className="px-6 py-8 text-center text-navy-500">
                  Aucun stagiaire inscrit
                </div>
              ) : (
                enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
                        {(enrollment.student?.profile?.full_name || 'XX')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-navy-900">
                        {enrollment.student?.profile?.full_name || 'Sans nom'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={enrollment.status} />
                      <button
                        onClick={() => handleCancelEnrollment(enrollment.id)}
                        className="rounded p-1 text-navy-400 transition-colors hover:bg-error-50 hover:text-error-600"
                        title="Annuler"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {remainingPlaces > 0 && (
              <div className="border-t border-navy-100 p-4">
                <Button variant="secondary" icon={UserPlus} className="w-full">
                  Ajouter un stagiaire
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
