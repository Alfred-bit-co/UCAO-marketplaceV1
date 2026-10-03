-- Masque les produits et stands des vendeurs dont l'abonnement a expiré.
-- Cause : des policies SELECT trop larges (using true) annulaient les policies restrictives.
-- Les policies permissives sont combinées par OU : on en garde une seule par table.
--
-- Déjà appliquée dans Supabase le 03/10/2026 (test visiteur anonyme : 19 -> 13 produits visibles).
-- Ce fichier sert de trace dans le dépôt.
--
-- ATTENTION : ne pas retirer le droit d'exécution de is_active_vendor() et is_admin() à anon/authenticated,
-- ces policies les appellent au nom du visiteur.

begin;

-- ===== PRODUCTS =====
drop policy if exists "Products are readable" on public.products;
drop policy if exists "Active vendor products are readable" on public.products;
drop policy if exists "Products readable by owner, admin or active vendor" on public.products;

create policy "Products readable by owner, admin or active vendor"
  on public.products
  for select
  to public
  using (
    (select auth.uid()) = user_id
    or (select public.is_admin())
    or public.is_active_vendor(user_id)
  );

-- ===== STANDS =====
drop policy if exists "Stands are readable" on public.stands;
drop policy if exists "Approved active stands are readable" on public.stands;
drop policy if exists "Stands readable by owner, admin or approved active vendor" on public.stands;

create policy "Stands readable by owner, admin or approved active vendor"
  on public.stands
  for select
  to public
  using (
    (select auth.uid()) = user_id
    or (select public.is_admin())
    or (status = 'approved'::public.stand_status and public.is_active_vendor(user_id))
  );

commit;

-- ===== ROLLBACK (à n'utiliser qu'en cas de problème) =====
-- begin;
-- drop policy if exists "Products readable by owner, admin or active vendor" on public.products;
-- create policy "Products are readable" on public.products for select to public using (true);
-- drop policy if exists "Stands readable by owner, admin or approved active vendor" on public.stands;
-- create policy "Stands are readable" on public.stands for select to public
--   using ((status = 'approved'::public.stand_status) or (user_id = (select auth.uid())) or (select public.is_admin()));
-- commit;