-- =====================================================================
-- DÉJÀ APPLIQUÉE EN PRODUCTION LE 02/11/2026 — NE PAS REJOUER.
-- Fichier conservé comme TRACE (repris de la PR #10, chore/audit-securite-design).
-- Vérifié en base le 06/11/2026 : vue public_profiles identique, déclencheur
-- trg_check_product_stand_owner présent, policy orders avec status = 'pending'.
-- =====================================================================

-- =====================================================================
-- UCAO Marketplace — Correctifs de l'audit de sécurité du 02/11/2026
--
-- À exécuter d'un seul bloc dans Supabase > SQL Editor.
-- Sans danger : aucune donnée n'est supprimée ni modifiée. Le site continue
-- de fonctionner pendant et après l'exécution.
--
--   1. public_profiles ne divulgue plus le téléphone ni le nom de TOUS les comptes
--   2. un produit ne peut être rattaché qu'à un stand de son propre vendeur
--   3. un utilisateur ne peut plus créer lui-même une commande « payée »
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Vue publique des profils
--    Avant : n'importe quel visiteur (clé anon publique) pouvait lire le nom ET le
--    téléphone de chaque compte, acheteurs et administrateurs compris :
--      select * from public_profiles;
--    Après :
--      - seuls les vendeurs et les auteurs d'un avis publié apparaissent
--        (ce sont les seuls noms que le site affiche) ;
--      - le téléphone n'est visible que pour un vendeur (bouton WhatsApp du catalogue).
--    Mêmes colonnes et mêmes types : la vue catalog_products, qui en dépend, reste valide.
-- ---------------------------------------------------------------------
create or replace view public.public_profiles
with (security_invoker = false)
as
select
  p.id,
  p.full_name,
  p.role,
  case when p.role = 'VENDEUR' then p.phone end as phone,
  p.subscription_tier
from public.profiles p
where p.role = 'VENDEUR'
   or exists (
     select 1 from public.platform_reviews r
     where r.user_id = p.id and r.status = 'approved'
   );

revoke all on public.public_profiles from public, anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Un produit ne peut pointer que vers un stand du même vendeur
--    Avant : la policy d'insertion ne contrôlait que user_id. Un vendeur pouvait
--    renseigner le stand_id d'un autre vendeur et faire apparaître son produit chez lui.
-- ---------------------------------------------------------------------
create or replace function public.check_product_stand_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stand_id is not null
     and (tg_op = 'INSERT' or new.stand_id is distinct from old.stand_id or new.user_id is distinct from old.user_id)
     and not exists (
       select 1 from public.stands s
       where s.id = new.stand_id and s.user_id = new.user_id
     )
  then
    raise exception 'Ce stand ne vous appartient pas';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_product_stand_owner() from public, anon, authenticated;

drop trigger if exists trg_check_product_stand_owner on public.products;
create trigger trg_check_product_stand_owner
  before insert or update of stand_id, user_id on public.products
  for each row execute function public.check_product_stand_owner();

-- ---------------------------------------------------------------------
-- 3. Commandes : statut forcé à « pending » à la création
--    (point signalé comme « optionnel » dans 20261002_subscription_payments_idempotence.sql)
--    La table orders n'est pas utilisée aujourd'hui (vente 100 % WhatsApp) : on ferme
--    la porte avant qu'elle serve.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'Users create own orders'
  ) then
    execute $p$alter policy "Users create own orders" on public.orders
      with check (((select auth.uid()) = user_id) and status = 'pending')$p$;
  end if;
end;
$$;

commit;

-- =====================================================================
-- VÉRIFICATIONS APRÈS EXÉCUTION (à lancer une par une)
-- =====================================================================
-- a) Aucun téléphone d'acheteur ou d'admin n'est visible :
--    select role, count(*) filter (where phone is not null) as avec_tel, count(*)
--    from public.public_profiles group by role;
--
-- b) Le trigger existe :
--    select tgname from pg_trigger where tgname = 'trg_check_product_stand_owner';
--
-- c) La policy des commandes contient bien « status = 'pending' » :
--    select policyname, with_check from pg_policies where tablename = 'orders';

-- ===== RETOUR EN ARRIÈRE (seulement en cas de problème) =====
-- begin;
-- create or replace view public.public_profiles with (security_invoker = false) as
--   select id, full_name, role, phone, subscription_tier from public.profiles;
-- drop trigger if exists trg_check_product_stand_owner on public.products;
-- drop function if exists public.check_product_stand_owner();
-- commit;
