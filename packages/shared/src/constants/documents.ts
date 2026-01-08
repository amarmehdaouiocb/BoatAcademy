import type { DocumentStatus } from '../types';

/**
 * Document status labels (French)
 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  missing: 'Manquant',
  pending: 'En attente',
  approved: 'Valide',
  rejected: 'Refuse',
};

/**
 * Document status colors for UI
 */
export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  missing: 'gray',
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

/**
 * Default document types (keys)
 */
export const DEFAULT_DOCUMENT_TYPES = [
  {
    key: 'identity',
    label: 'Piece d\'identite',
    description: 'Carte d\'identite ou passeport en cours de validite',
  },
  {
    key: 'photo',
    label: 'Photo d\'identite',
    description: 'Photo d\'identite recente (format ANTS)',
  },
  {
    key: 'medical',
    label: 'Certificat medical',
    description: 'Certificat medical de moins de 6 mois',
  },
  {
    key: 'residence',
    label: 'Justificatif de domicile',
    description: 'Facture ou attestation de moins de 3 mois',
  },
] as const;

/**
 * Maximum file size in bytes (10 MB)
 */
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for documents
 */
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
