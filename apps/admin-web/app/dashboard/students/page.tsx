'use client';

import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';

type StudentWithProfile = {
  user_id: string;
  site_id: string;
  created_at: string;
  oedipp_number: string | null;
  profile: {
    full_name: string | null;
    phone: string | null;
  } | null;
  site: {
    name: string;
  } | null;
};

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        user_id,
        site_id,
        created_at,
        oedipp_number,
        profile:profiles!inner(full_name, phone),
        site:sites(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data as StudentWithProfile[]);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Stagiaires</h1>
          <p className="mt-1 text-navy-500">
            Gerez les stagiaires ({students.length} stagiaire{students.length > 1 ? 's' : ''})
          </p>
        </div>
        <Link href="/dashboard/students/new">
          <Button icon={Plus}>Ajouter un stagiaire</Button>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-navy-300" />
            <p className="mt-4 text-navy-500">Aucun stagiaire inscrit</p>
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
                  Telephone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  N. OEDIPP
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-600">
                  Inscription
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {students.map((student) => (
                <tr
                  key={student.user_id}
                  className="hover:bg-navy-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/students/${student.user_id}`}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/students/${student.user_id}`}
                      className="font-medium text-navy-900 hover:text-navy-700"
                    >
                      {student.profile?.full_name || 'Sans nom'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-navy-600">
                    {student.profile?.phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-navy-600">
                    {student.site?.name || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-navy-500">
                    {student.oedipp_number || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status="active" />
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-500">
                    {new Date(student.created_at).toLocaleDateString('fr-FR')}
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
