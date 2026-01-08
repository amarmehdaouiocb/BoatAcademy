import { z } from 'zod';

/**
 * Session type enum
 */
export const sessionTypeSchema = z.enum(['theory', 'practice']);

/**
 * Base session object schema (without refinement)
 */
const sessionBaseSchema = z.object({
  siteId: z.string().uuid('Site invalide'),
  type: sessionTypeSchema,
  startsAt: z.string().datetime('Date de debut invalide'),
  endsAt: z.string().datetime('Date de fin invalide'),
  capacity: z.number().int().min(1, 'Capacite minimum: 1'),
  location: z.string().optional(),
  instructorUserId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

/**
 * Create session schema (admin/manager)
 */
export const createSessionSchema = sessionBaseSchema.refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  {
    message: 'La date de fin doit etre apres la date de debut',
    path: ['endsAt'],
  }
);

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

/**
 * Update session schema (partial, without siteId)
 */
export const updateSessionSchema = sessionBaseSchema.omit({ siteId: true }).partial();

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

/**
 * Assign student to session schema
 */
export const assignStudentSchema = z.object({
  sessionId: z.string().uuid('Session invalide'),
  studentUserId: z.string().uuid('Stagiaire invalide'),
});

export type AssignStudentInput = z.infer<typeof assignStudentSchema>;

/**
 * Cancel enrollment schema
 */
export const cancelEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid('Inscription invalide'),
  reason: z.string().optional(),
});

export type CancelEnrollmentInput = z.infer<typeof cancelEnrollmentSchema>;

/**
 * Record penalty schema
 */
export const recordPenaltySchema = z.object({
  studentUserId: z.string().uuid('Stagiaire invalide'),
  sessionId: z.string().uuid().optional(),
  type: z.enum(['noshow', 'late_cancel']),
  notes: z.string().optional(),
});

export type RecordPenaltyInput = z.infer<typeof recordPenaltySchema>;

/**
 * Exam center schema
 */
export const examCenterSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type ExamCenterInput = z.infer<typeof examCenterSchema>;
