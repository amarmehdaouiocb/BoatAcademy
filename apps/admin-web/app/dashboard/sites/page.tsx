'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import type { Site } from '@/lib/supabase/types';

export default function SitesPage() {
  const supabase = createClient();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sites:', error);
    } else {
      setSites(data as Site[]);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Sites</h1>
          <p className="mt-1 text-navy-500">
            Gerez les sites de formation ({sites.length} site{sites.length > 1 ? 's' : ''})
          </p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button icon={Plus}>Ajouter un site</Button>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-navy-500">Aucun site configure</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-navy-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Fuseau horaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Créé le
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {sites.map((site) => (
                <tr
                  key={site.id}
                  className="hover:bg-navy-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/sites/${site.id}`}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/sites/${site.id}`}
                      className="font-medium text-navy-900 hover:text-navy-700"
                    >
                      {site.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-navy-600">
                    {site.city || '-'}
                    {site.region && `, ${site.region}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-500">
                    {site.timezone}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={site.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-500">
                    {new Date(site.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
