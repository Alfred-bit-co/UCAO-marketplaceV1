-- Refonte des stands : categorie, logo, contact WhatsApp et modes proposes par le vendeur.
-- Appliquee en production le 2026-10-26 (table de 1 stand au moment de la migration).
-- Operation purement additive : aucune colonne existante n'est modifiee ni supprimee.
--
-- ATTENTION : whatsapp_phone est PUBLIC (les stands valides sont lisibles par tous).
-- Le vendeur doit le saisir volontairement, avec un texte qui le lui dit.
--
-- Retour en arriere :
--   alter table public.stands drop column category, drop column logo_url,
--     drop column whatsapp_phone, drop column contact_modes;

alter table public.stands
  add column if not exists category text not null default 'autres',
  add column if not exists logo_url text,
  add column if not exists whatsapp_phone text,
  add column if not exists contact_modes text[] not null default '{}';

alter table public.stands drop constraint if exists stands_category_check;
alter table public.stands add constraint stands_category_check
  check (category in ('alimentation','mode-accessoires','informatique','services','education','sante-bien-etre','autres'));

alter table public.stands drop constraint if exists stands_whatsapp_phone_check;
alter table public.stands add constraint stands_whatsapp_phone_check
  check (whatsapp_phone is null or whatsapp_phone ~ '^\+[0-9]{8,15}$');

alter table public.stands drop constraint if exists stands_contact_modes_check;
alter table public.stands add constraint stands_contact_modes_check
  check (contact_modes <@ array['sur_place','reservation','livraison','sur_commande','en_ligne','rendez_vous']::text[]);
