-- =====================================================================
-- UCAO Marketplace — Paiements d'abonnement : droits, unicité, idempotence
--
-- Ce script est RÉTRO-COMPATIBLE : l'ancien code du webhook continue de
-- fonctionner après son exécution (le backend utilise la clé service_role,
-- qui garde le droit d'exécuter activate_or_renew_subscription).
-- Ordre conseillé : 1) exécuter ce script  2) déployer le nouveau subscriptions.py
--
-- À exécuter d'un seul bloc dans Supabase > SQL Editor.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) URGENT — fermer l'accès public aux fonctions d'activation.
--    Constat : activate_or_renew_subscription(uuid, text) était exécutable par
--    anon et authenticated. N'importe qui pouvait s'offrir un abonnement
--    (ou changer le rôle d'un compte) via l'API publique.
-- ---------------------------------------------------------------------
revoke all on function public.activate_or_renew_subscription(uuid, text)
  from public, anon, authenticated;
grant execute on function public.activate_or_renew_subscription(uuid, text)
  to service_role;

revoke all on function public.activate_or_renew_subscription(uuid, public.subscription_tier)
  from public, anon, authenticated;
grant execute on function public.activate_or_renew_subscription(uuid, public.subscription_tier)
  to service_role;

-- ---------------------------------------------------------------------
-- 2) Unicité de l'identifiant de transaction FedaPay (index partiels :
--    plusieurs paiements « pending » sans identifiant restent autorisés).
--    Contrôle préalable fait : 0 doublon dans les deux tables.
-- ---------------------------------------------------------------------
create unique index if not exists subscription_payments_fedapay_tx_uidx
  on public.subscription_payments (fedapay_transaction_id)
  where fedapay_transaction_id is not null;

create unique index if not exists orders_fedapay_tx_uidx
  on public.orders (fedapay_transaction_id)
  where fedapay_transaction_id is not null;

-- ---------------------------------------------------------------------
-- 3) Confirmation ATOMIQUE d'un paiement.
--    - verrouille la ligne de paiement (FedaPay envoie des webhooks en tâches
--      concurrentes : le second appel attend le premier, puis voit « paid »)
--    - n'active l'abonnement qu'UNE seule fois par paiement
--    - vérifie que le montant payé correspond au montant enregistré par le serveur
--    - l'utilisateur et le palier viennent de la base, jamais du contenu du webhook
--    Retourne : activated | already_processed | unknown_payment |
--               amount_mismatch | transaction_mismatch | duplicate_transaction
-- ---------------------------------------------------------------------
create or replace function public.confirm_subscription_payment(
  p_payment_id uuid,
  p_transaction_id text,
  p_paid_amount integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment public.subscription_payments%rowtype;
begin
  select *
    into v_payment
  from public.subscription_payments
  where id = p_payment_id
  for update;

  if not found then
    return 'unknown_payment';
  end if;

  if v_payment.status = 'paid' then
    return 'already_processed';
  end if;

  if v_payment.amount is distinct from p_paid_amount then
    return 'amount_mismatch';
  end if;

  if v_payment.fedapay_transaction_id is not null
     and v_payment.fedapay_transaction_id <> p_transaction_id then
    return 'transaction_mismatch';
  end if;

  update public.subscription_payments
     set status = 'paid',
         fedapay_transaction_id = p_transaction_id
   where id = p_payment_id;

  perform public.activate_or_renew_subscription(v_payment.user_id, v_payment.tier::text);

  return 'activated';

exception
  when unique_violation then
    -- cet identifiant de transaction est déjà rattaché à un autre paiement
    return 'duplicate_transaction';
end;
$function$;

-- ---------------------------------------------------------------------
-- 4) Marquer un paiement refusé/annulé SANS jamais rétrograder un paiement déjà payé.
-- ---------------------------------------------------------------------
create or replace function public.fail_subscription_payment(
  p_payment_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.subscription_payments
     set status = case p_status
                    when 'cancelled' then 'cancelled'::public.order_status
                    else 'failed'::public.order_status
                  end
   where id = p_payment_id
     and status = 'pending';
end;
$function$;

-- ---------------------------------------------------------------------
-- 5) Ces deux fonctions ne sont appelables que par le backend (service_role).
-- ---------------------------------------------------------------------
revoke all on function public.confirm_subscription_payment(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.confirm_subscription_payment(uuid, text, integer)
  to service_role;

revoke all on function public.fail_subscription_payment(uuid, text)
  from public, anon, authenticated;
grant execute on function public.fail_subscription_payment(uuid, text)
  to service_role;

commit;

-- =====================================================================
-- OPTIONNEL (à faire plus tard, après avoir vérifié que rien ne l'appelle) :
-- supprimer l'ancienne version de la fonction (paramètre de type enum). Elle
-- écrase la date de fin au lieu de la prolonger et ne valide pas le palier.
--
--   drop function public.activate_or_renew_subscription(uuid, public.subscription_tier);
--
-- Avant : git --no-pager grep -n "activate_or_renew_subscription" -- backend frontend
-- et : select proname from pg_proc where pronamespace = 'public'::regnamespace
--      and prosrc ilike '%activate_or_renew_subscription%';
-- =====================================================================

-- =====================================================================
-- OPTIONNEL — À NE PAS EXÉCUTER sans décision. Constat : la policy
-- « Users create own orders » ne contrôle que user_id. Un utilisateur peut donc
-- insérer lui-même une commande avec le statut 'paid'. Sans effet tant que la
-- table orders n'est pas utilisée pour de vrais paiements, mais à fermer :
--
--   alter policy "Users create own orders" on public.orders
--     with check (((select auth.uid()) = user_id) and status = 'pending');
-- =====================================================================

-- =====================================================================
-- VÉRIFICATIONS APRÈS EXÉCUTION
-- =====================================================================
-- a) Droits : anon et authenticated doivent valoir false partout.
--    select p.oid::regprocedure::text as fonction,
--           has_function_privilege('anon', p.oid, 'execute') as anon,
--           has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
--           has_function_privilege('service_role', p.oid, 'execute') as service_role
--    from pg_proc p
--    where p.pronamespace = 'public'::regnamespace
--      and p.proname in ('activate_or_renew_subscription',
--                        'confirm_subscription_payment', 'fail_subscription_payment');
--
-- b) Index d'unicité présents :
--    select indexname from pg_indexes
--    where schemaname = 'public' and indexname in
--      ('subscription_payments_fedapay_tx_uidx', 'orders_fedapay_tx_uidx');
-- =====================================================================