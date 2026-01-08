import { z } from 'zod';

/**
 * Document upload schema
 */
export const uploadDocumentSchema = z.object({
  documentTypeId: z.string().uuid('Type de document invalide'),
  file: z.any(), // File object handled by form
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

/**
 * Document validation schema (admin/manager)
 */
export const validateDocumentSchema = z.object({
  studentDocumentId: z.string().uuid('Document invalide'),
  status: z.enum(['approved', 'rejected']),
  rejectedReason: z.string().optional(),
});

export type ValidateDocumentInput = z.infer<typeof validateDocumentSchema>;

/**
 * OEDIPP number schema
 */
export const oedippSchema = z.object({
  oedippNumber: z
    .string()
    .min(1, 'Numero OEDIPP requis')
    .regex(/^[A-Z0-9-]+$/i, 'Format OEDIPP invalide'),
});

export type OedippInput = z.infer<typeof oedippSchema>;

/**
 * Maximum file size (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed file types
 */
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * Validate file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux (max 10 MB)' };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorise (PDF, JPG, PNG uniquement)' };
  }
  return { valid: true };
}
