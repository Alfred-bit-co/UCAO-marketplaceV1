-- Empêche un utilisateur de publier lui-même son avis de plateforme ou de changer l'auteur.
--
-- Problème : la policy "Reviews update" laisse l'auteur modifier toutes les colonnes de son avis,
-- et "Reviews insert" ne contrôle pas le statut. Le trigger existant on_review_self_edit ne remet
-- l'avis en attente que si la note ou le commentaire changent : un simple
-- update ... set status = 'approved' passait donc sans modération.
--
-- Règles pour les rôles authenticated/anon :
--   - un administrateur peut tout faire ;
--   - à la création, le statut est toujours forcé à "pending" ;
--   - à la modification, l'auteur peut seulement remettre son avis en attente, pas l'approuver
--     (compatible avec on_review_self_edit, qui s'exécute avant et remet le statut à pending) ;
--   - l'auteur d'un avis ne peut pas être modifié.
-- Les rôles internes (SQL Editor, service_role) ne sont pas concernés.
--
-- Déjà appliquée dans Supabase le 05/10/2026 et testée (insertion forcée en pending,
-- auto-approbation refusée, approbation par un admin acceptée).

begin;

create or replace function public.protect_review_moderation_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if coalesce((select public.is_admin()), false) then
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

drop trigger if exists trg_protect_review_moderation_fields on public.platform_reviews;

create trigger trg_protect_review_moderation_fields
  before insert or update on public.platform_reviews
  for each row
  execute function public.protect_review_moderation_fields();

revoke execute on function public.protect_review_moderation_fields() from public, anon, authenticated;

commit;

-- ===== ROLLBACK (seulement en cas de problème) =====
-- begin;
-- drop trigger if exists trg_protect_review_moderation_fields on public.platform_reviews;
-- drop function if exists public.protect_review_moderation_fields();
-- commit;