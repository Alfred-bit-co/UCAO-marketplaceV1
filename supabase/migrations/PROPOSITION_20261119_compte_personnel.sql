-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire puis lancer dans le SQL Editor de Supabase.
-- Comptes « Personnel de l'UCAO » (branche feat/inscription-personnel).
--
-- À l'inscription, on choisit : étudiant (carte d'étudiant, comme aujourd'hui) ou personnel
-- de l'UCAO (sa profession, sans carte). La profession est vérifiée par un administrateur,
-- comme une carte : tant qu'elle n'est pas validée, « Devenir vendeur » reste fermé au personnel.
--
-- handle_new_user N'EST PAS modifiée : un déclencheur séparé, avant l'insertion du profil,
-- lit le type de compte et la profession saisis à l'inscription.
--
-- Le site fonctionne avant, pendant et après : sans ce SQL, le choix « Personnel » crée un compte
-- ordinaire et la profession reste dans les informations d'inscription (reprises par l'étape 2).
-- =====================================================================

begin;

-- 1. Nouvelles colonnes
alter table public.profiles
  add column if not exists account_type text not null default 'etudiant',
  add column if not exists profession   text;

alter table public.profiles
  add constraint profiles_account_type_check check (account_type in ('etudiant', 'personnel'));

alter table public.profiles
  add constraint profiles_profession_len check (profession is null or char_length(btrim(profession)) between 2 and 80);

-- 2. Comptes déjà créés avec le choix « Personnel » avant ce SQL (sans carte envoyée)
update public.profiles p
   set account_type = 'personnel',
       profession   = case when char_length(btrim(u.raw_user_meta_data ->> 'profession')) between 2 and 80
                           then btrim(u.raw_user_meta_data ->> 'profession') end
  from auth.users u
 where u.id = p.id
   and u.raw_user_meta_data ->> 'account_type' = 'personnel'
   and p.student_id_url is null;

-- 3. À l'inscription : type de compte et profession lus dans les informations saisies
-- (déclencheur séparé : handle_new_user reste intacte). Ne teste pas current_user.
create or replace function private.apply_signup_account_type()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta       jsonb;
  v_profession text;
begin
  select u.raw_user_meta_data into v_meta from auth.users u where u.id = new.id;
  if v_meta ->> 'account_type' = 'personnel' then
    new.account_type := 'personnel';
    v_profession := btrim(v_meta ->> 'profession');
    if char_length(v_profession) between 2 and 80 then
      new.profession := v_profession;
    end if;
  else
    new.account_type := 'etudiant';
    new.profession := null;
  end if;
  return new;
end;
$$;
revoke execute on function private.apply_signup_account_type() from public, anon, authenticated;

drop trigger if exists trg_apply_signup_account_type on public.profiles;
create trigger trg_apply_signup_account_type
  before insert on public.profiles
  for each row execute function private.apply_signup_account_type();

-- 4. Le type de compte et la profession ne se modifient pas directement depuis le site :
-- seulement par la fonction ci-dessous (ou par un administrateur). SECURITY INVOKER :
-- auth.role() est vide dans le SQL Editor, qui reste libre.
create or replace function private.guard_account_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.account_type is distinct from old.account_type or new.profession is distinct from old.profession)
     and coalesce(auth.role(), '') <> ''
     and coalesce(current_setting('app.account_rpc', true), '') <> 'on'
     and not coalesce((select private.is_admin()), false) then
    raise exception 'Utilisez le formulaire de verification pour changer de type de compte ou de profession';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_account_type on public.profiles;
create trigger trg_guard_account_type
  before update on public.profiles
  for each row execute function private.guard_account_type();

-- 5. Envoi (ou correction) de la profession par la personne elle-même
-- (utile aussi après une inscription avec Google). Repasse la vérification « en attente ».
create or replace function public.submit_staff_verification(p_profession text, p_phone text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profession text := btrim(coalesce(p_profession, ''));
begin
  if v_uid is null then
    raise exception 'Non authentifie';
  end if;

  if char_length(v_profession) < 2 or char_length(v_profession) > 80 then
    raise exception 'Profession invalide';
  end if;

  if nullif(trim(p_phone), '') is not null and trim(p_phone) !~ '^\+[0-9]{8,15}$' then
    raise exception 'Telephone invalide';
  end if;

  if exists (select 1 from public.profiles where id = v_uid and verification_status = 'approved') then
    raise exception 'Compte deja verifie';
  end if;

  -- Un étudiant qui a déjà envoyé sa carte ne passe pas en « personnel » par ce chemin.
  if exists (select 1 from public.profiles where id = v_uid and student_id_url is not null) then
    raise exception 'Carte deja envoyee';
  end if;

  perform set_config('app.account_rpc', 'on', true);
  update public.profiles
     set account_type        = 'personnel',
         profession          = v_profession,
         phone               = coalesce(nullif(trim(p_phone), ''), phone),
         verification_status = 'pending',
         verification_note   = null
   where id = v_uid;
end;
$$;
revoke execute on function public.submit_staff_verification(text, text) from public, anon;
grant execute on function public.submit_staff_verification(text, text) to authenticated;

-- 6. La validation par un administrateur accepte une profession à la place d'une carte
create or replace function public.admin_set_verification(p_user_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Acces reserve aux administrateurs';
  end if;

  if p_status is null or p_status not in ('approved', 'rejected') then
    raise exception 'Statut invalide';
  end if;

  -- une décision n'a de sens que si une carte ou une profession a été soumise
  if not exists (
    select 1 from public.profiles
     where id = p_user_id
       and (student_id_url is not null or (account_type = 'personnel' and profession is not null))
  ) then
    raise exception 'Aucune carte ni profession soumise pour ce compte';
  end if;

  if p_status = 'approved' then
    update public.profiles
       set verification_status      = 'approved',
           verification_note        = null,
           verification_reviewed_at = now()
     where id = p_user_id;
  else
    update public.profiles
       set verification_status      = 'rejected',
           verification_note        = nullif(left(trim(p_note), 500), ''),
           verification_reviewed_at = now()
     where id = p_user_id;
  end if;
end;
$$;

commit;

-- ===== VÉRIFICATION APRÈS EXÉCUTION =====
-- select account_type, count(*) from public.profiles group by 1;
-- select proname from pg_proc where proname in ('apply_signup_account_type', 'guard_account_type', 'submit_staff_verification');

-- ===== RETOUR EN ARRIÈRE =====
-- begin;
-- drop trigger if exists trg_guard_account_type on public.profiles;
-- drop trigger if exists trg_apply_signup_account_type on public.profiles;
-- drop function if exists private.guard_account_type();
-- drop function if exists private.apply_signup_account_type();
-- drop function if exists public.submit_staff_verification(text, text);
-- -- admin_set_verification : la version précédente exigeait « student_id_url is not null ».
-- alter table public.profiles drop constraint if exists profiles_profession_len;
-- alter table public.profiles drop constraint if exists profiles_account_type_check;
-- alter table public.profiles drop column if exists profession;
-- alter table public.profiles drop column if exists account_type;
-- commit;
