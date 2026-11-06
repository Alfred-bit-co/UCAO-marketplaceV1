-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire avant toute application.
-- Audit de sécurité du 06/11/2026 (branche security/audit-2026-11).
--
-- Problème (ÉLEVÉ, à confirmer par l'ÉTAPE 1) :
--   La policy « Users update own profile » (SETUP.md) autorise un utilisateur à modifier SA
--   ligne de public.profiles, sans WITH CHECK. Le déclencheur prevent_self_privilege_escalation
--   (migration 20261011) protège role, palier, expiration, fin d'essai et vérification, mais
--   PAS (dans la version du dépôt) :
--     - is_active        : la suspension posée par un admin (admin_set_suspension) ;
--     - student_id_url   : le chemin de la carte d'étudiant (contrôlé par submit_student_*,
--                          mais modifiable directement par une requête PostgREST) ;
--     - verification_note: la note de l'admin sur la vérification.
--   Exemple d'abus depuis la console du navigateur d'un vendeur suspendu :
--     supabase.from('profiles').update({ is_active: true }).eq('id', '<mon id>')
--   Il pourrait aussi poser un student_id_url quelconque et ainsi passer le contrôle du
--   middleware (« carte envoyée ») sans avoir envoyé de carte.
--
-- Le site lui-même ne modifie JAMAIS ces 3 colonnes directement (seulement full_name, phone,
-- field_of_study, study_level, cgu_accepted_at) : le correctif ne casse aucun écran.
-- Les fonctions SECURITY DEFINER des admins (admin_set_suspension, admin_set_verification,
-- submit_student_verification…) s'exécutent en tant que propriétaire (postgres) : elles
-- restent autorisées.
--
-- Rien n'est modifié dans les fonctions, policies ou triggers existants : on AJOUTE
-- un déclencheur indépendant. handle_new_user n'est pas concerné.
-- =====================================================================


-- =====================================================================
-- ÉTAPE 1 — VÉRIFICATIONS EN LECTURE SEULE (à lancer une par une)
-- =====================================================================

-- 1a) Version en production du déclencheur anti-escalade : protège-t-il déjà is_active,
--     student_id_url et verification_note ? Si OUI, l'ÉTAPE 2 est inutile.
-- select pg_get_functiondef('public.prevent_self_privilege_escalation()'::regprocedure);

-- 1b) Droits de mise à jour colonne par colonne sur profiles pour « authenticated »
--     (si is_active n'est pas modifiable, la faille n'existe pas) :
-- select column_name,
--        has_column_privilege('authenticated', 'public.profiles', column_name, 'UPDATE') as modifiable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'profiles'
--  order by column_name;

-- 1c) Policies UPDATE actuelles sur profiles :
-- select policyname, roles, qual, with_check
--   from pg_policies where schemaname = 'public' and tablename = 'profiles' and cmd in ('UPDATE', 'ALL');

-- 1d) Fonctions présentes UNIQUEMENT en base (absentes du dépôt) : vérifier qu'elles
--     contrôlent bien le rôle ADMIN / auth.uid(), et qui peut les exécuter.
-- select p.proname,
--        p.prosecdef as security_definer,
--        has_function_privilege('anon', p.oid, 'EXECUTE') as anon_peut_executer,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as connecte_peut_executer,
--        pg_get_functiondef(p.oid) as definition
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public'
--    and p.proname in ('admin_delete_user', 'admin_set_suspension', 'submit_student_verification',
--                      'confirm_subscription_payment', 'fail_subscription_payment',
--                      'toggle_visitor_like', 'get_visitor_likes', 'trial_status', 'trials_open');
--   Attendu : admin_* vérifient role = 'ADMIN' ; confirm_/fail_subscription_payment ne sont
--   exécutables NI par anon NI par authenticated (service_role uniquement).

-- 1e) Toutes les fonctions SECURITY DEFINER exécutables par anon (à examiner une par une) :
-- select p.proname
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef
--    and has_function_privilege('anon', p.oid, 'EXECUTE')
--  order by 1;

-- 1f) Tables du schéma public SANS Row Level Security (attendu : aucune) :
-- select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 1g) Policies du stockage :
-- select policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'storage' and tablename = 'objects';


-- =====================================================================
-- ÉTAPE 2 — CORRECTIF (seulement si 1a / 1b confirment la faille)
-- =====================================================================

begin;

create or replace function private.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Même règle de confiance que prevent_self_privilege_escalation :
  -- service_role, éditeur SQL (auth.role() NULL) et fonctions SECURITY DEFINER (postgres).
  v_trusted boolean :=
    coalesce(auth.role() = 'service_role', true)
    or current_user in ('postgres', 'supabase_admin')
    or coalesce((select private.is_admin()), false);
  v_new jsonb := to_jsonb(new);
  v_old jsonb := to_jsonb(old);
begin
  if v_trusted then
    return new;
  end if;

  -- Suspension : seul un administrateur la pose ou la lève.
  if (v_new -> 'is_active') is distinct from (v_old -> 'is_active') then
    raise exception 'Modification non autorisee du statut du compte.';
  end if;

  -- Note de vérification : écrite par l'administrateur uniquement.
  if (v_new -> 'verification_note') is distinct from (v_old -> 'verification_note') then
    raise exception 'Modification non autorisee de la note de verification.';
  end if;

  -- Carte d'étudiant : uniquement un fichier réellement envoyé dans SON dossier.
  if (v_new ->> 'student_id_url') is distinct from (v_old ->> 'student_id_url') then
    if (v_new ->> 'student_id_url') is null
       or (v_new ->> 'student_id_url') !~ ('^' || auth.uid()::text || '/carte\.(jpg|png|webp|avif)$')
       or not exists (
         select 1 from storage.objects o
          where o.bucket_id = 'student-ids' and o.name = (v_new ->> 'student_id_url')
       )
    then
      raise exception 'Chemin de carte invalide';
    end if;
  end if;

  return new;
end;
$$;

-- Fonction réservée au déclencheur : personne ne doit pouvoir l'appeler directement.
revoke execute on function private.protect_profile_admin_fields() from public, anon, authenticated;

drop trigger if exists trg_protect_profile_admin_fields on public.profiles;
create trigger trg_protect_profile_admin_fields
  before update on public.profiles
  for each row execute function private.protect_profile_admin_fields();

commit;

-- ===== VÉRIFICATION APRÈS EXÉCUTION =====
-- select tgname from pg_trigger where tgname = 'trg_protect_profile_admin_fields';
-- Test (en tant que vendeur suspendu, depuis le site) : la réactivation directe doit échouer
-- avec « Modification non autorisee du statut du compte. »

-- ===== RETOUR EN ARRIÈRE =====
-- begin;
-- drop trigger if exists trg_protect_profile_admin_fields on public.profiles;
-- drop function if exists private.protect_profile_admin_fields();
-- commit;
