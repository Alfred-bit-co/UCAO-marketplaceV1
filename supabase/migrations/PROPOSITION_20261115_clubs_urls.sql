-- =====================================================================
-- PROPOSITION — NON EXÉCUTÉE. À relire puis lancer dans le SQL Editor de Supabase.
-- Audit de sécurité du 15/11/2026 : verrou côté base pour les adresses des clubs.
--
-- Problème : clubs.banner_url et clubs.external_url sont des textes libres. Un compte
-- gestionnaire passant directement par l'API pouvait enregistrer un lien « javascript: »
-- ou une image hébergée ailleurs. Le site ignore déjà ces valeurs depuis le 15/11
-- (frontend/lib/clubs.ts : safeClubImageUrl / safeExternalUrl) ; ces contraintes ferment
-- aussi la porte côté base.
--
-- Vérification préalable (doit renvoyer 0 ligne ; vérifié le 15/11 : 0 ligne) :
--   select name, banner_url, external_url from public.clubs
--    where (banner_url is not null
--           and banner_url !~ '^/images/clubs/[A-Za-z0-9._-]+$'
--           and banner_url !~ '^https://kodlozakvjuegwtetewm\.supabase\.co/storage/v1/object/public/marketplace-media/clubs/[^\s\\]+$')
--       or (external_url is not null and external_url !~* '^https?://[^\s]+$');
-- =====================================================================

begin;

alter table public.clubs
  add constraint clubs_banner_url_safe check (
    banner_url is null
    or banner_url ~ '^/images/clubs/[A-Za-z0-9._-]+$'
    or (banner_url ~ '^https://kodlozakvjuegwtetewm\.supabase\.co/storage/v1/object/public/marketplace-media/clubs/[^\s\\]+$'
        and banner_url !~ '\.\.')
  );

alter table public.clubs
  add constraint clubs_external_url_http check (
    external_url is null or external_url ~* '^https?://[^\s]+$'
  );

commit;

-- ===== RETOUR EN ARRIÈRE =====
-- alter table public.clubs drop constraint if exists clubs_banner_url_safe;
-- alter table public.clubs drop constraint if exists clubs_external_url_http;
