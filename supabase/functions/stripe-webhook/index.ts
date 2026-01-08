import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse('Missing stripe-signature header', 400);
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return errorResponse('Webhook signature verification failed', 400);
    }

    const admin = supabaseAdmin();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(admin, session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(admin, session);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        // Could notify user here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse('Webhook handler failed', 500);
  }
});

async function handleCheckoutCompleted(
  admin: ReturnType<typeof supabaseAdmin>,
  session: Stripe.Checkout.Session
) {
  const { user_id, product_id, site_id } = session.metadata || {};

  if (!user_id || !product_id || !site_id) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update order status
  const { error: orderError } = await admin
    .from('orders')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('stripe_session_id', session.id);

  if (orderError) {
    console.error('Failed to update order:', orderError);
    // Try to create order if it doesn't exist
    await admin.from('orders').insert({
      user_id,
      site_id,
      product_id,
      amount_cents: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || 'EUR',
      status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
    });
  }

  // Get product to determine access duration
  const { data: product } = await admin
    .from('products')
    .select('access_duration_days, type')
    .eq('id', product_id)
    .single();

  if (!product) {
    console.error('Product not found:', product_id);
    return;
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (product.access_duration_days || 365));

  // Create entitlement
  const { error: entitlementError } = await admin.from('entitlements').insert({
    user_id,
    site_id,
    product_id,
    order_id: session.id, // Will be updated with actual order ID
    expires_at: expiresAt.toISOString(),
  });

  if (entitlementError) {
    console.error('Failed to create entitlement:', entitlementError);
  }

  // Create or update student record
  const { data: existingStudent } = await admin
    .from('students')
    .select('id')
    .eq('user_id', user_id)
    .eq('site_id', site_id)
    .single();

  if (!existingStudent) {
    const { error: studentError } = await admin.from('students').insert({
      user_id,
      site_id,
      product_id,
      document_status: 'incomplete',
    });

    if (studentError) {
      console.error('Failed to create student:', studentError);
    }
  }

  // Create notification for user
  await admin.from('notifications').insert({
    user_id,
    type: 'payment_received',
    title: 'Paiement recu',
    body: 'Votre paiement a ete confirme. Bienvenue chez Boat Academy !',
    data: { product_id, site_id },
  });

  console.log('Checkout completed successfully:', session.id);
}

async function handleCheckoutExpired(
  admin: ReturnType<typeof supabaseAdmin>,
  session: Stripe.Checkout.Session
) {
  // Update order status to expired
  const { error } = await admin
    .from('orders')
    .update({ status: 'failed' })
    .eq('stripe_session_id', session.id);

  if (error) {
    console.error('Failed to update expired order:', error);
  }

  console.log('Checkout session expired:', session.id);
}
