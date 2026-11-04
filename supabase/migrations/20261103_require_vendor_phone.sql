-- =====================================================================
-- UCAO Marketplace — Numéro WhatsApp obligatoire pour publier
--
-- Problème : un vendeur sans numéro (profiles.phone NULL) peut publier, mais le bouton
-- « Contacter » de ses produits ne mène nulle part. La vente se fait 100 % sur WhatsApp.
--
-- Effet : un produit ou un stand ne peut plus être CRÉÉ si le profil de son propriétaire
-- (user_id) n'a pas de numéro. Les produits et stands déjà en ligne ne sont pas touchés
-- (triggers BEFORE INSERT uniquement), et la modification d'un produit existant reste possible.
--
-- À exécuter dans Supabase > SQL Editor. Sans danger : aucune donnée n'est modifiée.
-- Les triggers BEFORE s'exécutent par ordre alphabétique : celui-ci passe après les contrôles
-- existants (check_*_limit, trg_block_suspended_*), dont les messages restent prioritaires.
-- =====================================================================

begin;

create or replace function public.require_vendor_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
      from public.profiles p
     where p.id = new.user_id
       and nullif(btrim(p.phone), '') is not null
  ) then
    if tg_table_name = 'stands' then
      raise exception 'Ajoute ton numéro WhatsApp dans ton profil avant de créer un stand.';
    end if;
    raise exception 'Ajoute ton numéro WhatsApp dans ton profil avant de publier un produit.';
  end if;
  return new;
end;
$$;

-- Fonction réservée aux triggers : personne ne doit pouvoir l'appeler directement.
revoke execute on function public.require_vendor_phone() from public, anon, authenticated;

drop trigger if exists trg_require_vendor_phone on public.products;
create trigger trg_require_vendor_phone
  before insert on public.products
  for each row execute function public.require_vendor_phone();

drop trigger if exists trg_require_vendor_phone on public.stands;
create trigger trg_require_vendor_phone
  before insert on public.stands
  for each row execute function public.require_vendor_phone();

commit;

-- ===== VÉRIFICATIONS (à lancer une par une) =====
-- a) Les deux triggers existent :
--    select c.relname as table_name, t.tgname
--      from pg_trigger t join pg_class c on c.oid = t.tgrelid
--     where t.tgname = 'trg_require_vendor_phone';
--
-- b) Vendeurs encore sans numéro (ils ne pourront plus publier tant qu'ils ne l'ajoutent pas) :
--    select count(*) from public.profiles
--     where role = 'VENDEUR' and nullif(btrim(phone), '') is null;

-- ===== RETOUR EN ARRIÈRE =====
-- begin;
-- drop trigger if exists trg_require_vendor_phone on public.products;
-- drop trigger if exists trg_require_vendor_phone on public.stands;
-- drop function if exists public.require_vendor_phone();
-- commit;
