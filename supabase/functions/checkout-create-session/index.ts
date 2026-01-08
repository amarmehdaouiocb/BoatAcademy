import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { getAuthedUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

interface CheckoutRequest {
  productId: string;
  siteId: string;
  successUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate user
    const { user } = await getAuthedUser(req);
    const admin = supabaseAdmin();

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { productId, siteId, successUrl, cancelUrl } = body;

    if (!productId || !siteId || !successUrl || !cancelUrl) {
      return errorResponse('Missing required fields: productId, siteId, successUrl, cancelUrl');
    }

    // Get product details
    const { data: product, error: productError } = await admin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return errorResponse('Product not found or inactive', 404);
    }

    // Get user profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse('User profile not found', 404);
    }

    // Check if user already has active entitlement for this product
    const { data: existingEntitlement } = await admin
      .from('entitlements')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingEntitlement) {
      return errorResponse('You already have an active subscription for this product', 400);
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: profile.email || user.email,
      line_items: [
        {
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: product.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        product_id: productId,
        site_id: siteId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Create pending order in database
    const { error: orderError } = await admin.from('orders').insert({
      user_id: user.id,
      site_id: siteId,
      product_id: productId,
      amount_cents: product.price_cents,
      currency: product.currency,
      status: 'pending',
      stripe_session_id: session.id,
    });

    if (orderError) {
      console.error('Failed to create order:', orderError);
      // Continue anyway, webhook will handle it
    }

    return jsonResponse({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }

    return errorResponse('Internal server error', 500);
  }
});
