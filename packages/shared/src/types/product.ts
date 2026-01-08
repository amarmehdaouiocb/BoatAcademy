/**
 * Product type
 */
export type ProductType = 'permit' | 'reactivation' | 'post_permit';

/**
 * Order status
 */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Product (permit, reactivation, post-permit course)
 */
export interface Product {
  id: string;
  site_id: string;
  type: ProductType;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  access_duration_days: number | null;
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Order (Stripe checkout)
 */
export interface Order {
  id: string;
  site_id: string;
  user_id: string;
  product_id: string;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  created_at: string;
  paid_at: string | null;
}

/**
 * Entitlement (access duration)
 */
export interface Entitlement {
  id: string;
  site_id: string;
  user_id: string;
  product_id: string | null;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

/**
 * Product with formatted price
 */
export interface ProductWithPrice extends Product {
  formatted_price: string;
}
