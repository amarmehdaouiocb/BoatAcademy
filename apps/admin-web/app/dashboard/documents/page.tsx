'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

type DocumentWithDetails = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  storage_path: string;
  uploaded_at: string;
  rejected_reason: string | null;
  student: {
    user_id: string;
    profile: { full_name: string | null } | null;
  } | null;
  document_type: {
    label: string;
    key: string;
  } | null;
  site: {
    name: string;
  } | null;
};

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuves' },
  { value: 'rejected', label: 'Rejetes' },
];

export default function DocumentsPage() {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithDetails | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  async function fetchDocuments() {
    setLoading(true);

    const query = supabase
      .from('student_documents')
      .select(`
        id,
        status,
        storage_path,
        uploaded_at,
        rejected_reason,
        student:students!inner(
          user_id,
          profile:profiles!inner(full_name)
        ),
        document_type:document_types(label, key),
        site:sites(name)
      `)
      .order('uploaded_at', { ascending: false });

    if (filter !== 'all') {
      query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data as DocumentWithDetails[]);
    }

    setLoading(false);
  }

  async function handleApprove(docId: string) {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('student_documents')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejected_reason: null,
        })
        .eq('id', docId);

      if (error) throw error;

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'approved' as const } : d))
      );
      setSelectedDoc(null);
    } catch (err) {
      console.error('Error approving document:', err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(docId: string) {
    if (!rejectReason.trim()) {
      alert('Veuillez indiquer la raison du rejet');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('student_documents')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejected_reason: rejectReason,
        })
        .eq('id', docId);

      if (error) throw error;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: 'rejected' as const, rejected_reason: rejectReason }
            : d
        )
      );
      setSelectedDoc(null);
      setRejectReason('');
    } catch (err) {
      console.error('Error rejecting document:', err);
    } finally {
      setProcessing(false);
    }
  }

  async function getDocumentUrl(storagePath: string) {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 300); // 5 min expiry

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  }

  const pendingCount = documents.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Documents</h1>
          <p className="mt-1 text-navy-500">
            {pendingCount} document{pendingCount > 1 ? 's' : ''} en attente de validation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-navy-400" />
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterStatus)}
            options={statusOptions}
            className="w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-navy-300" />
            <p className="mt-4 text-navy-500">
              {filter === 'pending'
                ? 'Aucun document en attente'
                : 'Aucun document trouve'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-100">
                      <FileText className="h-6 w-6 text-navy-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-navy-900">
                        {doc.document_type?.label || 'Document'}
                      </h3>
                      <p className="text-sm text-navy-500">
                        {doc.student?.profile?.full_name || 'Stagiaire inconnu'} -{' '}
                        {doc.site?.name}
                      </p>
                      <p className="text-xs text-navy-400">
                        Uploade le{' '}
                        {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={doc.status} />

                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => getDocumentUrl(doc.storage_path)}
                    >
                      Voir
                    </Button>

                    {doc.status === 'pending' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => handleApprove(doc.id)}
                          loading={processing}
                        >
                          Approuver
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => setSelectedDoc(doc)}
                        >
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {doc.status === 'rejected' && doc.rejected_reason && (
                  <div className="mt-3 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                    <strong>Raison du rejet :</strong> {doc.rejected_reason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50">
          <Card className="w-full max-w-md">
            <CardHeader title="Rejeter le document" />
            <CardContent>
              <p className="mb-4 text-sm text-navy-600">
                Veuillez indiquer la raison du rejet pour{' '}
                <strong>{selectedDoc.document_type?.label}</strong>.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Document illisible, date expiree..."
                rows={3}
                className="w-full rounded-lg border border-navy-200 px-4 py-3 text-navy-900 placeholder-navy-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              />
              <div className="mt-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDoc(null);
                    setRejectReason('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleReject(selectedDoc.id)}
                  loading={processing}
                >
                  Confirmer le rejet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
