-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire puis lancer dans le SQL Editor de Supabase.
-- Équipe des clubs (branche feat/clubs-gestionnaires).
--
-- Demande du représentant des clubs : pouvoir ajouter lui-même les autres représentants
-- comme gestionnaires des clubs, depuis l'Espace clubs.
--
-- 1. club_list_team() : ce que voit un gestionnaire des clubs (ou un admin) :
--    - les gestionnaires actuels ;
--    - les comptes inscrits par le canal « Personnel de l'UCAO » (ancien « espace administrateur ») :
--      profiles.account_type = 'personnel', ou ancienne inscription signup_kind = 'admin'.
--      Seulement les comptes dont l'e-mail est confirmé et qui ne sont pas suspendus.
-- 2. club_set_manager(user_id, enabled) :
--    - ajouter : réservé aux comptes « Personnel » listés ci-dessus (l'admin peut toujours tout faire
--      depuis le centre de pilotage, par e-mail, avec admin_set_club_manager) ;
--    - retirer : un gestionnaire ne peut retirer que les personnes qu'il a lui-même ajoutées,
--      jamais lui-même ; l'admin peut retirer tout le monde.
--
-- Rien n'est modifié dans les tables : on réutilise private.club_managers (colonne added_by).
-- handle_new_user n'est pas touchée. Le site fonctionne avant ce SQL : l'onglet « Équipe »
-- affiche alors « bientôt disponible ».
-- =====================================================================

begin;

create or replace function public.club_list_team()
returns table (
  user_id uuid,
  full_name text,
  email text,
  profession text,
  signed_up_at timestamptz,
  is_manager boolean,
  added_at timestamptz,
  can_remove boolean,
  is_me boolean
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if not private.can_manage_clubs() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  return query
    select p.id,
           p.full_name,
           p.email,
           p.profession,
           p.created_at,
           (m.user_id is not null),
           m.added_at,
           (m.user_id is not null
             and p.id <> auth.uid()
             and (private.is_admin() or m.added_by = auth.uid())),
           (p.id = auth.uid())
      from public.profiles p
      join auth.users u on u.id = p.id
      left join private.club_managers m on m.user_id = p.id
     where m.user_id is not null
        or (
          (p.account_type = 'personnel' or u.raw_user_meta_data ->> 'signup_kind' = 'admin')
          and u.email_confirmed_at is not null
          and coalesce(p.is_active, true)
        )
     order by (m.user_id is null), m.added_at, p.full_name;
end
$$;

create or replace function public.club_set_manager(p_user_id uuid, p_enabled boolean)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_name     text;
  v_is_staff boolean;
  v_active   boolean;
  v_added_by uuid;
begin
  if not private.can_manage_clubs() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  select p.full_name,
         (p.account_type = 'personnel' or u.raw_user_meta_data ->> 'signup_kind' = 'admin')
           and u.email_confirmed_at is not null,
         coalesce(p.is_active, true)
    into v_name, v_is_staff, v_active
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if p_enabled then
    if not v_is_staff and not private.is_admin() then
      raise exception 'NOT_STAFF';
    end if;
    if not v_active then
      raise exception 'ACCOUNT_SUSPENDED';
    end if;
    insert into private.club_managers (user_id, added_by)
    values (p_user_id, auth.uid())
    on conflict (user_id) do nothing;
  else
    if p_user_id = auth.uid() then
      raise exception 'CANNOT_REMOVE_SELF';
    end if;
    select m.added_by into v_added_by from private.club_managers m where m.user_id = p_user_id;
    if found then
      if not private.is_admin() and v_added_by is distinct from auth.uid() then
        raise exception 'NOT_ALLOWED';
      end if;
      delete from private.club_managers m where m.user_id = p_user_id;
    end if;
  end if;

  return json_build_object('user_id', p_user_id, 'full_name', v_name, 'enabled', p_enabled);
end
$$;

revoke all on function public.club_list_team() from public, anon;
revoke all on function public.club_set_manager(uuid, boolean) from public, anon;
grant execute on function public.club_list_team() to authenticated;
grant execute on function public.club_set_manager(uuid, boolean) to authenticated;

commit;

-- ===== ROLLBACK (seulement en cas de problème) =====
-- begin;
-- drop function if exists public.club_set_manager(uuid, boolean);
-- drop function if exists public.club_list_team();
-- commit;
