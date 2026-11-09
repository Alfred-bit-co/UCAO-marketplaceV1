-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire avant de l'appliquer (SQL Editor).
-- Compteur de contacts WhatsApp par produit (branche feat/compteur-contacts).
--
-- Le site enregistre un « contact » quand quelqu'un clique sur « Contacter » /
-- « Discuter sur WhatsApp ». Le vendeur voit ses chiffres dans son tableau de bord.
-- Tant que ce SQL n'est pas appliqué, le site fonctionne normalement : les clics ne sont
-- simplement pas comptés et le bloc du tableau de bord reste caché.
--
-- Choix :
--   - Les clics sont dans le schéma private : aucune lecture ni écriture directe via l'API.
--   - Seules 2 fonctions sont exposées :
--       record_contact_click  (anon + authenticated) : enregistre un clic ;
--       get_my_contact_stats  (authenticated)        : chiffres des produits DU vendeur connecté.
--   - 1 contact compté par personne, par produit et par 24 h (double clic, retours en arrière…).
--   - Les clics du vendeur sur ses propres produits ne comptent pas.
--   - Plafond par adresse IP (hachée, comme pour les likes) : 200 clics / heure, large car
--     le Wi-Fi du campus partage la même adresse.
--   - Ces fonctions SECURITY DEFINER ne testent PAS current_user : elles s'appuient sur
--     auth.uid() (identité de l'appelant), qui reste juste en SECURITY DEFINER.
--   - Réutilise private.fp_hash, private.request_ip et private.is_active_vendor
--     (déjà utilisés par toggle_visitor_like).
-- =====================================================================

-- ÉTAPE 1 — VÉRIFICATION (lecture seule) : les 3 fonctions réutilisées existent.
-- select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'private' and proname in ('fp_hash', 'request_ip', 'is_active_vendor');

-- ÉTAPE 2 — CRÉATION
begin;

create table if not exists private.contact_clicks (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products(id) on delete cascade,
  person_key  text not null,          -- empreinte de l'utilisateur ou du visiteur (jamais l'identifiant brut)
  ip_hash     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists contact_clicks_product_created_idx
  on private.contact_clicks (product_id, created_at desc);
create index if not exists contact_clicks_person_idx
  on private.contact_clicks (person_key, product_id, created_at desc);
create index if not exists contact_clicks_ip_idx
  on private.contact_clicks (ip_hash, created_at desc);

alter table private.contact_clicks enable row level security;
revoke all on private.contact_clicks from public, anon, authenticated;

-- Enregistre un clic « Contacter ». Ne lève jamais d'erreur visible : un clic non compté
-- ne doit pas gêner l'acheteur (WhatsApp s'ouvre de toute façon).
create or replace function public.record_contact_click(p_product_id uuid, p_visitor_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner      uuid;
  v_uid        uuid := auth.uid();
  v_ip_hash    text := private.fp_hash('contact-ip|' || coalesce(private.request_ip(), 'inconnue'));
  v_person_key text;
begin
  if p_product_id is null then
    return;
  end if;

  select p.user_id into v_owner from public.products p where p.id = p_product_id;
  if v_owner is null or not private.is_active_vendor(v_owner) then
    return;
  end if;

  -- Le vendeur qui teste son propre bouton ne compte pas.
  if v_uid is not null and v_uid = v_owner then
    return;
  end if;

  v_person_key := private.fp_hash(
    'contact|' || coalesce(v_uid::text, p_visitor_id::text, 'ip:' || v_ip_hash)
  );

  -- Même personne, même produit, moins de 24 h : déjà compté.
  if exists (
    select 1 from private.contact_clicks c
     where c.person_key = v_person_key
       and c.product_id = p_product_id
       and c.created_at > now() - interval '24 hours'
  ) then
    return;
  end if;

  -- Plafond par adresse IP.
  if (select count(*) from private.contact_clicks c
       where c.ip_hash = v_ip_hash and c.created_at > now() - interval '1 hour') >= 200 then
    return;
  end if;

  insert into private.contact_clicks (product_id, person_key, ip_hash)
  values (p_product_id, v_person_key, v_ip_hash);
end;
$$;

revoke execute on function public.record_contact_click(uuid, uuid) from public;
grant execute on function public.record_contact_click(uuid, uuid) to anon, authenticated;

-- Chiffres des produits du vendeur connecté uniquement.
create or replace function public.get_my_contact_stats()
returns table (product_id uuid, total bigint, last_7_days bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select c.product_id,
         count(*)                                                      as total,
         count(*) filter (where c.created_at > now() - interval '7 days') as last_7_days
    from private.contact_clicks c
    join public.products p on p.id = c.product_id
   where p.user_id = auth.uid()
   group by c.product_id;
$$;

revoke execute on function public.get_my_contact_stats() from public, anon;
grant execute on function public.get_my_contact_stats() to authenticated;

commit;

-- ===== VÉRIFICATION APRÈS EXÉCUTION =====
-- select proname, prosecdef from pg_proc where proname in ('record_contact_click', 'get_my_contact_stats');
-- Depuis le site (déconnecté) : cliquer « Contacter » sur un produit, puis
-- select product_id, created_at from private.contact_clicks order by id desc limit 5;

-- ===== RETOUR EN ARRIÈRE =====
-- begin;
-- drop function if exists public.get_my_contact_stats();
-- drop function if exists public.record_contact_click(uuid, uuid);
-- drop table if exists private.contact_clicks;
-- commit;
