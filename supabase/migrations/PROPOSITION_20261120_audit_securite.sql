-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire puis lancer dans le SQL Editor de Supabase.
-- Audit de sécurité du 20/11/2026 (branche security/audit-2026-11-20).
--
-- Complète PROPOSITION_20261112_correctifs_audit.sql (PR #37 : suspension, adresses d'images,
-- envoi de fichiers, carte d'étudiant), qui reste à lancer séparément. Aucun doublon entre les deux.
--
-- 6 blocs indépendants (chacun sa transaction et son retour en arrière) :
--   A. Essai gratuit : carte d'étudiant envoyée ou profession validée (comme le site).
--   B. Profil : la date « Activé le » ne se modifie plus depuis le site.
--   C. Longueur maximale des textes (produits, stands, profils).
--   D. 5 photos au plus par produit.
--   E. Ancien panier (désactivé) : plus d'écriture possible dans orders / order_items.
--   F. Hygiène des droits : TRUNCATE/TRIGGER/REFERENCES retirés, vues en lecture seule, pg_net fermé.
--
-- État vérifié en lecture seule le 20/11/2026 :
--   - produits : nom ≤ 13 caractères, description ≤ 15 ; stands : nom ≤ 19, description ≤ 116 ;
--     profils : nom ≤ 29 ; 5 photos au plus par produit ; 0 commande, 0 ligne de commande.
--     => aucune donnée existante ne viole les blocs C et D.
--   - essais gratuits fermés (app_settings.trials_enabled = false) : le bloc A protège leur réouverture.
--
-- Rien ici ne teste current_user dans une fonction SECURITY DEFINER.
-- handle_new_user n'est pas touchée.
-- =====================================================================


-- =====================================================================
-- A. ESSAI GRATUIT : mêmes conditions que le site
-- =====================================================================
-- Aujourd'hui start_trial ne vérifie ni la carte d'étudiant ni la profession : en appelant l'API
-- directement, un compte sans carte devient vendeur et publie des produits. Le site, lui, exige
-- une carte ENVOYÉE (pas forcément validée) ou une profession VALIDÉE ; un admin nommé est dispensé.
-- Seul ajout par rapport à la version en base : le bloc « verification requise ».
begin;

create or replace function public.start_trial(p_tier text)
 returns timestamp with time zone
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_uid      uuid := (select auth.uid());
  v_profile  public.profiles%rowtype;
  v_duration interval;
  v_ends     timestamptz;
begin
  if v_uid is null then
    raise exception 'Non authentifie';
  end if;

  if coalesce((select value from private.app_settings where key = 'trials_enabled'), 'false') <> 'true' then
    raise exception 'Essais gratuits non ouverts';
  end if;

  v_duration := case p_tier
    when 'STANDARD' then interval '2 months'
    when 'PREMIUM'  then interval '1 month'
    when 'VIP'      then interval '14 days'
    else null
  end;

  if v_duration is null then
    raise exception 'Palier invalide';
  end if;

  select * into v_profile
    from public.profiles
   where id = v_uid
   for update;

  if not found then
    raise exception 'Profil introuvable';
  end if;

  if v_profile.role = 'ADMIN' then
    raise exception 'Un administrateur ne peut pas demarrer un essai';
  end if;

  if v_profile.is_active is not true then
    raise exception 'Compte suspendu';
  end if;

  if nullif(trim(coalesce(v_profile.phone, '')), '') is null then
    raise exception 'Telephone requis pour l''essai gratuit';
  end if;

  -- NOUVEAU : carte envoyée, ou profession du personnel validée, ou administrateur nommé.
  if v_profile.student_id_url is null
     and not (v_profile.account_type = 'personnel' and v_profile.verification_status = 'approved')
     and not coalesce((select private.is_admin()), false)
  then
    raise exception 'Verification requise avant l''essai gratuit';
  end if;

  if v_profile.subscription_expires_at is not null
     and v_profile.subscription_expires_at > now()
  then
    raise exception 'Abonnement ou essai deja actif';
  end if;

  if exists (
    select 1
      from private.trial_history t
     where t.user_id = v_uid
        or t.user_id in (
          select g.user_id
            from private.signup_fingerprints f
            join private.signup_fingerprints g
              on g.kind = f.kind and g.value_hash = f.value_hash
           where f.user_id = v_uid
             and f.kind in ('phone', 'email', 'card')
        )
  ) then
    raise exception 'Essai gratuit deja utilise';
  end if;

  v_ends := now() + v_duration;

  update public.profiles
     set role                      = 'VENDEUR',
         subscription_tier         = p_tier::public.subscription_tier,
         subscription_activated_at = now(),
         subscription_expires_at   = v_ends,
         trial_ends_at             = v_ends,
         cgu_accepted_at           = coalesce(cgu_accepted_at, now())
   where id = v_uid;

  insert into private.trial_history (user_id, tier, started_at, ends_at)
  values (v_uid, p_tier::public.subscription_tier, now(), v_ends);

  return v_ends;
end;
$function$;

commit;

-- Vérification A : select pg_get_functiondef('public.start_trial(text)'::regprocedure) like '%Verification requise%';
-- Retour en arrière A : relancer la même fonction SANS le bloc « NOUVEAU ».


-- =====================================================================
-- B. PROFIL : « Activé le » protégé comme les autres dates d'abonnement
-- =====================================================================
-- subscription_activated_at était modifiable par l'utilisateur lui-même (affichage seulement,
-- mais le tableau de bord et l'administration s'y fient). Seul ajout : cette colonne dans la liste.
-- La fonction reste SECURITY INVOKER (pas de « security definer ») : elle lit auth.role().
begin;

create or replace function public.prevent_self_privilege_escalation()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_trusted boolean :=
    coalesce(auth.role() = 'service_role', true)
    or current_user in ('postgres', 'supabase_admin');
begin
  if new.role is distinct from old.role
     or new.subscription_tier is distinct from old.subscription_tier
     or new.subscription_expires_at is distinct from old.subscription_expires_at
     or new.subscription_activated_at is distinct from old.subscription_activated_at
     or new.trial_ends_at is distinct from old.trial_ends_at
  then
    if not v_trusted then
      raise exception 'Modification non autorisee de role, palier, date d''expiration ou fin d''essai.';
    end if;
  end if;

  if new.verification_reviewed_at is distinct from old.verification_reviewed_at then
    if auth.role() <> 'service_role'
       and not coalesce((select private.is_admin()), false)
    then
      raise exception 'Modification non autorisee de la date de revue.';
    end if;
  end if;

  if new.verification_status is distinct from old.verification_status then
    if auth.role() <> 'service_role'
       and not coalesce((select private.is_admin()), false)
       and new.verification_status <> 'pending'
    then
      raise exception 'Modification non autorisee du statut de verification.';
    end if;
  end if;

  if new.cgu_accepted_at is distinct from old.cgu_accepted_at then
    if auth.role() <> 'service_role' then
      if old.cgu_accepted_at is not null then
        new.cgu_accepted_at := old.cgu_accepted_at;
      else
        new.cgu_accepted_at := now();
      end if;
    end if;
  end if;

  return new;
end;
$function$;

commit;

-- Vérification B : select prosecdef from pg_proc where proname = 'prevent_self_privilege_escalation';  -- doit valoir false
-- Retour en arrière B : relancer la fonction sans la ligne subscription_activated_at.


-- =====================================================================
-- C. LONGUEUR MAXIMALE DES TEXTES
-- =====================================================================
-- Sans limite, un compte peut enregistrer des mégaoctets de texte par produit (base gonflée,
-- pages très lourdes pour tous les visiteurs). Limites alignées sur les formulaires du site.
begin;

alter table public.products
  add constraint products_name_len check (char_length(name) <= 120),
  add constraint products_description_len check (description is null or char_length(description) <= 3000);

alter table public.stands
  add constraint stands_name_len check (char_length(name) <= 60),
  add constraint stands_description_len check (description is null or char_length(description) <= 600);

alter table public.profiles
  add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 100),
  add constraint profiles_field_of_study_len check (field_of_study is null or char_length(field_of_study) <= 100),
  add constraint profiles_study_level_len check (study_level is null or char_length(study_level) <= 50);

commit;

-- Retour en arrière C :
-- begin;
-- alter table public.products drop constraint if exists products_name_len, drop constraint if exists products_description_len;
-- alter table public.stands drop constraint if exists stands_name_len, drop constraint if exists stands_description_len;
-- alter table public.profiles drop constraint if exists profiles_full_name_len,
--   drop constraint if exists profiles_field_of_study_len, drop constraint if exists profiles_study_level_len;
-- commit;


-- =====================================================================
-- D. 5 PHOTOS AU PLUS PAR PRODUIT
-- =====================================================================
-- Le site en propose 5, mais l'API acceptait un nombre illimité de lignes par produit.
-- SECURITY INVOKER : la lecture de product_images est publique (policy « true »), le comptage voit tout.
begin;

create or replace function private.limit_product_images()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if (select count(*) from public.product_images i where i.product_id = new.product_id) >= 5 then
    raise exception 'Cinq photos au plus par produit';
  end if;
  return new;
end;
$function$;

revoke execute on function private.limit_product_images() from public, anon, authenticated;

drop trigger if exists trg_limit_product_images on public.product_images;
create trigger trg_limit_product_images
  before insert on public.product_images
  for each row execute function private.limit_product_images();

commit;

-- Retour en arrière D :
-- begin;
-- drop trigger if exists trg_limit_product_images on public.product_images;
-- drop function if exists private.limit_product_images();
-- commit;


-- =====================================================================
-- E. ANCIEN PANIER : plus d'écriture
-- =====================================================================
-- Le panier et l'achat sur la plateforme sont désactivés (vente 100 % WhatsApp), mais les tables
-- orders et order_items acceptaient encore des créations depuis l'API (avec un prix choisi par
-- le client dans order_items). 0 ligne aujourd'hui. La lecture de ses propres commandes reste permise.
begin;

revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

commit;

-- Retour en arrière E (le jour où le panier revient) :
-- begin;
-- grant insert, update, delete on public.orders, public.order_items to anon, authenticated;
-- commit;


-- =====================================================================
-- F. HYGIÈNE DES DROITS
-- =====================================================================
-- Droits accordés par défaut par Supabase mais inutiles au site. TRUNCATE ignore les règles RLS :
-- il n'est pas joignable par l'API aujourd'hui, mais aucune raison de le laisser.
-- Les vues statistiques et publiques ne doivent jamais être écrites par le site.
begin;

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

revoke insert, update, delete on public.vendor_signups_monthly, public.public_profiles, public.catalog_products
  from anon, authenticated;

-- pg_net (requêtes HTTP sortantes depuis la base) : ses fonctions étaient exécutables par anon et
-- authenticated. Le schéma « net » n'est pas exposé par l'API (vérifié le 20/11 : PGRST106),
-- donc pas de faille aujourd'hui ; on retire quand même ce droit (défense en profondeur).
-- L'alerte e-mail private.notify_admin_change est SECURITY DEFINER (propriétaire postgres) : non touchée.
-- NE PAS retirer l'accès au schéma « private » : les règles RLS appellent private.is_admin() etc.
revoke execute on all functions in schema net from anon, authenticated;

commit;

-- Retour en arrière F :
-- begin;
-- grant truncate, references, trigger on all tables in schema public to anon, authenticated;
-- grant insert, update, delete on public.vendor_signups_monthly to anon, authenticated;
-- grant execute on all functions in schema net to anon, authenticated;
-- commit;


-- =====================================================================
-- À FAIRE DANS LE TABLEAU DE BORD SUPABASE (pas en SQL)
-- =====================================================================
-- 1. Authentication → Providers → Email → « Prevent use of leaked passwords » : activer
--    (refuse les mots de passe déjà publiés dans des fuites ; option des offres payantes).
-- 2. Lancer aussi PROPOSITION_20261112_correctifs_audit.sql (PR #37) : suspension réellement
--    appliquée aux produits/stands, adresses d'images contrôlées par la base, envoi de fichiers
--    réservé aux vendeurs actifs.
--
-- Vérifié et volontairement laissé tel quel :
--   - public.public_profiles en SECURITY DEFINER : c'est voulu, elle n'expose que nom, rôle,
--     palier et le téléphone WhatsApp des vendeurs (déjà public sur leurs produits).
--   - alerte Supabase « pg_net dans le schéma public » : l'extension ne peut pas être déplacée
--     (pas de SET SCHEMA) ; ses fonctions vivent dans le schéma « net », non exposé, et le bloc F
--     retire leur exécution aux rôles publics.
-- =====================================================================
