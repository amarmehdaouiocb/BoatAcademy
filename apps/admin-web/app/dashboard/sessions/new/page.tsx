'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type SelectOption = {
  value: string;
  label: string;
};

const sessionTypes = [
  { value: 'theory', label: 'Theorie' },
  { value: 'practice', label: 'Pratique' },
];

export default function NewSessionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SelectOption[]>([]);
  const [instructors, setInstructors] = useState<SelectOption[]>([]);

  const [formData, setFormData] = useState({
    type: 'theory' as 'theory' | 'practice',
    site_id: '',
    instructor_user_id: '',
    date: '',
    start_time: '09:00',
    end_time: '12:00',
    capacity: '10',
    location: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchData() {
      // Fetch sites
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (sitesData) {
        setSites(sitesData.map((site) => ({ value: site.id, label: site.name })));
        const firstSite = sitesData[0];
        if (firstSite && !formData.site_id) {
          setFormData((prev) => ({ ...prev, site_id: firstSite.id }));
        }
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
    }

    fetchData();
  }, [supabase, formData.site_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const startsAt = new Date(`${formData.date}T${formData.start_time}`);
      const endsAt = new Date(`${formData.date}T${formData.end_time}`);

      if (endsAt <= startsAt) {
        throw new Error("L'heure de fin doit etre apres l'heure de debut");
      }

      const { error: insertError } = await supabase.from('sessions').insert({
        type: formData.type,
        site_id: formData.site_id,
        instructor_user_id: formData.instructor_user_id || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity: parseInt(formData.capacity, 10),
        location: formData.location || null,
        notes: formData.notes || null,
      });

      if (insertError) throw insertError;

      router.push('/dashboard/sessions');
      router.refresh();
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation de la session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/sessions"
          className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Nouvelle session</h1>
          <p className="mt-1 text-navy-500">Planifier une session de formation</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
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
                label="Type de session *"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'theory' | 'practice' })
                }
                options={sessionTypes}
              />

              <Select
                label="Site *"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                options={sites}
                required
              />
            </div>

            <Input
              label="Date *"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Heure de debut *"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />

              <Input
                label="Heure de fin *"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Capacite *"
                type="number"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
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
              label="Lieu"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Salle A, Port de plaisance..."
            />

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

            <div className="flex justify-end gap-3 border-t border-navy-100 pt-6">
              <Link href="/dashboard/sessions">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" loading={loading}>
                Creer la session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
