import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, DocumentStatus } from '@boatacademy/shared';
import type { SuccessResponse } from '../types';

/**
 * Documents / Validation API module
 */
export function createDocumentsClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Validate (approve or reject) a student document
     *
     * Only admin/manager can call this.
     *
     * @param studentDocumentId - The document UUID
     * @param status - 'approved' or 'rejected'
     * @param rejectedReason - Reason if rejected
     *
     * @example
     * ```typescript
     * await api.documents.validate(docId, 'approved');
     * await api.documents.validate(docId, 'rejected', 'Photo floue');
     * ```
     */
    async validate(
      studentDocumentId: string,
      status: Extract<DocumentStatus, 'approved' | 'rejected'>,
      rejectedReason?: string
    ): Promise<SuccessResponse> {
      const { data, error } = await supabase.functions.invoke<SuccessResponse>(
        'documents-validate',
        {
          body: {
            student_document_id: studentDocumentId,
            status,
            rejected_reason: rejectedReason,
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to validate document');
      }

      return data ?? { ok: true };
    },

    /**
     * Upload a document for a student
     *
     * @param studentUserId - The student's user UUID
     * @param documentTypeId - The document type UUID
     * @param file - The file to upload
     * @returns The storage path and document record
     */
    async upload(
      studentUserId: string,
      documentTypeId: string,
      file: File
    ): Promise<{ storagePath: string; documentId: string }> {
      // Generate unique path
      const ext = file.name.split('.').pop() || 'pdf';
      const storagePath = `${studentUserId}/${documentTypeId}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      // Get student's site_id
      const { data: student } = await supabase
        .from('students')
        .select('site_id')
        .eq('user_id', studentUserId)
        .single();

      if (!student) {
        throw new Error('Student not found');
      }

      // Create document record (upsert to replace previous)
      const { data: doc, error: docError } = await supabase
        .from('student_documents')
        .upsert(
          {
            site_id: student.site_id,
            student_user_id: studentUserId,
            document_type_id: documentTypeId,
            storage_path: storagePath,
            status: 'pending',
            uploaded_at: new Date().toISOString(),
          },
          {
            onConflict: 'student_user_id,document_type_id',
          }
        )
        .select('id')
        .single();

      if (docError) {
        throw new Error(docError.message || 'Failed to create document record');
      }

      return { storagePath, documentId: doc.id };
    },

    /**
     * Get signed URL for viewing a document
     *
     * @param storagePath - The storage path
     * @param expiresIn - URL expiration in seconds (default 1 hour)
     */
    async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        throw new Error(error.message || 'Failed to get signed URL');
      }

      return data.signedUrl;
    },
  };
}
