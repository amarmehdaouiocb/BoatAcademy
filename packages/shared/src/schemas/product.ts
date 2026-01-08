import { z } from 'zod';

/**
 * Product type enum
 */
export const productTypeSchema = z.enum(['permit', 'reactivation', 'post_permit']);

/**
 * Create product schema (admin)
 */
export const createProductSchema = z.object({
  siteId: z.string().uuid('Site invalide'),
  type: productTypeSchema,
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  priceCents: z.number().int().min(0, 'Prix invalide'),
  currency: z.string().default('EUR'),
  accessDurationDays: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Update product schema
 */
export const updateProductSchema = createProductSchema.partial().omit({ siteId: true });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Checkout session schema
 */
export const checkoutSchema = z.object({
  productId: z.string().uuid('Produit invalide'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Parse price string to cents
 */
export function parsePriceToCents(price: string): number {
  const cleaned = price.replace(/[^0-9.,]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
}
