-- Razorpay subscriptions: extend membership + record payment orders.
-- Run in Supabase SQL editor (Dashboard → SQL) if the migrations CLI is not used.

-- 1) Subscription fields on existing memberships
alter table public.user_memberships
  add column if not exists plan text,
  add column if not exists expires_at timestamptz,
  add column if not exists subscription_started_at timestamptz,
  add column if not exists last_razorpay_payment_id text,
  add column if not exists last_razorpay_order_id text;

comment on column public.user_memberships.plan is 'monthly | yearly';
comment on column public.user_memberships.expires_at is 'When paid access ends; NULL means no timed subscription';

create index if not exists user_memberships_expires_at_idx
  on public.user_memberships (expires_at);

-- 2) Payment orders created before checkout, marked paid after signature verify
create table if not exists public.payment_orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer not null check (amount >= 100),
  currency text not null default 'INR',
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  receipt text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payment_orders_user_id_idx
  on public.payment_orders (user_id);

create index if not exists payment_orders_status_idx
  on public.payment_orders (status);

alter table public.payment_orders enable row level security;

-- Users can read their own orders (writes happen via service role from Next.js API)
drop policy if exists "Users read own payment orders" on public.payment_orders;
create policy "Users read own payment orders"
  on public.payment_orders for select
  using (auth.uid() = user_id);

-- Optional: prevent clients from self-upgrading membership via RLS.
-- Keep existing select policies; ensure update of membership/plan/expires_at
-- is only allowed for service role (default when no update policy for authenticated).
-- If you already have a broad UPDATE policy on user_memberships, tighten it so
-- authenticated users cannot set membership to PREMIUM themselves.
