-- Appliquée en production le 06/11/2026 par Alfred (SQL Editor) — ne pas rejouer

create or replace function private.protect_profile_admin_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trusted boolean :=
    coalesce(auth.role() = 'service_role', true)
    or current_user in ('postgres', 'supabase_admin')
    or coalesce((select private.is_admin()), false);
begin
  if v_trusted then
    return new;
  end if;
  if new.student_id_url is distinct from old.student_id_url then
    raise exception 'Modification non autorisee de la carte d''etudiant (passer par submit_student_verification).';
  end if;
  if new.verification_note is distinct from old.verification_note then
    raise exception 'Modification non autorisee de la note de verification.';
  end if;
  if new.email is distinct from old.email then
    raise exception 'Modification non autorisee de l''e-mail du profil.';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'Modification non autorisee de la date de creation.';
  end if;
  return new;
end;
$$;

revoke execute on function private.protect_profile_admin_fields() from public, anon;
grant execute on function private.protect_profile_admin_fields() to authenticated;

drop trigger if exists trg_protect_profile_admin_fields on public.profiles;
create trigger trg_protect_profile_admin_fields
  before update on public.profiles
  for each row execute function private.protect_profile_admin_fields();
