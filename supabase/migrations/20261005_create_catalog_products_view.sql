-- Vue de classement du catalogue : permet de trier TOUS les produits par palier du vendeur
-- (VIP, puis Premium, puis Standard) puis par date, AVANT la pagination.
--
-- Problème corrigé : le catalogue paginait d'abord par date (created_at) puis triait par palier
-- à l'intérieur de la page seulement. Quand les produits les plus récents appartenaient tous au
-- même vendeur (Premium), le filtre "Tous" n'affichait que lui.
--
-- security_invoker = true : les policies RLS de products s'appliquent au visiteur
-- (les produits des vendeurs expirés restent donc masqués).
--
-- Déjà appliquée dans Supabase le 05/10/2026. Ce fichier sert de trace dans le dépôt.

begin;

create or replace view public.catalog_products
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.description,
  p.category,
  p.created_at,
  case pp.subscription_tier::text
    when 'VIP' then 1
    when 'PREMIUM' then 2
    else 3
  end as tier_rank
from public.products p
left join public.public_profiles pp on pp.id = p.user_id;

revoke all on public.catalog_products from public, anon, authenticated;
grant select on public.catalog_products to anon, authenticated;

commit;

-- ===== ROLLBACK (seulement en cas de problème) =====
-- drop view if exists public.catalog_products;