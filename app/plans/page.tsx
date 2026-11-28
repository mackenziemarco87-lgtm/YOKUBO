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
      <p className="workspace-lede">Start with 30 days free. Choose Pro or Premium to decide which monthly plan follows your trial. A test card is required.</p>
      <p className="workspace-notice">Sandbox checkout only. No real charges. Workspace access controls are still being built.</p>
      <p className="workspace-notice">The limits below are planned. Credits, team invitations, agents and integrations are not yet available or enforced.</p>
      {state.checkout === "success" && <p className="workspace-notice">Test checkout completed. Stripe is confirming your subscription; refresh this page if it is not shown yet.</p>}
      {state.checkout === "cancelled" && <p className="workspace-notice">Checkout cancelled. You can choose a plan when ready.</p>}
      {state.error === "subscription" ? <p className="workspace-error" role="alert">Choose a plan and start a sandbox trial before creating a workspace.</p> : state.error && <p className="workspace-error" role="alert">Could not start test checkout. Please check the sandbox setup and try again.</p>}
      <section className="workspace-create-card">
        <h2>Your test subscription</h2>
        {subscriptionError ? <p>Subscription tracking is not configured yet.</p> : subscriptions?.length ? subscriptions.map((subscription, index) => <p key={index}>{subscription.stripe_price_id === "price_1UgAJMBuFp984TxnNQJI9Jn7" ? "Pro" : "Premium"} · {subscription.status}</p>) : <p>No test subscription recorded yet.</p>}
      </section>
      {hasActivePlan && <p><Link className="workspace-action" href="/workspace">Continue to your workspaces →</Link></p>}
      <section className="workspace-create-card" aria-labelledby="free-trial-title">
        <h2 id="free-trial-title">30-day Free</h2>
        <p><strong>€0 for the first 30 days</strong></p>
        <p>5 hotel workspaces · 15 team members · 5 AI agents · 500 AI credits during the trial</p>
        <p>Choose Pro or Premium below to start your trial. Your chosen monthly price applies after the trial unless you cancel.</p>
        <a className="workspace-action" href="#paid-plans">Choose a plan to start →</a>
      </section>
      <div id="paid-plans" className="hotel-overview-grid">
        <section className="workspace-create-card"><h2>YOKUBO Pro</h2><p><strong>€25 / month</strong> after the 30-day trial</p><p>7 hotel workspaces · 10 team members · 3 AI agents · 1,000 AI credits per month</p><form action={startTestCheckout}><input type="hidden" name="plan" value="pro" /><button className="workspace-action">Try Pro in sandbox</button></form></section>
        <section className="workspace-create-card"><h2>YOKUBO Premium</h2><p><strong>€49.99 / month</strong> after the 30-day trial</p><p>15 hotel workspaces · 15 team members · 5 AI agents · 3,000 AI credits per month</p><form action={startTestCheckout}><input type="hidden" name="plan" value="premier" /><button className="workspace-action">Try Premium in sandbox</button></form></section>
      </div>
      <Link className="workspace-back" href="/workspace">← Back to workspaces</Link>
    </section>
  </main>;
}

