-- Sandbox subscription records. Clients may only read their own records.
create table public.billing_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  status text not null,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create index billing_subscriptions_user_idx on public.billing_subscriptions(user_id);
alter table public.billing_subscriptions enable row level security;
revoke all on public.billing_subscriptions from anon, authenticated;
grant select on public.billing_subscriptions to authenticated;
create policy "Users can read their own subscriptions"
  on public.billing_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
