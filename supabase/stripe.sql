-- ============================================================================
--  MarketMax — Stripe columns + idempotency table
--  Run AFTER schema.sql (and admin.sql), once, in the Supabase SQL Editor.
-- ============================================================================

-- Stripe links on the profile
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text;

-- Daily-usage counter (free plan limits) lives in user_data
alter table public.user_data
  add column if not exists usage jsonb default '{}'::jsonb;

-- Idempotency: every processed Stripe event id is recorded once.
-- Only the webhook (service key) touches this table; RLS denies everyone else.
create table if not exists public.stripe_events (
  id text primary key,
  created_at timestamptz default now()
);
alter table public.stripe_events enable row level security;
