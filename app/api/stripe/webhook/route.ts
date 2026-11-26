import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validPrices = new Set([
  "price_1UgAJMBuFp984TxnNQJI9Jn7",
  "price_1UgAMGBuFp984TxniKRD3wxh",
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const signature = request.headers.get("stripe-signature");

  if (!secret || (!secret.startsWith("sk_test_") && !secret.startsWith("rk_test_")) ||
      !webhookSecret || !supabaseUrl || !serviceKey || !signature) {
    return new Response("Webhook not configured", { status: 400 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.livemode) return new Response("Sandbox only", { status: 400 });

  if (!["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    return Response.json({ received: true });
  }

  try {
    const eventSubscription = event.data.object as Stripe.Subscription;
    // Fetch current Stripe state so delayed events do not restore an older status.
    const subscription = await stripe.subscriptions.retrieve(eventSubscription.id);
    const userId = subscription.metadata.supabase_user_id;
    const item = subscription.items.data[0];
    const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "") ||
        !item || subscription.items.data.length !== 1 || !validPrices.has(item.price.id)) {
      console.error("Sandbox subscription could not be matched to an account or plan");
      return new Response("Invalid subscription", { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await admin.from("billing_subscriptions").upsert({
      stripe_subscription_id: subscription.id,
      user_id: userId,
      stripe_customer_id: customer,
      stripe_price_id: item.price.id,
      status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: "stripe_subscription_id" });

    if (error) throw new Error("Subscription status could not be saved");
    return Response.json({ received: true });
  } catch {
    console.error("Sandbox webhook processing failed");
    return new Response("Webhook processing failed", { status: 500 });
  }
}
