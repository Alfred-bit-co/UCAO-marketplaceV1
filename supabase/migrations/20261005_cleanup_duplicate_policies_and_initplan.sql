-- Nettoyage des policies signalées par l'advisor Supabase (performance) :
--   - "Auth RLS Initialization Plan" : auth.uid() / is_admin() réévalués pour chaque ligne
--   - "Multiple Permissive Policies" : plusieurs policies permissives pour la même action
--
-- Déjà appliquée dans Supabase le 05/10/2026. Ce fichier sert de trace dans le dépôt.
-- Comportement identique à avant : lecture publique des clubs, écriture réservée aux admins,
-- un propriétaire peut modifier/supprimer son stand, un admin peut tout faire.

begin;

-- profiles : évite la réévaluation de auth.uid() / is_admin() pour chaque ligne
alter policy "Users read own profile or admins read profiles" on public.profiles
  using (((select auth.uid()) = id) or (select public.is_admin()));

-- stands : une seule policy permissive par action
drop policy if exists "Admins update stands" on public.stands;
alter policy "Owners and admins update stands" on public.stands to authenticated;

drop policy if exists "Admins delete stands" on public.stands;
drop policy if exists "Users delete own stands" on public.stands;
create policy "Owners and admins delete stands"
  on public.stands
  for delete
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- clubs : lecture publique unique + écriture réservée aux admins
drop policy if exists "Admins manage clubs" on public.clubs;
drop policy if exists "Admins delete clubs" on public.clubs;
drop policy if exists "Admins insert clubs" on public.clubs;
drop policy if exists "Admins update clubs" on public.clubs;
drop policy if exists "Everyone reads clubs" on public.clubs;

create policy "Admins insert clubs"
  on public.clubs for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins update clubs"
  on public.clubs for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete clubs"
  on public.clubs for delete to authenticated
  using ((select public.is_admin()));

commit;