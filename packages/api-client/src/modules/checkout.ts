import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@boatacademy/shared';
import type { CheckoutSessionResponse } from '../types';

/**
 * Checkout / Payments API module
 */
export function createCheckoutClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Create a Stripe Checkout session for a product
     *
     * @param productId - The product UUID to purchase
     * @param siteId - The site UUID
     * @param successUrl - URL to redirect on success
     * @param cancelUrl - URL to redirect on cancel
     * @returns Stripe Checkout URL to redirect user
     * @throws Error if product not found or user not authenticated
     *
     * @example
     * ```typescript
     * const { url } = await api.checkout.createSession(productId, siteId, successUrl, cancelUrl);
     * window.location.href = url; // Redirect to Stripe
     * ```
     */
    async createSession(
      productId: string,
      siteId: string,
      successUrl: string,
      cancelUrl: string
    ): Promise<CheckoutSessionResponse> {
      const { data, error } = await supabase.functions.invoke<CheckoutSessionResponse>(
        'checkout-create-session',
        {
          body: { productId, siteId, successUrl, cancelUrl },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      return data;
    },

    /**
     * Get order status by Stripe session ID
     *
     * @param stripeSessionId - The Stripe checkout session ID
     * @returns Order status
     */
    async getOrderByStripeSession(stripeSessionId: string) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', stripeSessionId)
        .single();

      if (error) {
        throw new Error(error.message || 'Order not found');
      }

      return data;
    },
  };
}
