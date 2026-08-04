-- ============================================================================
--  MarketMax — bestseller snapshots
--  Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
--  Safe to re-run (idempotent).
--
--  Why: scraping on demand means a client sees mock data the moment Amazon
--  blocks us. A scheduled job fills this table instead, so /api/amazon can
--  always serve real (if slightly stale) rows — and we accumulate rank
--  history, which is the part users actually pay for.
-- ============================================================================

create table if not exists public.bestsellers_snapshots (
  id bigint generated always as identity primary key,
  cat text not null,
  asin text not null,
  rank int not null,
  title text,
  price numeric(10, 2),
  rating numeric(2, 1),
  reviews int,
  image text,
  captured_at timestamptz not null default now()
);

-- One row per product per run: the batch is identified by captured_at.
create index if not exists bestsellers_snapshots_cat_time
  on public.bestsellers_snapshots (cat, captured_at desc);

-- Rank history for a single product ("#47 -> #12 in 10 days").
create index if not exists bestsellers_snapshots_asin_time
  on public.bestsellers_snapshots (asin, captured_at desc);

alter table public.bestsellers_snapshots enable row level security;

-- Public catalogue data: anyone may read, nobody may write through the API.
-- The scraper writes with the service_role key, which bypasses RLS entirely,
-- so no insert/update/delete policy is granted to anon or authenticated.
drop policy if exists "snapshots_select_all" on public.bestsellers_snapshots;
create policy "snapshots_select_all" on public.bestsellers_snapshots
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Latest complete batch for a category — what /api/amazon falls back to.
-- ---------------------------------------------------------------------------
create or replace function public.latest_bestsellers(p_cat text)
returns setof public.bestsellers_snapshots
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.bestsellers_snapshots
  where cat = p_cat
    and captured_at = (
      select max(captured_at) from public.bestsellers_snapshots where cat = p_cat
    )
  order by rank;
$$;

grant execute on function public.latest_bestsellers(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Retention: keep 90 days of history. Call from the scraper after each run.
-- ---------------------------------------------------------------------------
create or replace function public.prune_bestsellers_snapshots()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.bestsellers_snapshots
  where captured_at < now() - interval '90 days';
$$;

revoke all on function public.prune_bestsellers_snapshots() from public, anon, authenticated;
