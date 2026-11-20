-- =====================================================================
-- 20261112_clubs_management.sql
-- Espace de gestion des clubs (représentant des clubs + admin)
--  * permission séparée (private.club_managers), aucun nouveau rôle
--  * clubs : couleur, WhatsApp, ordre, actif, suppression réversible
--  * club_sessions : programme hebdomadaire (calendrier coloré)
--  * club_announcements : annonces / événements
--  * RPC admin : gestionnaires, restauration, suppression définitive
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Permission « gestionnaire des clubs »
-- ---------------------------------------------------------------------
create table if not exists private.club_managers (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now()
);
alter table private.club_managers enable row level security;
revoke all on private.club_managers from anon, authenticated;

create or replace function private.can_manage_clubs()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.is_admin()
      or exists (select 1 from private.club_managers m where m.user_id = auth.uid());
$$;
revoke all on function private.can_manage_clubs() from public;
grant execute on function private.can_manage_clubs() to anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 2. Table clubs (existante, vide) : nouvelles colonnes
-- ---------------------------------------------------------------------
alter table public.clubs alter column external_url drop not null;

alter table public.clubs
  add column if not exists color       text,
  add column if not exists whatsapp    text,
  add column if not exists sort_order  integer not null default 0,
  add column if not exists is_active   boolean not null default true,
  add column if not exists updated_at  timestamptz not null default now(),
  add column if not exists updated_by  uuid references auth.users(id) on delete set null,
  add column if not exists deleted_at  timestamptz,
  add column if not exists deleted_by  uuid references auth.users(id) on delete set null;

alter table public.clubs alter column color set not null;

alter table public.clubs
  drop constraint if exists clubs_name_len,
  drop constraint if exists clubs_color_hex,
  drop constraint if exists clubs_whatsapp_format,
  drop constraint if exists clubs_description_len;
alter table public.clubs
  add constraint clubs_name_len        check (char_length(btrim(name)) between 2 and 60),
  add constraint clubs_color_hex       check (color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint clubs_whatsapp_format check (whatsapp is null or whatsapp ~ '^\+[0-9]{8,15}$'),
  add constraint clubs_description_len check (short_description is null or char_length(short_description) <= 400);

-- un nom et une couleur uniques parmi les clubs non supprimés
create unique index if not exists clubs_name_unique_alive
  on public.clubs (lower(btrim(name))) where deleted_at is null;
create unique index if not exists clubs_color_unique_alive
  on public.clubs (lower(color)) where deleted_at is null;
create index if not exists clubs_sort_idx on public.clubs (sort_order, name) where deleted_at is null;

drop trigger if exists trg_clubs_touch on public.clubs;
create trigger trg_clubs_touch before update on public.clubs
  for each row execute function private.touch_updated_at();

-- deleted_at / deleted_by ne changent QUE via les fonctions dédiées
create or replace function private.protect_club_deletion_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.deleted_at is distinct from old.deleted_at
      or new.deleted_by is distinct from old.deleted_by)
     and coalesce(current_setting('app.club_rpc', true), '') <> 'on' then
    raise exception 'Utilisez la fonction de suppression ou de restauration des clubs';
  end if;
  return new;
end $$;

drop trigger if exists trg_clubs_protect_deletion on public.clubs;
create trigger trg_clubs_protect_deletion before update on public.clubs
  for each row execute function private.protect_club_deletion_fields();

create or replace function private.set_created_by()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_by := auth.uid();
  return new;
end $$;

drop trigger if exists trg_clubs_created_by on public.clubs;
create trigger trg_clubs_created_by before insert on public.clubs
  for each row execute function private.set_created_by();

-- RLS clubs
alter table public.clubs enable row level security;
drop policy if exists "Admins delete clubs"          on public.clubs;
drop policy if exists "Admins insert clubs"          on public.clubs;
drop policy if exists "Admins update clubs"          on public.clubs;
drop policy if exists "Clubs are publicly readable"  on public.clubs;
drop policy if exists "clubs_select_anon"            on public.clubs;
drop policy if exists "clubs_select_auth"            on public.clubs;
drop policy if exists "clubs_insert_managers"        on public.clubs;
drop policy if exists "clubs_update_managers"        on public.clubs;
drop policy if exists "clubs_delete_admin"           on public.clubs;

create policy "clubs_select_anon" on public.clubs for select to anon
  using (deleted_at is null and is_active);

create policy "clubs_select_auth" on public.clubs for select to authenticated
  using (
    (deleted_at is null and (is_active or (select private.can_manage_clubs())))
    or (select private.is_admin())
  );

create policy "clubs_insert_managers" on public.clubs for insert to authenticated
  with check ((select private.can_manage_clubs()) and deleted_at is null);

create policy "clubs_update_managers" on public.clubs for update to authenticated
  using ((select private.is_admin()) or (deleted_at is null and (select private.can_manage_clubs())))
  with check ((select private.can_manage_clubs()));

-- suppression physique : admin seulement
create policy "clubs_delete_admin" on public.clubs for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- 3. Programme hebdomadaire
-- ---------------------------------------------------------------------
create table if not exists public.club_sessions (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id) on delete cascade,
  day_of_week     smallint not null check (day_of_week between 1 and 7), -- 1 = lundi … 7 = dimanche
  start_time      time not null,
  end_time        time not null,
  location_detail text check (location_detail is null or char_length(location_detail) <= 80),
  activity        text check (activity is null or char_length(activity) <= 80),
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null,
  constraint club_sessions_time_order check (end_time > start_time)
);
create index if not exists club_sessions_club_idx on public.club_sessions (club_id);
create index if not exists club_sessions_day_idx  on public.club_sessions (day_of_week, start_time);

drop trigger if exists trg_club_sessions_touch on public.club_sessions;
create trigger trg_club_sessions_touch before update on public.club_sessions
  for each row execute function private.touch_updated_at();
drop trigger if exists trg_club_sessions_created_by on public.club_sessions;
create trigger trg_club_sessions_created_by before insert on public.club_sessions
  for each row execute function private.set_created_by();

alter table public.club_sessions enable row level security;
drop policy if exists "club_sessions_select_anon" on public.club_sessions;
drop policy if exists "club_sessions_select_auth" on public.club_sessions;
drop policy if exists "club_sessions_write"       on public.club_sessions;

create policy "club_sessions_select_anon" on public.club_sessions for select to anon
  using (exists (select 1 from public.clubs c
                 where c.id = club_id and c.deleted_at is null and c.is_active));

create policy "club_sessions_select_auth" on public.club_sessions for select to authenticated
  using (
    exists (select 1 from public.clubs c
            where c.id = club_id and c.deleted_at is null and c.is_active)
    or (select private.can_manage_clubs())
  );

create policy "club_sessions_write" on public.club_sessions for all to authenticated
  using ((select private.can_manage_clubs()))
  with check (
    (select private.can_manage_clubs())
    and exists (select 1 from public.clubs c where c.id = club_id and c.deleted_at is null)
  );

-- ---------------------------------------------------------------------
-- 4. Annonces
-- ---------------------------------------------------------------------
create table if not exists public.club_announcements (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid references public.clubs(id) on delete cascade, -- null = annonce générale
  title      text not null check (char_length(btrim(title)) between 3 and 120),
  body       text not null check (char_length(btrim(body)) between 3 and 1500),
  event_at   timestamptz,       -- date de l'événement (facultative)
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create index if not exists club_announcements_club_idx on public.club_announcements (club_id);
create index if not exists club_announcements_order_idx on public.club_announcements (is_pinned desc, event_at, created_at desc);

drop trigger if exists trg_club_announcements_touch on public.club_announcements;
create trigger trg_club_announcements_touch before update on public.club_announcements
  for each row execute function private.touch_updated_at();
drop trigger if exists trg_club_announcements_created_by on public.club_announcements;
create trigger trg_club_announcements_created_by before insert on public.club_announcements
  for each row execute function private.set_created_by();

alter table public.club_announcements enable row level security;
drop policy if exists "club_announcements_select_anon" on public.club_announcements;
drop policy if exists "club_announcements_select_auth" on public.club_announcements;
drop policy if exists "club_announcements_write"       on public.club_announcements;

-- visible jusqu'au lendemain de l'événement, ou 30 jours sans date
create policy "club_announcements_select_anon" on public.club_announcements for select to anon
  using (
    coalesce(event_at + interval '1 day', created_at + interval '30 days') > now()
    and (club_id is null or exists (select 1 from public.clubs c
                                    where c.id = club_id and c.deleted_at is null and c.is_active))
  );

create policy "club_announcements_select_auth" on public.club_announcements for select to authenticated
  using (
    (select private.can_manage_clubs())
    or (
      coalesce(event_at + interval '1 day', created_at + interval '30 days') > now()
      and (club_id is null or exists (select 1 from public.clubs c
                                      where c.id = club_id and c.deleted_at is null and c.is_active))
    )
  );

create policy "club_announcements_write" on public.club_announcements for all to authenticated
  using ((select private.can_manage_clubs()))
  with check (
    (select private.can_manage_clubs())
    and (club_id is null or exists (select 1 from public.clubs c where c.id = club_id and c.deleted_at is null))
  );

-- ---------------------------------------------------------------------
-- 5. Fonctions appelées par le site
-- ---------------------------------------------------------------------

-- Suis-je gestionnaire (ou admin) ?
create or replace function public.am_i_club_manager()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.can_manage_clubs();
$$;
revoke all on function public.am_i_club_manager() from public, anon;
grant execute on function public.am_i_club_manager() to authenticated;

-- Supprimer un club (réversible) : gestionnaire ou admin
create or replace function public.delete_club(p_club_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_manage_clubs() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  perform set_config('app.club_rpc', 'on', true);
  update public.clubs
     set deleted_at = now(), deleted_by = auth.uid()
   where id = p_club_id and deleted_at is null;
  if not found then
    raise exception 'Club introuvable ou déjà supprimé';
  end if;
end $$;
revoke all on function public.delete_club(uuid) from public, anon;
grant execute on function public.delete_club(uuid) to authenticated;

-- Restaurer un club supprimé : admin seulement
-- si la couleur ou le nom est repris entre-temps, l'admin passe une nouvelle couleur
create or replace function public.admin_restore_club(p_club_id uuid, p_color text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_club public.clubs%rowtype;
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  select * into v_club from public.clubs where id = p_club_id;
  if not found or v_club.deleted_at is null then
    raise exception 'Club introuvable ou non supprimé';
  end if;
  if exists (select 1 from public.clubs
             where deleted_at is null and lower(btrim(name)) = lower(btrim(v_club.name))) then
    raise exception 'NAME_TAKEN';
  end if;
  if exists (select 1 from public.clubs
             where deleted_at is null and lower(color) = lower(coalesce(p_color, v_club.color))) then
    raise exception 'COLOR_TAKEN';
  end if;
  perform set_config('app.club_rpc', 'on', true);
  update public.clubs
     set deleted_at = null, deleted_by = null,
         color = coalesce(p_color, color)
   where id = p_club_id;
end $$;
revoke all on function public.admin_restore_club(uuid, text) from public, anon;
grant execute on function public.admin_restore_club(uuid, text) to authenticated;

-- Supprimer définitivement (programme et annonces en cascade) : admin seulement
create or replace function public.admin_purge_club(p_club_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  delete from public.clubs where id = p_club_id and deleted_at is not null;
  if not found then
    raise exception 'Seul un club déjà supprimé peut être effacé définitivement';
  end if;
end $$;
revoke all on function public.admin_purge_club(uuid) from public, anon;
grant execute on function public.admin_purge_club(uuid) to authenticated;

-- Clubs supprimés (liste pour l'admin)
create or replace function public.admin_list_deleted_clubs()
returns table (id uuid, name text, color text, deleted_at timestamptz, deleted_by_name text, sessions_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    select c.id, c.name, c.color, c.deleted_at, p.full_name,
           (select count(*) from public.club_sessions s where s.club_id = c.id)
      from public.clubs c
      left join public.profiles p on p.id = c.deleted_by
     where c.deleted_at is not null
     order by c.deleted_at desc;
end $$;
revoke all on function public.admin_list_deleted_clubs() from public, anon;
grant execute on function public.admin_list_deleted_clubs() to authenticated;

-- Donner / retirer l'accès gestionnaire par e-mail : admin seulement
create or replace function public.admin_set_club_manager(p_email text, p_enabled boolean)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid;
  v_name    text;
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  select u.id into v_user_id from auth.users u
   where lower(u.email) = lower(btrim(p_email)) limit 1;
  if v_user_id is null then
    raise exception 'USER_NOT_FOUND';
  end if;
  select full_name into v_name from public.profiles where id = v_user_id;
  if p_enabled then
    insert into private.club_managers (user_id, added_by)
    values (v_user_id, auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from private.club_managers where user_id = v_user_id;
  end if;
  return json_build_object('user_id', v_user_id, 'full_name', v_name, 'enabled', p_enabled);
end $$;
revoke all on function public.admin_set_club_manager(text, boolean) from public, anon;
grant execute on function public.admin_set_club_manager(text, boolean) to authenticated;

-- Liste des gestionnaires : admin seulement
create or replace function public.admin_list_club_managers()
returns table (user_id uuid, full_name text, email text, added_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    select m.user_id, p.full_name, p.email, m.added_at
      from private.club_managers m
      left join public.profiles p on p.id = m.user_id
     order by m.added_at;
end $$;
revoke all on function public.admin_list_club_managers() from public, anon;
grant execute on function public.admin_list_club_managers() to authenticated;
