'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const timezones = [
  { value: 'Europe/Paris', label: 'Europe/Paris (France)' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels (Belgique)' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (Suisse)' },
  { value: 'America/Martinique', label: 'America/Martinique' },
  { value: 'America/Guadeloupe', label: 'America/Guadeloupe' },
  { value: 'Indian/Reunion', label: 'Indian/Reunion' },
];

export default function NewSitePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    region: '',
    timezone: 'Europe/Paris',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('sites').insert({
        name: formData.name,
        city: formData.city || null,
        region: formData.region || null,
        timezone: formData.timezone,
        is_active: true,
      });

      if (insertError) throw insertError;

      router.push('/dashboard/sites');
      router.refresh();
    } catch (err) {
      console.error('Error creating site:', err);
      setError('Erreur lors de la creation du site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/sites"
          className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Nouveau site</h1>
          <p className="mt-1 text-navy-500">Créer un nouveau site de formation</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader title="Informations du site" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600">
                {error}
              </div>
            )}

            <Input
              label="Nom du site *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Boat Academy Paris"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Ville"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Paris"
              />

              <Input
                label="Region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Ile-de-France"
              />
            </div>

            <Select
              label="Fuseau horaire"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              options={timezones}
            />

            <div className="flex justify-end gap-3 border-t border-navy-100 pt-6">
              <Link href="/dashboard/sites">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" loading={loading}>
                Créer le site
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
