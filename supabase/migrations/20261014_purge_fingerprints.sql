-- =====================================================================
-- UCAO Marketplace — Purge des empreintes hachées (conservation limitée à 12 mois)
-- Fichier à ranger dans : supabase/migrations/20261014_purge_fingerprints.sql
--
-- Pourquoi : la politique de confidentialité (mise à jour par apply-dashboard.mjs)
-- annonce que les empreintes hachées et l'historique d'essai gratuit d'un compte
-- supprimé sont conservés 12 mois, puis effacés. Cette fonction applique cette règle.
--
-- Ce fichier est SANS DANGER à exécuter : il crée une fonction, il ne supprime rien
-- tant que la fonction n'est pas appelée. La planification automatique est à l'étape 2.
-- =====================================================================

create or replace function private.purge_old_fingerprints(p_months integer default 12)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if p_months < 1 then
    raise exception 'p_months doit etre >= 1';
  end if;

  with old_users as (
    select distinct user_id
      from private.signup_fingerprints
     where account_deleted_at is not null
       and account_deleted_at < now() - make_interval(months => p_months)
  ),
  del_fp as (
    delete from private.signup_fingerprints f
     using old_users o
     where f.user_id = o.user_id
    returning 1
  ),
  del_tr as (
    delete from private.trial_history t
     using old_users o
     where t.user_id = o.user_id
    returning 1
  )
  select count(*) into v_deleted from del_fp;

  return v_deleted;
end;
$$;

revoke all on function private.purge_old_fingerprints(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Étape 1 (à faire une fois, pour vérifier) : combien de lignes seraient effacées ?
-- Résultat attendu aujourd'hui : 0 (aucun compte supprimé depuis 12 mois).
-- ---------------------------------------------------------------------
-- select count(*) as lignes_a_purger
--   from private.signup_fingerprints
--  where account_deleted_at is not null
--    and account_deleted_at < now() - interval '12 months';

-- ---------------------------------------------------------------------
-- Étape 2 : planification hebdomadaire (dimanche 03:00 UTC).
-- Nécessite l'extension pg_cron (non installée aujourd'hui). Elle servira aussi
-- plus tard aux rappels d'expiration et au nettoyage des demandes d'étudiants.
-- À exécuter seulement quand tu es prêt à activer pg_cron :
-- ---------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'purge-fingerprints',
--   '0 3 * * 0',
--   $$select private.purge_old_fingerprints(12)$$
-- );
--
-- Pour vérifier la planification :   select * from cron.job;
-- Pour l'arrêter :                    select cron.unschedule('purge-fingerprints');
