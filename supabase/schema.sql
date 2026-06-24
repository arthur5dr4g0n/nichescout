-- ============================================================================
--  MarketMax — Supabase schema
--  Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
--  Safe to re-run (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles : one row per user (name, avatar, role, plan)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. user_data : synced Saved products + Kanban board (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  saved jsonb default '[]'::jsonb,
  board jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

drop policy if exists "user_data_all_own" on public.user_data;
create policy "user_data_all_own" on public.user_data for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. activity_logs : audit trail (login, logout, role_change, ban, delete...)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  action text not null,
  ip text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

drop policy if exists "logs_select_own" on public.activity_logs;
create policy "logs_select_own" on public.activity_logs for select using (auth.uid() = user_id);

drop policy if exists "logs_insert_own" on public.activity_logs;
create policy "logs_insert_own" on public.activity_logs for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. New-user trigger : create profile + make the FIRST user super_admin
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing int;
begin
  select count(*) into existing from public.profiles;
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when existing = 0 then 'super_admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. Self-service account deletion (cascades to profiles/user_data/logs)
--    Called from the app via supabase.rpc('delete_own_account').
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
