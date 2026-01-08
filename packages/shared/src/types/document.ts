/**
 * Document validation status
 */
export type DocumentStatus = 'missing' | 'pending' | 'approved' | 'rejected';

/**
 * Document type definition
 */
export interface DocumentType {
  id: string;
  key: string;
  label: string;
  description: string | null;
  created_at: string;
}

/**
 * Student uploaded document
 */
export interface StudentDocument {
  id: string;
  site_id: string;
  student_user_id: string;
  document_type_id: string;
  storage_path: string;
  status: DocumentStatus;
  rejected_reason: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/**
 * Student document with type info
 */
export interface StudentDocumentWithType extends StudentDocument {
  document_type: DocumentType;
}

/**
 * Document requirement for a site
 */
export interface SiteRequiredDocument {
  site_id: string;
  document_type_id: string;
  is_required: boolean;
}
