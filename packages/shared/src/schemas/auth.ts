import { z } from 'zod';

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe: 8 caracteres minimum'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Register form schema
 */
export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Mot de passe: 8 caracteres minimum'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Nom requis'),
    phone: z.string().optional(),
    siteId: z.string().uuid('Site invalide'),
    consentMarketing: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Profile update schema
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Nom requis').optional(),
  phone: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Password reset request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Password reset schema
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mot de passe: 8 caracteres minimum'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
