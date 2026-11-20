-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire avant de l'appliquer (SQL Editor).
-- Correctifs de l'audit de sécurité du 12/11/2026 (branche security/correctifs-audit-2026-11-12).
-- Le système de likes n'est PAS touché.
--
-- 4 blocs indépendants : chacun a sa propre transaction et son retour en arrière.
--   A. Un vendeur suspendu n'est plus visible (produits, stands, téléphone).
--   B. Les adresses d'images (produits, stands) doivent venir de notre stockage.
--   C. Stockage public : seuls les vendeurs actifs (et les admins) envoient des images.
--   D. Carte d'étudiant : plus de remplacement une fois le compte approuvé.
--
-- État vérifié en lecture seule le 12/11/2026 :
--   - 0 compte suspendu ; 22 images de produits, 2 logos et 2 bannières : toutes conformes au bloc B ;
--   - 59 fichiers dans marketplace-media, tous sous products/<uuid>/ ou stands/<uuid>/ ;
--   - 3 cartes d'étudiant, toutes nommées <uuid>/carte.<ext>.
--
-- Aucune de ces fonctions ne teste current_user : elles s'appuient sur auth.uid().
-- handle_new_user n'est pas concerné.
-- =====================================================================


-- =====================================================================
-- A. SUSPENSION : masquer le vendeur suspendu
-- =====================================================================
-- Aujourd'hui private.is_active_vendor() ne regarde que le rôle et la date d'abonnement.
-- Les policies de lecture de products et stands l'utilisent : en ajoutant is_active,
-- les produits et stands d'un vendeur suspendu disparaissent pour le public
-- (le vendeur lui-même et les admins les voient toujours). Lever la suspension les fait revenir.
-- Effets voulus par ricochet : plus de like visiteur sur ses produits, et (bloc C) plus d'envoi d'images.

begin;

create or replace function private.is_active_vendor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
      and role = 'VENDEUR'
      and subscription_expires_at >= now()
      and is_active is not false
  );
$$;

-- Vue publique des vendeurs : le téléphone d'un vendeur suspendu n'est plus exposé.
-- (Mêmes colonnes, même filtre qu'avant ; la vue reste « security definer », c'est voulu.)
create or replace view public.public_profiles
with (security_invoker = false) as
select id,
       full_name,
       role,
       case
         when role = 'VENDEUR'::public.user_role and is_active is not false then phone
         else null::text
       end as phone,
       subscription_tier
  from public.profiles p
 where role = 'VENDEUR'::public.user_role
    or exists (
      select 1 from public.platform_reviews r
       where r.user_id = p.id and r.status = 'approved'::public.review_status
    );

-- Table publique vendor_public_info (copie tenue par déclencheur) : un vendeur suspendu en sort.
create or replace function public.sync_vendor_public_info()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.vendor_public_info where id = old.id;
    return old;
  end if;

  if new.role = 'VENDEUR'::public.user_role and new.is_active is not false then
    insert into public.vendor_public_info (id, full_name, role, phone, subscription_tier)
    values (new.id, new.full_name, new.role, new.phone, new.subscription_tier)
    on conflict (id) do update
      set full_name = excluded.full_name,
          role = excluded.role,
          phone = excluded.phone,
          subscription_tier = excluded.subscription_tier;
  else
    delete from public.vendor_public_info where id = new.id;
  end if;

  return new;
end;
$$;

-- Le déclencheur doit aussi réagir à un changement de is_active.
drop trigger if exists trg_sync_vendor_public_info on public.profiles;
create trigger trg_sync_vendor_public_info
  after insert or delete or update of full_name, role, phone, subscription_tier, is_active
  on public.profiles
  for each row execute function public.sync_vendor_public_info();

commit;

-- Vérification A (lecture seule) :
-- select pg_get_functiondef('private.is_active_vendor(uuid)'::regprocedure) like '%is_active is not false%';
-- Test : suspendre un compte vendeur de test depuis /admin, ouvrir le catalogue déconnecté :
--        ses produits et stands ont disparu ; lever la suspension : ils reviennent.

-- Retour en arrière A :
-- begin;
-- create or replace function private.is_active_vendor(p_user_id uuid) returns boolean
--   language sql stable security definer set search_path = 'public' as $$
--   select exists (select 1 from public.profiles
--     where id = p_user_id and role = 'VENDEUR' and subscription_expires_at >= now()); $$;
-- create or replace view public.public_profiles with (security_invoker = false) as
--   select id, full_name, role,
--          case when role = 'VENDEUR'::public.user_role then phone else null::text end as phone,
--          subscription_tier
--     from public.profiles p
--    where role = 'VENDEUR'::public.user_role
--       or exists (select 1 from public.platform_reviews r
--                   where r.user_id = p.id and r.status = 'approved'::public.review_status);
-- (remettre sync_vendor_public_info sans « and new.is_active is not false » et le déclencheur
--  sans is_active dans la liste des colonnes)
-- commit;


-- =====================================================================
-- B. IMAGES : uniquement des adresses de notre stockage
-- =====================================================================
-- Aujourd'hui url / logo_url / banner_url sont du texte libre : un vendeur peut, en appelant
-- l'API directement, pointer vers une image hébergée ailleurs (pistage des visiteurs, contenu
-- remplacé après coup). Le site n'enregistre que des adresses de marketplace-media.

begin;

alter table public.product_images
  add constraint product_images_url_storage_check
  check (url ~ '^https://kodlozakvjuegwtetewm\.supabase\.co/storage/v1/object/public/marketplace-media/products/[0-9a-f-]{36}/[A-Za-z0-9._-]+$');

alter table public.stands
  add constraint stands_logo_url_storage_check
  check (logo_url is null
         or logo_url ~ '^https://kodlozakvjuegwtetewm\.supabase\.co/storage/v1/object/public/marketplace-media/stands/[0-9a-f-]{36}/[A-Za-z0-9._-]+$');

alter table public.stands
  add constraint stands_banner_url_storage_check
  check (banner_url is null
         or banner_url ~ '^https://kodlozakvjuegwtetewm\.supabase\.co/storage/v1/object/public/marketplace-media/stands/[0-9a-f-]{36}/[A-Za-z0-9._-]+$');

commit;

-- Si une contrainte échoue (« violated by some row »), lister les lignes en cause :
-- select id, url from public.product_images
--  where url !~ '^https://kodlozakvjuegwtetewm\.supabase\.co/storage/v1/object/public/marketplace-media/products/';

-- Retour en arrière B :
-- alter table public.product_images drop constraint if exists product_images_url_storage_check;
-- alter table public.stands drop constraint if exists stands_logo_url_storage_check;
-- alter table public.stands drop constraint if exists stands_banner_url_storage_check;


-- =====================================================================
-- C. STOCKAGE PUBLIC : envoi réservé aux vendeurs actifs
-- =====================================================================
-- Aujourd'hui « Users manage own marketplace media » (ALL) laisse tout compte connecté,
-- même simple acheteur, envoyer des images (5 Mo chacune, sans limite de nombre).
-- Après : lecture et suppression de SON dossier pour tous ; envoi et remplacement seulement
-- pour un vendeur actif (abonnement en cours, non suspendu — voir bloc A) ou un admin,
-- et seulement dans products/<son id>/ ou stands/<son id>/.
-- À appliquer APRÈS le bloc A (sinon un vendeur suspendu peut encore envoyer des images).

begin;

drop policy if exists "Users manage own marketplace media" on storage.objects;

create policy "Users read own marketplace media"
  on storage.objects for select to authenticated
  using (bucket_id = 'marketplace-media'
         and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy "Users delete own marketplace media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'marketplace-media'
         and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy "Active vendors upload marketplace media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'marketplace-media'
              and (storage.foldername(name))[1] in ('products', 'stands')
              and (storage.foldername(name))[2] = (select auth.uid())::text
              and (private.is_active_vendor((select auth.uid())) or (select private.is_admin())));

create policy "Active vendors replace marketplace media"
  on storage.objects for update to authenticated
  using (bucket_id = 'marketplace-media'
         and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'marketplace-media'
              and (storage.foldername(name))[1] in ('products', 'stands')
              and (storage.foldername(name))[2] = (select auth.uid())::text
              and (private.is_active_vendor((select auth.uid())) or (select private.is_admin())));

commit;

-- Test C : en vendeur actif, ajouter une photo à un produit (doit marcher) ;
--          en simple acheteur, l'envoi doit être refusé.

-- Retour en arrière C :
-- begin;
-- drop policy if exists "Users read own marketplace media" on storage.objects;
-- drop policy if exists "Users delete own marketplace media" on storage.objects;
-- drop policy if exists "Active vendors upload marketplace media" on storage.objects;
-- drop policy if exists "Active vendors replace marketplace media" on storage.objects;
-- create policy "Users manage own marketplace media" on storage.objects for all to authenticated
--   using (bucket_id = 'marketplace-media' and (storage.foldername(name))[2] = (auth.uid())::text)
--   with check (bucket_id = 'marketplace-media' and (storage.foldername(name))[2] = (auth.uid())::text);
-- commit;


-- =====================================================================
-- D. CARTE D'ÉTUDIANT : figée une fois le compte approuvé
-- =====================================================================
-- Aujourd'hui « Users manage own student card » (ALL) permet de remplacer ou supprimer sa carte
-- à tout moment : après validation, le fichier archivé peut ne plus être celui que l'admin a vu.
-- Après : envoi, remplacement et suppression seulement tant que le compte n'est PAS approuvé,
-- et seulement sous le nom <son id>/carte.<ext>. La lecture reste assurée par les policies
-- « Users and admins read student id » et « Admins read student cards » (non modifiées).
-- La suppression d'un compte par un admin (fonction Edge, clé service) n'est pas concernée.

begin;

drop policy if exists "Users manage own student card" on storage.objects;

create policy "Users upload own student card until approved"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'student-ids'
              and name ~ ('^' || (select auth.uid())::text || '/carte\.(jpg|jpeg|png|webp|avif)$')
              and not exists (select 1 from public.profiles p
                               where p.id = (select auth.uid())
                                 and p.verification_status = 'approved'));

create policy "Users replace own student card until approved"
  on storage.objects for update to authenticated
  using (bucket_id = 'student-ids'
         and (storage.foldername(name))[1] = (select auth.uid())::text
         and not exists (select 1 from public.profiles p
                          where p.id = (select auth.uid())
                            and p.verification_status = 'approved'))
  with check (bucket_id = 'student-ids'
              and name ~ ('^' || (select auth.uid())::text || '/carte\.(jpg|jpeg|png|webp|avif)$'));

create policy "Users delete own student card until approved"
  on storage.objects for delete to authenticated
  using (bucket_id = 'student-ids'
         and (storage.foldername(name))[1] = (select auth.uid())::text
         and not exists (select 1 from public.profiles p
                          where p.id = (select auth.uid())
                            and p.verification_status = 'approved'));

commit;

-- Test D : nouveau compte → envoi de la carte (doit marcher) ; compte refusé → renvoi (doit marcher) ;
--          compte approuvé → tout nouvel envoi est refusé.

-- Retour en arrière D :
-- begin;
-- drop policy if exists "Users upload own student card until approved" on storage.objects;
-- drop policy if exists "Users replace own student card until approved" on storage.objects;
-- drop policy if exists "Users delete own student card until approved" on storage.objects;
-- create policy "Users manage own student card" on storage.objects for all to authenticated
--   using (bucket_id = 'student-ids' and (storage.foldername(name))[1] = (auth.uid())::text)
--   with check (bucket_id = 'student-ids' and (storage.foldername(name))[1] = (auth.uid())::text);
-- commit;
