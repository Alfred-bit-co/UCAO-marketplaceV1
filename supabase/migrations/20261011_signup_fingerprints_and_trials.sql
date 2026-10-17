-- =====================================================================
-- UCAO Marketplace — Anti-doublon d'inscription + essai gratuit
-- Fichier à ranger dans : supabase/migrations/20261011_signup_fingerprints_and_trials.sql
--
-- Ce que fait cette migration :
--   1. Crée un "poivre" secret et des fonctions de normalisation/hachage
--   2. Crée private.signup_fingerprints (empreintes HACHÉES, sans clé étrangère :
--      elles survivent à la suppression d'un compte)
--   3. Crée private.trial_history (qui a déjà utilisé son essai gratuit)
--   4. Ajoute profiles.trial_ends_at (affichage "Essai" dans le dashboard)
--   5. Met à jour prevent_self_privilege_escalation (même logique + trial_ends_at
--      protégé + les fonctions SECURITY DEFINER du projet peuvent écrire le palier)
--   6. Trigger d'enregistrement des empreintes sur profiles (n'écrase PAS handle_new_user)
--   7. Trigger qui marque les empreintes "compte supprimé" quand un profil est supprimé
--   8. Rattrapage (backfill) des comptes existants
--   9. public.admin_duplicate_flags()  -> lecture admin des doublons
--  10. public.start_trial(p_tier)      -> démarrage sécurisé d'un essai
--
-- NE TOUCHE PAS : handle_new_user(), rôle ADMIN, activate_or_renew_subscription().
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Poivre secret + fonctions utilitaires (schéma private)
-- ---------------------------------------------------------------------
create table if not exists private.fingerprint_pepper (
  id     boolean primary key default true check (id),
  pepper bytea   not null default extensions.gen_random_bytes(32)
);
insert into private.fingerprint_pepper (id) values (true) on conflict (id) do nothing;
alter table private.fingerprint_pepper enable row level security;
revoke all on private.fingerprint_pepper from public, anon, authenticated;

create or replace function private.fp_hash(p_value text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
    extensions.hmac(
      convert_to(p_value, 'UTF8'),
      (select pepper from private.fingerprint_pepper limit 1),
      'sha256'
    ),
    'hex'
  )
$$;
revoke all on function private.fp_hash(text) from public, anon, authenticated;

create or replace function private.normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '')
$$;

create or replace function private.normalize_email(p_email text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_email  text := lower(trim(coalesce(p_email, '')));
  v_local  text;
  v_domain text;
begin
  if v_email = '' or position('@' in v_email) = 0 then
    return null;
  end if;

  v_local  := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  -- on retire le suffixe +alias (jean+2@... = jean@...)
  v_local := split_part(v_local, '+', 1);

  -- Gmail ignore les points : j.ean@gmail.com = jean@gmail.com
  if v_domain in ('gmail.com', 'googlemail.com') then
    v_local  := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  end if;

  if v_local = '' then
    return null;
  end if;

  return v_local || '@' || v_domain;
end;
$$;

create or replace function private.normalize_identity(p_name text, p_field text, p_level text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when nullif(trim(coalesce(p_name,  '')), '') is null
      or nullif(trim(coalesce(p_field, '')), '') is null
      or nullif(trim(coalesce(p_level, '')), '') is null
    then null
    else lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'))
         || '|' || lower(trim(p_field))
         || '|' || lower(trim(p_level))
  end
$$;

-- ---------------------------------------------------------------------
-- 2. Table des empreintes (aucune clé étrangère : survit à la suppression)
-- ---------------------------------------------------------------------
create table if not exists private.signup_fingerprints (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid        not null,
  kind                text        not null check (kind in ('phone', 'email', 'card', 'identity')),
  value_hash          text        not null,
  first_seen_at       timestamptz not null default now(),
  account_deleted_at  timestamptz,
  unique (user_id, kind, value_hash)
);
create index if not exists signup_fingerprints_lookup_idx
  on private.signup_fingerprints (kind, value_hash);
alter table private.signup_fingerprints enable row level security;
revoke all on private.signup_fingerprints from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Historique des essais gratuits (sans clé étrangère, idem)
-- ---------------------------------------------------------------------
create table if not exists private.trial_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid                      not null,
  tier        public.subscription_tier  not null,
  started_at  timestamptz               not null default now(),
  ends_at     timestamptz               not null
);
create index if not exists trial_history_user_idx on private.trial_history (user_id);
alter table private.trial_history enable row level security;
revoke all on private.trial_history from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Colonne d'affichage "Essai" sur le profil
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists trial_ends_at timestamptz;

-- ---------------------------------------------------------------------
-- 5. Trigger de protection : MÊME logique qu'avant, plus :
--    - trial_ends_at protégé comme le palier et l'expiration
--    - les fonctions SECURITY DEFINER (propriétaire postgres) sont de confiance
--      (indispensable pour que start_trial puisse écrire le palier)
-- ---------------------------------------------------------------------
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  -- comportement d'origine conservé : auth.role() NULL (éditeur SQL) = confiance
  v_trusted boolean :=
    coalesce(auth.role() = 'service_role', true)
    or current_user in ('postgres', 'supabase_admin');
begin
  -- role, palier, date d'expiration, fin d'essai : jamais modifiables par l'utilisateur
  if new.role is distinct from old.role
     or new.subscription_tier is distinct from old.subscription_tier
     or new.subscription_expires_at is distinct from old.subscription_expires_at
     or new.trial_ends_at is distinct from old.trial_ends_at
  then
    if not v_trusted then
      raise exception 'Modification non autorisee de role, palier, date d''expiration ou fin d''essai.';
    end if;
  end if;

  -- date de revue : service_role ou administrateur
  if new.verification_reviewed_at is distinct from old.verification_reviewed_at then
    if auth.role() <> 'service_role'
       and not coalesce((select private.is_admin()), false)
    then
      raise exception 'Modification non autorisee de la date de revue.';
    end if;
  end if;

  -- statut de verification : le vendeur peut seulement soumettre ('pending') ;
  -- approuver / rejeter exige service_role ou administrateur.
  if new.verification_status is distinct from old.verification_status then
    if auth.role() <> 'service_role'
       and not coalesce((select private.is_admin()), false)
       and new.verification_status <> 'pending'
    then
      raise exception 'Modification non autorisee du statut de verification.';
    end if;
  end if;

  -- CGU : horodatage serveur, pose une seule fois
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

-- ---------------------------------------------------------------------
-- 6. Enregistrement des empreintes (ne bloque JAMAIS une inscription)
-- ---------------------------------------------------------------------
create or replace function private.sync_signup_fingerprints()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone    text;
  v_email    text;
  v_identity text;
  v_card     text;
begin
  begin
    v_phone := private.normalize_phone(new.phone);
    if v_phone is not null then
      insert into private.signup_fingerprints (user_id, kind, value_hash)
      values (new.id, 'phone', private.fp_hash(v_phone))
      on conflict do nothing;
    end if;

    v_email := private.normalize_email(new.email);
    if v_email is not null then
      insert into private.signup_fingerprints (user_id, kind, value_hash)
      values (new.id, 'email', private.fp_hash(v_email))
      on conflict do nothing;
    end if;

    v_identity := private.normalize_identity(new.full_name, new.field_of_study, new.study_level);
    if v_identity is not null then
      insert into private.signup_fingerprints (user_id, kind, value_hash)
      values (new.id, 'identity', private.fp_hash(v_identity))
      on conflict do nothing;
    end if;

    if new.student_id_url is not null then
      select o.metadata ->> 'eTag'
        into v_card
        from storage.objects o
       where o.bucket_id = 'student-ids'
         and o.name = new.student_id_url;

      if v_card is not null then
        insert into private.signup_fingerprints (user_id, kind, value_hash)
        values (new.id, 'card', private.fp_hash(v_card))
        on conflict do nothing;
      end if;
    end if;
  exception when others then
    -- une erreur d'empreinte ne doit jamais empêcher quelqu'un de s'inscrire
    raise warning 'sync_signup_fingerprints: %', sqlerrm;
  end;

  return new;
end;
$$;
revoke all on function private.sync_signup_fingerprints() from public, anon, authenticated;

drop trigger if exists trg_sync_signup_fingerprints on public.profiles;
create trigger trg_sync_signup_fingerprints
  after insert or update of phone, email, student_id_url, full_name, field_of_study, study_level
  on public.profiles
  for each row execute function private.sync_signup_fingerprints();

-- ---------------------------------------------------------------------
-- 7. Marquer "compte supprimé" quand un profil disparaît
-- ---------------------------------------------------------------------
create or replace function private.mark_fingerprints_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.signup_fingerprints
     set account_deleted_at = now()
   where user_id = old.id
     and account_deleted_at is null;
  return old;
end;
$$;
revoke all on function private.mark_fingerprints_deleted() from public, anon, authenticated;

drop trigger if exists trg_mark_fingerprints_deleted on public.profiles;
create trigger trg_mark_fingerprints_deleted
  before delete on public.profiles
  for each row execute function private.mark_fingerprints_deleted();

-- ---------------------------------------------------------------------
-- 8. Rattrapage des comptes existants (l'ancienneté = date de création)
-- ---------------------------------------------------------------------
insert into private.signup_fingerprints (user_id, kind, value_hash, first_seen_at)
select p.id, 'phone', private.fp_hash(private.normalize_phone(p.phone)), p.created_at
  from public.profiles p
 where private.normalize_phone(p.phone) is not null
on conflict do nothing;

insert into private.signup_fingerprints (user_id, kind, value_hash, first_seen_at)
select p.id, 'email', private.fp_hash(private.normalize_email(p.email)), p.created_at
  from public.profiles p
 where private.normalize_email(p.email) is not null
on conflict do nothing;

insert into private.signup_fingerprints (user_id, kind, value_hash, first_seen_at)
select p.id, 'identity',
       private.fp_hash(private.normalize_identity(p.full_name, p.field_of_study, p.study_level)),
       p.created_at
  from public.profiles p
 where private.normalize_identity(p.full_name, p.field_of_study, p.study_level) is not null
on conflict do nothing;

insert into private.signup_fingerprints (user_id, kind, value_hash, first_seen_at)
select p.id, 'card', private.fp_hash(o.metadata ->> 'eTag'), coalesce(o.created_at, p.created_at)
  from public.profiles p
  join storage.objects o
    on o.bucket_id = 'student-ids' and o.name = p.student_id_url
 where o.metadata ->> 'eTag' is not null
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 9. Lecture admin : quels comptes ressemblent à un compte plus ancien ?
--    Non-admin => résultat vide.
--    strong = TRUE  (téléphone, e-mail normalisé ou carte identiques)  -> ROUGE
--    strong = FALSE (seulement nom + filière + niveau identiques)      -> ORANGE
-- ---------------------------------------------------------------------
create or replace function public.admin_duplicate_flags()
returns table (
  user_id               uuid,
  strong                boolean,
  kinds                 text[],
  previous_accounts     integer,
  earliest_seen_at      timestamptz,
  any_previous_deleted  boolean,
  trial_already_used    boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with pairs as (
    select f.user_id            as uid,
           f.kind               as kind,
           g.user_id            as other_id,
           g.first_seen_at      as other_seen,
           g.account_deleted_at as other_deleted
      from private.signup_fingerprints f
      join private.signup_fingerprints g
        on g.kind = f.kind
       and g.value_hash = f.value_hash
       and g.user_id <> f.user_id
       and g.first_seen_at < f.first_seen_at
  )
  select p.uid                                              as user_id,
         bool_or(p.kind in ('phone', 'email', 'card'))      as strong,
         array_agg(distinct p.kind)                         as kinds,
         count(distinct p.other_id)::integer                as previous_accounts,
         min(p.other_seen)                                  as earliest_seen_at,
         bool_or(p.other_deleted is not null)               as any_previous_deleted,
         exists (
           select 1
             from private.trial_history t
            where t.user_id in (
              select pp.other_id
                from pairs pp
               where pp.uid = p.uid
                 and pp.kind in ('phone', 'email', 'card')
            )
         )                                                  as trial_already_used
    from pairs p
   where coalesce((select private.is_admin()), false)
   group by p.uid
$$;
revoke all on function public.admin_duplicate_flags() from public, anon;
grant execute on function public.admin_duplicate_flags() to authenticated;

-- ---------------------------------------------------------------------
-- 10. Démarrage d'un essai gratuit
--     Règles : 1 essai par PERSONNE (téléphone / e-mail normalisé / carte),
--              téléphone obligatoire, pas d'abonnement actif, compte actif.
--     Durées : STANDARD 2 mois, PREMIUM 1 mois, VIP 14 jours.
-- ---------------------------------------------------------------------
create or replace function public.start_trial(p_tier text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_profile  public.profiles%rowtype;
  v_duration interval;
  v_ends     timestamptz;
begin
  if v_uid is null then
    raise exception 'Non authentifie';
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

  if v_profile.subscription_expires_at is not null
     and v_profile.subscription_expires_at > now()
  then
    raise exception 'Abonnement ou essai deja actif';
  end if;

  -- une personne = un seul essai, même après suppression/recréation du compte
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
         trial_ends_at             = v_ends
   where id = v_uid;

  insert into private.trial_history (user_id, tier, started_at, ends_at)
  values (v_uid, p_tier::public.subscription_tier, now(), v_ends);

  return v_ends;
end;
$$;
revoke all on function public.start_trial(text) from public, anon;
grant execute on function public.start_trial(text) to authenticated;

commit;

-- =====================================================================
-- OPTIONNEL — À EXÉCUTER SÉPARÉMENT, SEULEMENT APRÈS TON ACCORD
-- (suppression) : l'ancienne surcharge sans aucun contrôle, déjà privée de
-- ses droits publics, mais dangereuse si un droit était rouvert par erreur.
-- =====================================================================
-- drop function public.activate_or_renew_subscription(uuid, public.subscription_tier);