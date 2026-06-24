-- ============================================================================
--  MarketMax — Admin RPCs
--  Run AFTER schema.sql, once, in the Supabase SQL Editor.
--  RLS keeps users to their own row, so admin reads/writes go through these
--  SECURITY DEFINER functions (which check the caller is admin/super_admin).
-- ============================================================================

-- Is the current user an admin? (definer = no RLS recursion on profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'));
$$;

-- List every user (admin only).
create or replace function public.admin_list_users()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_authorized'; end if;
  return query select * from public.profiles order by created_at desc;
end;
$$;

-- Change a user's role (user/admin). super_admins are protected.
create or replace function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_authorized'; end if;
  if new_role not in ('user', 'admin') then raise exception 'invalid_role'; end if;
  if exists (select 1 from public.profiles where id = target and role = 'super_admin') then
    raise exception 'cannot_modify_super_admin';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target;
  insert into public.activity_logs (user_id, action, meta)
  values (auth.uid(), 'role_change', jsonb_build_object('target', target, 'role', new_role));
end;
$$;

-- Change a user's plan (free/pro).
create or replace function public.admin_set_plan(target uuid, new_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_authorized'; end if;
  if new_plan not in ('free', 'pro') then raise exception 'invalid_plan'; end if;
  update public.profiles set plan = new_plan, updated_at = now() where id = target;
  insert into public.activity_logs (user_id, action, meta)
  values (auth.uid(), 'plan_change', jsonb_build_object('target', target, 'plan', new_plan));
end;
$$;

-- Delete a user account (admin only; cascades). super_admins are protected.
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then raise exception 'not_authorized'; end if;
  if exists (select 1 from public.profiles where id = target and role = 'super_admin') then
    raise exception 'cannot_delete_super_admin';
  end if;
  insert into public.activity_logs (user_id, action, meta)
  values (auth.uid(), 'ban', jsonb_build_object('target', target));
  delete from auth.users where id = target;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_plan(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
