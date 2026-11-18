-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire puis lancer dans le SQL Editor de Supabase.
-- Administrateurs nommés par le propriétaire (branche feat/admins-nommes).
--
-- Principe :
--   - Le PROPRIÉTAIRE est le compte dont profiles.role = 'ADMIN' (aujourd'hui : 1 seul compte).
--     Lui seul peut nommer ou retirer un administrateur. Il ne peut pas être retiré.
--   - Un ADMIN NOMMÉ garde son rôle (ACHETEUR ou VENDEUR) : il continue de vendre normalement.
--     Son droit d'administration est une permission à part (private.platform_admins).
--   - Toutes les règles qui utilisent private.is_admin() le reconnaissent automatiquement.
--
-- Garde-fous :
--   - e-mail confirmé obligatoire, compte suspendu refusé ;
--   - un admin nommé ne peut ni nommer, ni se valider lui-même (son stand, son avis, sa carte) ;
--   - un admin ne peut être ni supprimé ni suspendu tant qu'il a ce droit ;
--   - le rôle du propriétaire ne peut plus changer depuis le site ou l'API ;
--   - historique de chaque nomination et de chaque retrait.
--
-- ORDRE : lancer le BLOC A. Le BLOC B (alerte par e-mail) est à lancer ensuite, séparément.
-- Le site fonctionne avant, pendant et après : sans ce SQL, seul le propriétaire accède à /admin.
-- =====================================================================


-- =====================================================================
-- BLOC A — PERMISSION, FONCTIONS ET GARDE-FOUS
-- =====================================================================
begin;

-- 1. Tables privées (aucun accès direct par l'API)
create table if not exists private.platform_admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  added_by  uuid references auth.users(id) on delete set null,
  added_at  timestamptz not null default now()
);
alter table private.platform_admins enable row level security;
revoke all on private.platform_admins from public, anon, authenticated;

create table if not exists private.admin_audit (
  id              bigint generated always as identity primary key,
  action          text not null check (action in ('granted', 'revoked')),
  target_user_id  uuid not null,
  target_email    text,
  target_name     text,
  actor_id        uuid,
  created_at      timestamptz not null default now()
);
alter table private.admin_audit enable row level security;
revoke all on private.admin_audit from public, anon, authenticated;

-- 2. Qui est propriétaire, qui est administrateur
create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'ADMIN'::public.user_role
  );
$$;
revoke execute on function private.is_owner() from public;
grant execute on function private.is_owner() to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'ADMIN'::public.user_role
  )
  or exists (
    select 1
      from private.platform_admins a
      join public.profiles p on p.id = a.user_id
     where a.user_id = auth.uid() and p.is_active is not false
  );
$$;

-- 3. Fonctions appelées par le site
create or replace function public.am_i_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;
revoke execute on function public.am_i_admin() from public, anon;
grant execute on function public.am_i_admin() to authenticated;

create or replace function public.owner_set_admin(p_email text, p_enabled boolean)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id   uuid;
  v_email     text;
  v_confirmed timestamptz;
  v_name      text;
  v_role      public.user_role;
  v_active    boolean;
  v_changed   integer;
begin
  if not private.is_owner() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  select u.id, u.email, u.email_confirmed_at
    into v_user_id, v_email, v_confirmed
    from auth.users u
   where lower(u.email) = lower(btrim(p_email))
   limit 1;
  if v_user_id is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  select p.full_name, p.role, p.is_active
    into v_name, v_role, v_active
    from public.profiles p
   where p.id = v_user_id;

  if p_enabled then
    if v_role = 'ADMIN'::public.user_role then
      raise exception 'ALREADY_OWNER';
    end if;
    if v_confirmed is null then
      raise exception 'EMAIL_NOT_CONFIRMED';
    end if;
    if v_active is false then
      raise exception 'ACCOUNT_SUSPENDED';
    end if;
    insert into private.platform_admins (user_id, added_by)
    values (v_user_id, auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from private.platform_admins where user_id = v_user_id;
  end if;

  get diagnostics v_changed = row_count;
  if v_changed > 0 then
    insert into private.admin_audit (action, target_user_id, target_email, target_name, actor_id)
    values (case when p_enabled then 'granted' else 'revoked' end, v_user_id, v_email, v_name, auth.uid());
  end if;

  return json_build_object('user_id', v_user_id, 'full_name', v_name, 'enabled', p_enabled, 'changed', v_changed > 0);
end;
$$;
revoke execute on function public.owner_set_admin(text, boolean) from public, anon;
grant execute on function public.owner_set_admin(text, boolean) to authenticated;

create or replace function public.owner_list_admins()
returns table (user_id uuid, full_name text, email text, added_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_owner() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    select a.user_id, p.full_name, u.email::text, a.added_at
      from private.platform_admins a
      left join public.profiles p on p.id = a.user_id
      left join auth.users u on u.id = a.user_id
     order by a.added_at;
end;
$$;
revoke execute on function public.owner_list_admins() from public, anon;
grant execute on function public.owner_list_admins() to authenticated;

create or replace function public.owner_list_admin_audit()
returns table (id bigint, action text, target_email text, target_name text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_owner() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    select l.id, l.action, l.target_email, l.target_name, l.created_at
      from private.admin_audit l
     order by l.id desc
     limit 30;
end;
$$;
revoke execute on function public.owner_list_admin_audit() from public, anon;
grant execute on function public.owner_list_admin_audit() to authenticated;

-- 4. Règles qui testaient directement le rôle : elles reconnaissent maintenant les admins nommés
alter policy "Reviews delete" on public.platform_reviews
  using (((select auth.uid()) = user_id) or (select private.is_admin()));

alter policy "Reviews select" on public.platform_reviews
  using (((select auth.uid()) = user_id) or (status = 'approved'::public.review_status) or (select private.is_admin()));

alter policy "Reviews update" on public.platform_reviews
  using (((select auth.uid()) = user_id) or (select private.is_admin()))
  with check (((select auth.uid()) = user_id) or (select private.is_admin()));

alter policy "Users and admins read subscription payments" on public.subscription_payments
  using (((select auth.uid()) = user_id) or (select private.is_admin()));

-- 5. Un admin nommé ne peut être ni supprimé ni suspendu (le propriétaire retire d'abord le droit)
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_role public.user_role;
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Action reservee aux administrateurs';
  end if;

  if target_id = (select auth.uid()) then
    raise exception 'Vous ne pouvez pas supprimer votre propre compte';
  end if;

  select role into v_target_role from public.profiles where id = target_id;
  if not found then
    raise exception 'Utilisateur introuvable';
  end if;

  if v_target_role = 'ADMIN'::public.user_role
     or exists (select 1 from private.platform_admins a where a.user_id = target_id) then
    raise exception 'Un compte administrateur ne peut pas etre supprime';
  end if;

  -- clubs.created_by n'a pas de cascade : on detache les clubs crees par cet utilisateur
  update public.clubs set created_by = null where created_by = target_id;

  delete from auth.users where id = target_id;
end;
$$;

create or replace function public.admin_set_suspension(target_id uuid, suspended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Acces reserve aux administrateurs';
  end if;

  if target_id = auth.uid() then
    raise exception 'Vous ne pouvez pas suspendre votre propre compte';
  end if;

  if not exists (select 1 from public.profiles where id = target_id) then
    raise exception 'Compte introuvable';
  end if;

  if exists (select 1 from public.profiles where id = target_id and role = 'ADMIN')
     or exists (select 1 from private.platform_admins a where a.user_id = target_id) then
    raise exception 'Un compte administrateur ne peut pas etre suspendu';
  end if;

  update public.profiles
     set is_active = not suspended
   where id = target_id;
end;
$$;

-- 6. Un admin nommé qui vend ne valide pas ses propres contenus
-- SECURITY INVOKER (comme les versions actuelles) : ces fonctions testent current_user.
create or replace function public.protect_stand_moderation_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Rôles internes (SQL Editor, service_role) : aucune restriction.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Un administrateur peut tout modifier, sauf un admin nommé sur son propre stand.
  if coalesce((select private.is_admin()), false)
     and (
       (select private.is_owner())
       or not (new.user_id = (select auth.uid()) or (tg_op = 'UPDATE' and old.user_id = (select auth.uid())))
     ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending'::public.stand_status;
    return new;
  end if;

  -- UPDATE par le propriétaire du stand
  if new.status is distinct from old.status then
    raise exception 'Le statut d''un stand ne peut etre modifie que par un administrateur';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Le proprietaire d''un stand ne peut pas etre modifie';
  end if;

  return new;
end;
$$;

create or replace function public.protect_review_moderation_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Un administrateur peut tout modifier, sauf un admin nommé sur son propre avis.
  if coalesce((select private.is_admin()), false)
     and (
       (select private.is_owner())
       or not (new.user_id = (select auth.uid()) or (tg_op = 'UPDATE' and old.user_id = (select auth.uid())))
     ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending'::public.review_status;
    return new;
  end if;

  if new.status is distinct from old.status
     and new.status <> 'pending'::public.review_status then
    raise exception 'Le statut d''un avis ne peut etre modifie que par un administrateur';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'L''auteur d''un avis ne peut pas etre modifie';
  end if;

  return new;
end;
$$;

-- 7. Rôle du propriétaire verrouillé, carte d'étudiant non auto-validée
-- SECURITY INVOKER : ne teste pas current_user. auth.role() est vide dans le SQL Editor,
-- qui reste le seul moyen de changer de propriétaire.
create or replace function private.guard_admin_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> ''
     and new.role is distinct from old.role
     and (old.role = 'ADMIN'::public.user_role or new.role = 'ADMIN'::public.user_role) then
    raise exception 'Le role du proprietaire ne peut pas etre modifie depuis le site';
  end if;

  if new.id = auth.uid()
     and new.verification_status is distinct from old.verification_status
     and new.verification_status <> 'pending'
     and not coalesce((select private.is_owner()), false) then
    raise exception 'Vous ne pouvez pas valider votre propre carte d''etudiant';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_admin_profile on public.profiles;
create trigger trg_guard_admin_profile
  before update on public.profiles
  for each row execute function private.guard_admin_profile();

commit;

-- ===== VÉRIFICATION APRÈS LE BLOC A =====
-- select proname, prosecdef from pg_proc where proname in ('is_owner', 'am_i_admin', 'owner_set_admin', 'owner_list_admins', 'owner_list_admin_audit', 'guard_admin_profile');
-- select count(*) from private.platform_admins;  -- 0 au départ


-- =====================================================================
-- BLOC B — ALERTE PAR E-MAIL AU PROPRIÉTAIRE (à lancer après le bloc A)
--
-- L'alerte part de la base : elle ne peut pas être contournée depuis le navigateur.
-- Sans clé enregistrée, rien n'est envoyé et la nomination fonctionne quand même.
--
-- ÉTAPE 1 : créer une clé sur resend.com (API Keys → permission « Sending access »).
-- ÉTAPE 2 : l'enregistrer dans le coffre de Supabase, en lançant SEUL dans le SQL Editor
--           (ne JAMAIS mettre la vraie clé dans ce fichier ni dans un commit) :
--             select vault.create_secret('COLLER_LA_CLE_ICI', 'resend_api_key');
-- ÉTAPE 3 : lancer le bloc ci-dessous.
-- =====================================================================
begin;

create extension if not exists pg_net;

create or replace function private.notify_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key   text;
  v_to    text[];
  v_title text;
begin
  select s.decrypted_secret into v_key
    from vault.decrypted_secrets s
   where s.name = 'resend_api_key'
   limit 1;
  if v_key is null then
    return new;
  end if;

  select array_agg(u.email::text) into v_to
    from auth.users u
    join public.profiles p on p.id = u.id
   where p.role = 'ADMIN'::public.user_role;
  if v_to is null then
    return new;
  end if;

  v_title := case when new.action = 'granted'
                  then 'Nouvel administrateur sur UCAO Marketplace'
                  else 'Accès administrateur retiré sur UCAO Marketplace' end;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from', 'UCAO Marketplace <noreply@ucaomarketplace.com>',
      'to', to_jsonb(v_to),
      'subject', v_title,
      'text', v_title || E'\n\nCompte : ' || coalesce(new.target_name, 'Sans nom') || ' (' || coalesce(new.target_email, 'e-mail inconnu') || ')'
              || E'\nDate : ' || to_char(new.created_at at time zone 'Africa/Lome', 'DD/MM/YYYY à HH24:MI')
              || E'\n\nSi ce n''est pas vous, changez votre mot de passe immédiatement et retirez cet accès dans le centre de pilotage.'
    )
  );
  return new;
exception when others then
  -- Une alerte en échec ne doit jamais bloquer la nomination.
  raise warning 'notify_admin_change: %', sqlerrm;
  return new;
end;
$$;
revoke execute on function private.notify_admin_change() from public, anon, authenticated;

drop trigger if exists trg_notify_admin_change on private.admin_audit;
create trigger trg_notify_admin_change
  after insert on private.admin_audit
  for each row execute function private.notify_admin_change();

commit;


-- =====================================================================
-- RETOUR EN ARRIÈRE
-- =====================================================================
-- BLOC B :
-- begin;
-- drop trigger if exists trg_notify_admin_change on private.admin_audit;
-- drop function if exists private.notify_admin_change();
-- commit;
--
-- BLOC A (retire tous les admins nommés) :
-- begin;
-- drop trigger if exists trg_guard_admin_profile on public.profiles;
-- drop function if exists private.guard_admin_profile();
-- alter policy "Reviews delete" on public.platform_reviews
--   using (((select auth.uid()) = user_id) or exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'));
-- alter policy "Reviews select" on public.platform_reviews
--   using (((select auth.uid()) = user_id) or (status = 'approved'::public.review_status) or exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'));
-- alter policy "Reviews update" on public.platform_reviews
--   using (((select auth.uid()) = user_id) or exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'))
--   with check (((select auth.uid()) = user_id) or exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'));
-- alter policy "Users and admins read subscription payments" on public.subscription_payments
--   using (((select auth.uid()) = user_id) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'::public.user_role));
-- create or replace function private.is_admin() returns boolean language sql stable security definer set search_path = 'public'
--   as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'); $$;
-- -- admin_delete_user, admin_set_suspension, protect_*_moderation_fields, private.is_owner et les deux
-- -- tables privées restent en place : sans admin nommé, tout se comporte exactement comme avant.
-- drop function if exists public.owner_list_admin_audit();
-- drop function if exists public.owner_list_admins();
-- drop function if exists public.owner_set_admin(text, boolean);
-- drop function if exists public.am_i_admin();
-- commit;
