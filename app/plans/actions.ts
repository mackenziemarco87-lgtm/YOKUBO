"use server";

import Stripe from "stripe";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const prices = {
  pro: "price_1UgAJMBuFp984TxnNQJI9Jn7",
  premier: "price_1UgAMGBuFp984TxniKRD3wxh",
} as const;

export async function startTestCheckout(formData: FormData) {
  const plan = formData.get("plan");
  if (plan !== "pro" && plan !== "premier") redirect("/plans?error=plan");
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_") && !key.startsWith("rk_test_")) redirect("/plans?error=setup");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.id || !user.email) redirect("/sign-in");

  const allowedOrigin = "https://yokubo-git-codex-workspace-plan-test-mackenziemarco87-lgtm.vercel.app";
  const requestHeaders = await headers();
  if (requestHeaders.get("origin") !== allowedOrigin) redirect("/plans?error=origin");

  const stripe = new Stripe(key);
  let checkoutUrl: string | null = null;
  try {
    const price = await stripe.prices.retrieve(prices[plan]);
    const expected = plan === "pro" ? 2500 : 4999;
    if (!price.active || price.currency !== "eur" || price.unit_amount !== expected || price.recurring?.interval !== "month" || price.livemode) {
      redirect("/plans?error=price");
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: { trial_period_days: 30, metadata: { supabase_user_id: user.id } },
      success_url: allowedOrigin + "/plans?checkout=success",
      cancel_url: allowedOrigin + "/plans?checkout=cancelled",
    });
    checkoutUrl = session.url;
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Sandbox checkout creation failed");
  }
  if (!checkoutUrl) redirect("/plans?error=checkout");
  redirect(checkoutUrl);
}

