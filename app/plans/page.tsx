export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startTestCheckout } from "./actions";

export default async function Plans({ searchParams }: { searchParams: Promise<{ error?: string; checkout?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const state = await searchParams;
  const { data: subscriptions, error: subscriptionError } = await supabase.from("billing_subscriptions").select("status, stripe_price_id, trial_end").eq("user_id", user.id).order("updated_at", { ascending: false });
  const hasActivePlan = subscriptions?.some((subscription) => ["trialing", "active"].includes(subscription.status)) ?? false;
  return <main className="workspace-page">
    <header className="workspace-topbar"><Link className="yokubo-brand" href="/workspace"><span className="yokubo-mark">y</span><span>YOKUBO</span></Link><span className="workspace-account">{user.email}</span></header>
    <section className="workspace-content">
      <p className="eyebrow">SANDBOX PREVIEW</p>
      <h1>Choose your plan</h1>
      <p className="workspace-lede">Try a plan free for 30 days. A test card is required. After the trial, the monthly test subscription starts unless cancelled.</p>
      <p className="workspace-notice">Sandbox checkout only. No real charges. Workspace access controls are still being built.</p>
      {state.checkout === "success" && <p className="workspace-notice">Test checkout completed. Stripe is confirming your subscription; refresh this page if it is not shown yet.</p>}
      {state.checkout === "cancelled" && <p className="workspace-notice">Checkout cancelled. You can choose a plan when ready.</p>}
      {state.error && <p className="workspace-error" role="alert">Could not start test checkout. Please check the sandbox setup and try again.</p>}
      <section className="workspace-create-card">
        <h2>Your test subscription</h2>
        {subscriptionError ? <p>Subscription tracking is not configured yet.</p> : subscriptions?.length ? subscriptions.map((subscription, index) => <p key={index}>{subscription.stripe_price_id === "price_1UgAJMBuFp984TxnNQJI9Jn7" ? "Pro" : "Premier"} · {subscription.status}</p>) : <p>No test subscription recorded yet.</p>}
      </section>
      {hasActivePlan && <p><Link className="workspace-action" href="/workspace">Continue to your workspaces →</Link></p>}
      <div className="hotel-overview-grid">
        <section className="workspace-create-card"><h2>YOKUBO Pro</h2><p><strong>€25 / month</strong> after the 30-day trial</p><form action={startTestCheckout}><input type="hidden" name="plan" value="pro" /><button className="workspace-action">Try Pro in sandbox</button></form></section>
        <section className="workspace-create-card"><h2>YOKUBO Premier</h2><p><strong>€49.99 / month</strong> after the 30-day trial</p><form action={startTestCheckout}><input type="hidden" name="plan" value="premier" /><button className="workspace-action">Try Premier in sandbox</button></form></section>
      </div>
      <Link className="workspace-back" href="/workspace">← Back to workspaces</Link>
    </section>
  </main>;
}
