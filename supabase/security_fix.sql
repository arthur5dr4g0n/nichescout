-- ============================================================================
--  MarketMax — SECURITY FIX (FAILLE CRITIQUE)
--  Run AFTER schema.sql + admin.sql, once, in the Supabase SQL Editor.
--
--  Problème : la policy "profiles_update_own" laisse un user modifier SA ligne
--  SANS restriction de colonne. Un user pouvait donc faire depuis le navigateur :
--      supabase.from('profiles').update({ plan:'pro', role:'super_admin' })
--  => Pro gratuit + escalade super_admin. Bypass total du webhook Stripe.
--
--  Fix : un trigger BEFORE UPDATE qui gèle les colonnes 'plan' et 'role'
--  pour tout appel authentifié non-admin.
--    - Webhook Stripe (service key, pas d'auth.uid()) -> passe.
--    - RPC admin (admin_set_plan / admin_set_role) -> passe (is_admin()).
--    - User normal -> les changements de plan/role sont annulés en silence.
-- ============================================================================

create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null  => service key (webhook Stripe) => on laisse passer.
  -- is_admin()          => RPC admin => on laisse passer.
  if auth.uid() is not null
     and not public.is_admin()
     and (new.plan is distinct from old.plan or new.role is distinct from old.role)
  then
    new.plan := old.plan;   -- on remet l'ancienne valeur
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_privileged on public.profiles;
create trigger trg_protect_privileged
  before update on public.profiles
  for each row execute function public.protect_privileged_columns();

-- ----------------------------------------------------------------------------
-- Test rapide (optionnel) : connecté en user normal, ceci ne doit RIEN changer.
--   update public.profiles set plan = 'pro' where id = auth.uid();
--   select plan from public.profiles where id = auth.uid();  -- doit rester 'free'
-- ----------------------------------------------------------------------------
