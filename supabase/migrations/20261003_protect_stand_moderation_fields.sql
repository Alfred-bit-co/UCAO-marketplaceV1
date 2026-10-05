-- Empêche un vendeur de s'auto-approuver ou de transférer son stand.
--
-- Problème : la policy "Owners and admins update stands" laisse le propriétaire modifier toutes les
-- colonnes de son stand, donc aussi `status` (pending -> approved) et `user_id`. La table n'avait
-- que des triggers sur INSERT, aucun sur UPDATE.
--
-- Règles appliquées aux rôles `authenticated` et `anon` (donc aux utilisateurs du site) :
--   - un administrateur peut tout modifier ;
--   - à la création, le statut est toujours forcé à "pending" (un vendeur ne peut pas créer un stand déjà approuvé) ;
--   - à la modification, ni `status` ni `user_id` ne peuvent changer.
-- Les rôles internes (SQL Editor, service_role) ne sont pas concernés.

begin;

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

  -- Un administrateur peut tout modifier.
  if coalesce((select public.is_admin()), false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Valeurs de l'enum stand_status : pending, approved, rejected (défaut : pending).
    new.status := 'pending'::public.stand_status;
    return new;
  end if;

  -- UPDATE par le propriétaire
  if new.status is distinct from old.status then
    raise exception 'Le statut d''un stand ne peut etre modifie que par un administrateur';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Le proprietaire d''un stand ne peut pas etre modifie';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_stand_moderation_fields on public.stands;

create trigger trg_protect_stand_moderation_fields
  before insert or update on public.stands
  for each row
  execute function public.protect_stand_moderation_fields();

-- Fonction réservée au trigger : inutile de l'exposer.
revoke execute on function public.protect_stand_moderation_fields() from public, anon, authenticated;

commit;

-- ===== ROLLBACK (à n'utiliser qu'en cas de problème) =====
-- begin;
-- drop trigger if exists trg_protect_stand_moderation_fields on public.stands;
-- drop function if exists public.protect_stand_moderation_fields();
-- commit;