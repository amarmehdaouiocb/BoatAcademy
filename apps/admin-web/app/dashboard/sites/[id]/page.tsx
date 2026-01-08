'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Site } from '@/lib/supabase/types';

const timezones = [
  { value: 'Europe/Paris', label: 'Europe/Paris (France)' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels (Belgique)' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (Suisse)' },
  { value: 'America/Martinique', label: 'America/Martinique' },
  { value: 'America/Guadeloupe', label: 'America/Guadeloupe' },
  { value: 'Indian/Reunion', label: 'Indian/Reunion' },
];

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;
  const supabase = createClient();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    region: '',
    timezone: 'Europe/Paris',
    is_active: true,
  });

  useEffect(() => {
    async function fetchSite() {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single<Site>();

      if (error || !data) {
        setError('Site non trouve');
        setLoading(false);
        return;
      }

      setSite(data);
      setFormData({
        name: data.name,
        city: data.city || '',
        region: data.region || '',
        timezone: data.timezone,
        is_active: data.is_active,
      });
      setLoading(false);
    }

    fetchSite();
  }, [siteId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          name: formData.name,
          city: formData.city || null,
          region: formData.region || null,
          timezone: formData.timezone,
          is_active: formData.is_active,
        })
        .eq('id', siteId);

      if (updateError) throw updateError;

      router.push('/dashboard/sites');
      router.refresh();
    } catch (err) {
      console.error('Error updating site:', err);
      setError('Erreur lors de la mise a jour du site');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce site ?')) return;

    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);

      if (deleteError) throw deleteError;

      router.push('/dashboard/sites');
      router.refresh();
    } catch (err) {
      console.error('Error deleting site:', err);
      setError('Erreur lors de la suppression du site');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-navy-500">{error || 'Site non trouve'}</p>
        <Link href="/dashboard/sites" className="mt-4">
          <Button variant="outline">Retour aux sites</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sites"
            className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{site.name}</h1>
            <p className="mt-1 text-navy-500">
              Cree le {new Date(site.created_at).toLocaleDateString('fr-FR')}
            </p>
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-navy-700">
                Site actif
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-navy-100 pt-6">
              <Link href="/dashboard/sites">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" loading={saving}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
