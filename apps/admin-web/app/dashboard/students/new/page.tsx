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

type SiteOption = {
  value: string;
  label: string;
};

export default function NewStudentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SiteOption[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    site_id: '',
  });

  useEffect(() => {
    async function fetchSites() {
      const { data } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setSites(data.map((site) => ({ value: site.id, label: site.name })));
        const firstSite = data[0];
        if (firstSite && !formData.site_id) {
          setFormData((prev) => ({ ...prev, site_id: firstSite.id }));
        }
      }
    }

    fetchSites();
  }, [supabase, formData.site_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For MVP, we'll create an invitation flow
      // The student will receive an email to set their password
      // For now, we create a placeholder entry using the Edge Function

      // Call the Edge Function to create student with invitation
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin/invite-student`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            site_id: formData.site_id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la creation du stagiaire');
      }

      router.push('/dashboard/students');
      router.refresh();
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation du stagiaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/students"
          className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Nouveau stagiaire</h1>
          <p className="mt-1 text-navy-500">Inviter un nouveau stagiaire par email</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader title="Informations du stagiaire" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600">
                {error}
              </div>
            )}

            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="stagiaire@exemple.com"
              required
            />

            <Input
              label="Nom complet *"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Jean Dupont"
              required
            />

            <Input
              label="Telephone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="06 12 34 56 78"
            />

            <Select
              label="Site de formation *"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              options={sites}
              required
            />

            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-sm text-navy-600">
                Un email d&apos;invitation sera envoye au stagiaire pour qu&apos;il puisse
                creer son mot de passe et acceder a son espace personnel.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-navy-100 pt-6">
              <Link href="/dashboard/students">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" loading={loading}>
                Envoyer l&apos;invitation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
