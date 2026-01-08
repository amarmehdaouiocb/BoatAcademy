'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';

type StudentDetail = {
  user_id: string;
  site_id: string;
  oedipp_number: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
    phone: string | null;
  } | null;
  site: {
    name: string;
  } | null;
};

type StudentDocument = {
  id: string;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  document_type: {
    label: string;
  } | null;
};

type Enrollment = {
  id: string;
  status: 'assigned' | 'cancelled' | 'noshow' | 'completed';
  session: {
    type: 'theory' | 'practice';
    starts_at: string;
  } | null;
};

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const supabase = createClient();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    oedipp_number: '',
  });

  useEffect(() => {
    async function fetchStudent() {
      // Fetch student with profile and site
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          user_id,
          site_id,
          oedipp_number,
          created_at,
          profile:profiles!inner(full_name, phone),
          site:sites(name)
        `)
        .eq('user_id', studentId)
        .single();

      if (studentError || !studentData) {
        setError('Stagiaire non trouve');
        setLoading(false);
        return;
      }

      const typedStudent = studentData as StudentDetail;
      setStudent(typedStudent);
      setFormData({
        full_name: typedStudent.profile?.full_name || '',
        phone: typedStudent.profile?.phone || '',
        oedipp_number: typedStudent.oedipp_number || '',
      });

      // Fetch documents
      const { data: docsData } = await supabase
        .from('student_documents')
        .select(`
          id,
          status,
          document_type:document_types(label)
        `)
        .eq('student_user_id', studentId);

      if (docsData) {
        setDocuments(docsData as StudentDocument[]);
      }

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          session:sessions(type, starts_at)
        `)
        .eq('student_user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (enrollmentsData) {
        setEnrollments(enrollmentsData as Enrollment[]);
      }

      setLoading(false);
    }

    fetchStudent();
  }, [studentId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
        })
        .eq('user_id', studentId);

      if (profileError) throw profileError;

      // Update student oedipp
      const { error: studentError } = await supabase
        .from('students')
        .update({
          oedipp_number: formData.oedipp_number || null,
          oedipp_set_at: formData.oedipp_number ? new Date().toISOString() : null,
        })
        .eq('user_id', studentId);

      if (studentError) throw studentError;

      // Update local state
      setStudent((prev) =>
        prev
          ? {
              ...prev,
              oedipp_number: formData.oedipp_number || null,
              profile: {
                full_name: formData.full_name || null,
                phone: formData.phone || null,
              },
            }
          : null
      );
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-navy-500">{error || 'Stagiaire non trouve'}</p>
        <Link href="/dashboard/students" className="mt-4">
          <Button variant="outline">Retour aux stagiaires</Button>
        </Link>
      </div>
    );
  }

  const documentStatusCount = {
    approved: documents.filter((d) => d.status === 'approved').length,
    pending: documents.filter((d) => d.status === 'pending').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
    total: documents.length,
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-900">
            {student.profile?.full_name || 'Stagiaire'}
          </h1>
          <p className="mt-1 text-navy-500">
            {student.site?.name} - Inscrit le{' '}
            {new Date(student.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <StatusBadge status="active" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Informations personnelles" />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600">
                    {error}
                  </div>
                )}

                <Input
                  label="Nom complet"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                />

                <Input
                  label="Telephone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />

                <Input
                  label="Numero OEDIPP"
                  value={formData.oedipp_number}
                  onChange={(e) => setFormData({ ...formData, oedipp_number: e.target.value })}
                  placeholder="OEDIPP-XXXXX"
                />

                <div className="flex justify-end border-t border-navy-100 pt-6">
                  <Button type="submit" loading={saving}>
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Enrollments */}
          <Card padding="none">
            <div className="border-b border-navy-100 px-6 py-4">
              <h3 className="font-semibold text-navy-900">Sessions recentes</h3>
            </div>
            <div className="divide-y divide-navy-100">
              {enrollments.length === 0 ? (
                <div className="px-6 py-8 text-center text-navy-500">
                  Aucune session inscrite
                </div>
              ) : (
                enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-navy-400" />
                      <div>
                        <p className="font-medium text-navy-900">
                          {enrollment.session?.type === 'theory' ? 'Theorie' : 'Pratique'}
                        </p>
                        <p className="text-sm text-navy-500">
                          {enrollment.session?.starts_at
                            ? new Date(enrollment.session.starts_at).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={enrollment.status} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Documents status */}
          <Card>
            <CardHeader title="Documents" />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-600">Valides</span>
                  <span className="font-medium text-success-600">
                    {documentStatusCount.approved}/{documentStatusCount.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-600">En attente</span>
                  <span className="font-medium text-warning-600">
                    {documentStatusCount.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-600">Rejetes</span>
                  <span className="font-medium text-error-600">
                    {documentStatusCount.rejected}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-navy-100">
                <Link href={`/dashboard/documents?student=${studentId}`}>
                  <Button variant="outline" icon={FileText} className="w-full">
                    Voir les documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader title="Actions" />
            <CardContent className="space-y-3">
              <Link href={`/dashboard/sessions/assign?student=${studentId}`}>
                <Button variant="secondary" icon={Calendar} className="w-full">
                  Inscrire a une session
                </Button>
              </Link>
              <Button variant="outline" icon={AlertTriangle} className="w-full">
                Signaler un no-show
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
