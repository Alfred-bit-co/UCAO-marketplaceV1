import uuid

import requests
from flask import Blueprint, current_app, jsonify, request

from ..security import check_rate_limit, clean_text, client_ip, verify_webhook_signature

subscriptions_bp = Blueprint("subscriptions", __name__)

TIER_PRICES = {"STANDARD": 500, "PREMIUM": 1500, "VIP": 5000}

# Statuts FedaPay qui marquent un paiement comme non abouti -> statut en base.
FAILED_STATUSES = {"declined": "failed", "canceled": "cancelled", "cancelled": "cancelled"}

# Statuts FedaPay que l'on traite. Tout le reste (pending, refunded...) est ignoré.
HANDLED_STATUSES = {"approved"} | set(FAILED_STATUSES)

# Résultats de confirm_subscription_payment() qui ne doivent PAS être rejoués par FedaPay :
# rien n'a été activé, une relance donnerait le même résultat. On répond 200 et on journalise.
NON_RETRYABLE_RESULTS = {
    "unknown_payment",
    "amount_mismatch",
    "transaction_mismatch",
    "duplicate_transaction",
}


def _fedapay_headers():
    return {
        "Authorization": f"Bearer {current_app.config['FEDAPAY_SECRET_KEY']}",
        "Content-Type": "application/json",
    }


def _supabase_headers():
    service_key = current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": service_key,
        "Content-Type": "application/json",
    }
    # Anciennes clés service_role = JWT (elles commencent par "eyJ") : acceptées aussi en Bearer.
    # Nouvelles clés sb_secret_... : ce ne sont pas des JWT, elles vont uniquement dans "apikey".
    if service_key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {service_key}"
    return headers


def _call_rpc(function_name, params):
    """Appelle une fonction SQL Supabase avec la clé service_role (jamais depuis le navigateur)."""
    return requests.post(
        f"{current_app.config['SUPABASE_URL']}/rest/v1/rpc/{function_name}",
        headers=_supabase_headers(),
        json=params,
        timeout=15,
    )


def _parse_uuid(value):
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, AttributeError, TypeError):
        return None


def _parse_amount(value):
    """Montant FedaPay -> entier strictement positif, sinon None."""
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number or number <= 0 or number != int(number):
        return None
    return int(number)


def _unwrap_transaction(data):
    """FedaPay enveloppe parfois la transaction sous la clé 'v1/transaction'."""
    if not isinstance(data, dict):
        return {}
    inner = data.get("v1/transaction")
    return inner if isinstance(inner, dict) else data


def _fetch_fedapay_transaction(transaction_id):
    """Relit la transaction chez FedaPay : c'est la source de vérité, pas le corps du webhook."""
    try:
        response = requests.get(
            f"{current_app.config['FEDAPAY_API_BASE_URL']}/transactions/{transaction_id}",
            headers=_fedapay_headers(),
            timeout=15,
        )
    except requests.RequestException:
        current_app.logger.exception(
            "Impossible de relire la transaction FedaPay %s.", transaction_id
        )
        return None

    if response.status_code >= 400:
        current_app.logger.error(
            "FedaPay a refusé la relecture de la transaction %s : %s %s",
            transaction_id,
            response.status_code,
            response.text,
        )
        return None

    try:
        return _unwrap_transaction(response.json())
    except ValueError:
        current_app.logger.error(
            "Réponse FedaPay illisible pour la transaction %s.", transaction_id
        )
        return None


def _rpc_text_result(response):
    """PostgREST renvoie une fonction `returns text` sous la forme d'une chaîne JSON."""
    try:
        value = response.json()
    except ValueError:
        return None
    return value if isinstance(value, str) else None


def _get_authenticated_user(req):
    """Vérifie le token Supabase envoyé par le frontend et retourne {id, email}."""
    if not current_app.config["SUPABASE_URL"] or not current_app.config["SUPABASE_ANON_KEY"]:
        current_app.logger.error("Supabase Auth n'est pas configuré.")
        return None

    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    access_token = auth_header.split(" ", 1)[1]

    try:
        response = requests.get(
            f"{current_app.config['SUPABASE_URL']}/auth/v1/user",
            headers={
                "apikey": current_app.config["SUPABASE_ANON_KEY"],
                "Authorization": f"Bearer {access_token}",
            },
            timeout=10,
        )
    except requests.RequestException:
        current_app.logger.exception("Impossible de vérifier la session Supabase.")
        return None

    if response.status_code != 200:
        current_app.logger.warning(
            "Echec verification utilisateur Supabase: %s %s",
            response.status_code,
            response.text,
        )
        return None

    data = response.json()
    return {"id": data.get("id"), "email": data.get("email"), "token": access_token}


def payment_refusal(profile, is_named_admin=False):
    """Mêmes règles que le site avant un paiement (le site seul ne suffit pas : l'API est appelable directement).

    Renvoie un message à afficher si le compte ne peut pas payer, sinon None.
    - compte suspendu : refusé ;
    - numéro WhatsApp obligatoire (les acheteurs contactent le vendeur par là) ;
    - vendeur ou propriétaire : renouvellement libre ;
    - sinon : carte d'étudiant envoyée, profession du personnel validée, ou administrateur nommé.
    """
    if not isinstance(profile, dict) or not profile:
        return "Profil introuvable. Reconnectez-vous, puis réessayez."
    if profile.get("is_active") is False:
        return "Votre compte est suspendu : le paiement est impossible. Contactez l'équipe : ucaomarketplace2026@gmail.com."
    if not str(profile.get("phone") or "").strip():
        return "Ajoutez votre numéro WhatsApp sur la page « Devenir vendeur » avant de payer."
    if profile.get("role") in ("VENDEUR", "ADMIN"):
        return None
    if profile.get("student_id_url"):
        return None
    if profile.get("account_type") == "personnel" and profile.get("verification_status") == "approved":
        return None
    if is_named_admin:
        return None
    if profile.get("account_type") == "personnel":
        return "Votre profession doit d'abord être validée par l'équipe avant de pouvoir vendre."
    return "Envoyez d'abord votre carte d'étudiant (page « Vérification ») avant de choisir un palier."


def _load_payer_profile(user_id):
    """Lit le profil avec la clé service_role. None si la lecture est impossible (panne)."""
    response = requests.get(
        f"{current_app.config['SUPABASE_URL']}/rest/v1/profiles",
        headers=_supabase_headers(),
        params={
            "id": f"eq.{user_id}",
            "select": "role,is_active,phone,student_id_url,account_type,verification_status",
        },
        timeout=10,
    )
    if response.status_code >= 400:
        current_app.logger.error("Lecture du profil payeur refusée : %s %s", response.status_code, response.text)
        return None
    rows = response.json()
    return rows[0] if isinstance(rows, list) and rows else {}


def _is_named_admin(access_token):
    """Administrateur nommé (fonction am_i_admin, appelée avec la session de l'utilisateur)."""
    try:
        response = requests.post(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/rpc/am_i_admin",
            headers={
                "apikey": current_app.config["SUPABASE_ANON_KEY"],
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={},
            timeout=10,
        )
    except requests.RequestException:
        return False
    return response.status_code == 200 and response.json() is True


@subscriptions_bp.post("/subscriptions/initiate")
def initiate_subscription():
    limiter = check_rate_limit(
        f"subscription:init:{client_ip(request)}",
        limit=10,
        window_seconds=900,
    )

    if not limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Réessayez plus tard."}), 429, {
            "Retry-After": str(limiter.retry_after)
        }

    if not current_app.config["FEDAPAY_SECRET_KEY"]:
        return jsonify({"error": "FedaPay n'est pas configuré."}), 503

    if (
        not current_app.config["SUPABASE_URL"]
        or not current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    ):
        return jsonify({"error": "Le service d'abonnement n'est pas configuré."}), 503

    user = _get_authenticated_user(request)

    if not user or not user.get("id"):
        return jsonify({"error": "Vous devez être connecté."}), 401

    data = request.get_json(silent=True) or {}

    try:
        tier = clean_text(data.get("tier", ""), 20).upper()
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if tier not in TIER_PRICES:
        return jsonify({"error": "Palier invalide."}), 400

    # Limite par compte, en plus de la limite par adresse : derrière un proxy, plusieurs
    # étudiants peuvent partager la même adresse (Wi-Fi du campus).
    user_limiter = check_rate_limit(f"subscription:init:user:{user['id']}", limit=5, window_seconds=900)
    if not user_limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Réessayez plus tard."}), 429, {
            "Retry-After": str(user_limiter.retry_after)
        }

    try:
        payer_profile = _load_payer_profile(user["id"])
    except (requests.RequestException, ValueError):
        current_app.logger.exception("Impossible de lire le profil du payeur.")
        payer_profile = None
    if payer_profile is None:
        return jsonify({"error": "Le service de paiement est temporairement indisponible."}), 502

    needs_admin_check = (
        payer_profile.get("role") not in ("VENDEUR", "ADMIN")
        and not payer_profile.get("student_id_url")
        and not (
            payer_profile.get("account_type") == "personnel"
            and payer_profile.get("verification_status") == "approved"
        )
    )
    refusal = payment_refusal(
        payer_profile,
        is_named_admin=needs_admin_check and _is_named_admin(user["token"]),
    )
    if refusal:
        return jsonify({"error": refusal}), 403

    amount = TIER_PRICES[tier]

    try:
        payment_response = requests.post(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments",
            headers={
                **_supabase_headers(),
                "Prefer": "return=representation",
            },
            json={
                "user_id": user["id"],
                "tier": tier,
                "amount": amount,
                "status": "pending",
            },
            timeout=15,
        )
    except requests.RequestException:
        current_app.logger.exception(
            "Erreur réseau lors de la création du paiement."
        )
        return jsonify(
            {"error": "Le service de paiement est temporairement indisponible."}
        ), 502

    if payment_response.status_code >= 400:
        current_app.logger.error(
            "Erreur creation subscription_payments: %s",
            payment_response.text,
        )
        return jsonify({"error": "Impossible d'initialiser le paiement."}), 502

    try:
        payment_row = payment_response.json()[0]
    except (IndexError, ValueError, TypeError):
        current_app.logger.error(
            "Réponse Supabase invalide à la création du paiement."
        )
        return jsonify({"error": "Impossible d'initialiser le paiement."}), 502

    try:
        transaction_response = requests.post(
            f"{current_app.config['FEDAPAY_API_BASE_URL']}/transactions",
            headers=_fedapay_headers(),
            json={
                "description": f"Abonnement UCAO Marketplace - Palier {tier}",
                "amount": amount,
                "currency": {"iso": "XOF"},
                "customer": {"email": user["email"]},
                "merchant_reference": payment_row["id"],
                # Page où FedaPay renvoie le vendeur (avec ?id=...&status=...). Affichage seulement :
                # l’activation reste faite par le webhook signé.
                "callback_url": f"{current_app.config['SITE_URL']}/paiement/retour",
                "custom_metadata": {
                    "user_id": user["id"],
                    "tier": tier,
                },
            },
            timeout=20,
        )
        transaction_data = transaction_response.json()
    except (requests.RequestException, ValueError):
        current_app.logger.exception("Erreur de communication avec FedaPay.")
        return jsonify(
            {"error": "Le service de paiement est temporairement indisponible."}
        ), 502

    if transaction_response.status_code >= 400:
        current_app.logger.error(
            "FedaPay a refusé la transaction: %s",
            transaction_data,
        )
        return jsonify(
            {"error": "Impossible de créer le paiement. Réessayez plus tard."}
        ), 502

    transaction_id = (
        transaction_data.get("v1/transaction", transaction_data).get("id")
        or transaction_data.get("id")
    )

    if not transaction_id:
        current_app.logger.error(
            "FedaPay n'a pas retourné d'identifiant de transaction: %s",
            transaction_data,
        )
        return jsonify(
            {"error": "Impossible de créer le paiement. Réessayez plus tard."}
        ), 502

    try:
        token_response = requests.post(
            f"{current_app.config['FEDAPAY_API_BASE_URL']}/transactions/{transaction_id}/token",
            headers=_fedapay_headers(),
            timeout=20,
        )
        token_data = token_response.json()
    except (requests.RequestException, ValueError):
        current_app.logger.exception(
            "Erreur lors de la création du lien FedaPay."
        )
        return jsonify(
            {
                "error": (
                    "Impossible de créer le lien de paiement. "
                    "Réessayez plus tard."
                )
            }
        ), 502

    if token_response.status_code >= 400:
        current_app.logger.error(
            "FedaPay n'a pas généré de lien: %s",
            token_data,
        )
        return jsonify(
            {
                "error": (
                    "Impossible de créer le lien de paiement. "
                    "Réessayez plus tard."
                )
            }
        ), 502

    payment_url = token_data.get("url") or token_data.get(
        "v1/token",
        {},
    ).get("url")

    if not payment_url:
        current_app.logger.error(
            "Réponse FedaPay sans lien de paiement: %s",
            token_data,
        )
        return jsonify(
            {
                "error": (
                    "Impossible de créer le lien de paiement. "
                    "Réessayez plus tard."
                )
            }
        ), 502

    # Rattache l'identifiant FedaPay au paiement. Avant, le résultat n'était pas contrôlé :
    # un échec silencieux laissait des paiements sans identifiant de transaction.
    try:
        patch_response = requests.patch(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments"
            f"?id=eq.{payment_row['id']}",
            headers=_supabase_headers(),
            json={
                "fedapay_transaction_id": str(transaction_id),
            },
            timeout=15,
        )
        if patch_response.status_code >= 400:
            current_app.logger.error(
                "Enregistrement de la transaction FedaPay refusé (paiement=%s, status=%s): %s",
                payment_row["id"],
                patch_response.status_code,
                patch_response.text,
            )
    except requests.RequestException:
        current_app.logger.exception(
            "Impossible d'enregistrer la transaction FedaPay."
        )

    return jsonify({"payment_url": payment_url}), 201


def _handle_approved_transaction(payment_id, transaction_id, raw_amount):
    """Confirme un paiement approuvé. Toute la logique sensible est dans la base (verrou + une seule activation)."""
    amount = _parse_amount(raw_amount)

    if transaction_id in (None, "") or amount is None:
        current_app.logger.error(
            "Webhook FedaPay approuvé mais incomplet (paiement=%s, transaction=%r, "
            "montant=%r) : revue manuelle nécessaire.",
            payment_id,
            transaction_id,
            raw_amount,
        )
        return jsonify({"received": True, "status": "invalid_payload"}), 200

    try:
        response = _call_rpc(
            "confirm_subscription_payment",
            {
                "p_payment_id": payment_id,
                "p_transaction_id": str(transaction_id),
                "p_paid_amount": amount,
            },
        )
    except requests.RequestException:
        current_app.logger.exception("Impossible de confirmer le paiement d'abonnement.")
        # 502 : FedaPay réessaiera plus tard, la confirmation est idempotente.
        return jsonify({"error": "Confirmation du paiement indisponible."}), 502

    if response.status_code >= 400:
        current_app.logger.error(
            "Erreur confirm_subscription_payment (paiement=%s): %s",
            payment_id,
            response.text,
        )
        return jsonify({"error": "Confirmation du paiement impossible."}), 502

    result = _rpc_text_result(response)

    if result == "activated":
        current_app.logger.info(
            "Abonnement activé (paiement=%s, transaction=%s).", payment_id, transaction_id
        )
        return jsonify({"received": True, "status": "paid"}), 200

    if result == "already_processed":
        current_app.logger.info(
            "Webhook déjà traité, ignoré (paiement=%s, transaction=%s).", payment_id, transaction_id
        )
        return jsonify({"received": True, "status": "already_processed"}), 200

    if result in NON_RETRYABLE_RESULTS:
        current_app.logger.error(
            "Paiement NON activé : %s (paiement=%s, transaction=%s, montant=%s). Revue manuelle nécessaire.",
            result,
            payment_id,
            transaction_id,
            amount,
        )
        return jsonify({"received": True, "status": result}), 200

    current_app.logger.error(
        "Réponse inattendue de confirm_subscription_payment (paiement=%s): %r",
        payment_id,
        response.text,
    )
    return jsonify({"error": "Confirmation du paiement impossible."}), 502


def _handle_failed_transaction(payment_id, new_status):
    """Marque un paiement refusé/annulé. Sans effet sur un paiement déjà payé (garanti par la base)."""
    try:
        response = _call_rpc(
            "fail_subscription_payment",
            {"p_payment_id": payment_id, "p_status": new_status},
        )
        if response.status_code >= 400:
            current_app.logger.error(
                "Erreur fail_subscription_payment (paiement=%s): %s",
                payment_id,
                response.text,
            )
    except requests.RequestException:
        current_app.logger.exception("Impossible de marquer le paiement comme échoué.")

    # Un échec d'enregistrement ici est sans gravité : on répond 200 pour ne pas relancer FedaPay.
    return jsonify({"received": True, "status": new_status}), 200


@subscriptions_bp.post("/subscriptions/webhook")
def subscriptions_webhook():
    payload = request.get_data()
    signature = request.headers.get("X-FedaPay-Signature", "")
    webhook_secret = current_app.config["FEDAPAY_WEBHOOK_SECRET"]

    if not webhook_secret:
        current_app.logger.error(
            "Webhook FedaPay refusé : FEDAPAY_WEBHOOK_SECRET absent."
        )
        return jsonify({"error": "Webhook non configuré."}), 503

    if not verify_webhook_signature(payload, signature, webhook_secret):
        current_app.logger.warning(
            "Signature webhook invalide (début de l'en-tête reçu : %s)", signature[:12]
        )
        return jsonify({"error": "Signature webhook invalide."}), 401

    if (
        not current_app.config["SUPABASE_URL"]
        or not current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
        or not current_app.config["FEDAPAY_SECRET_KEY"]
    ):
        current_app.logger.error("Webhook FedaPay : configuration serveur incomplète.")
        return jsonify({"error": "Service momentanément indisponible."}), 503

    event = request.get_json(silent=True) or {}
    event_transaction = _unwrap_transaction(event.get("entity") or event.get("transaction") or {})

    transaction_id = event_transaction.get("id")
    event_status = str(event_transaction.get("status") or "").lower()

    if transaction_id in (None, "") or event_status not in HANDLED_STATUSES:
        return jsonify({"received": True, "status": event_status or "ignored"}), 200

    transaction_id = str(transaction_id)

    # Le corps du webhook ne sert qu'à identifier la transaction. Statut, montant et référence
    # marchande sont relus chez FedaPay avant de toucher à l'abonnement.
    verified = _fetch_fedapay_transaction(transaction_id)
    if verified is None:
        # Panne passagère : FedaPay réessaiera plus tard.
        return jsonify({"error": "Vérification de la transaction impossible."}), 502

    provider_status = str(verified.get("status") or "").lower()

    # On ne fait confiance qu'à l'identifiant du paiement enregistré par NOTRE serveur :
    # l'utilisateur, le palier et le montant attendus sont lus dans la base, pas dans le webhook.
    payment_id = _parse_uuid(verified.get("merchant_reference"))
    if not payment_id:
        current_app.logger.warning(
            "Webhook FedaPay ignoré : transaction %s sans merchant_reference valide.",
            transaction_id,
        )
        return jsonify({"received": True, "ignored": True}), 200

    if provider_status == "approved":
        return _handle_approved_transaction(payment_id, transaction_id, verified.get("amount"))

    if provider_status in FAILED_STATUSES:
        return _handle_failed_transaction(payment_id, FAILED_STATUSES[provider_status])

    if event_status == "approved":
        # Le webhook annonce « approuvé » mais FedaPay ne le confirme pas (encore) :
        # on demande une relance plutôt que de perdre un paiement réellement approuvé.
        current_app.logger.warning(
            "Webhook approuvé mais transaction %s encore « %s » chez FedaPay : relance demandée.",
            transaction_id,
            provider_status,
        )
        return jsonify({"error": "Statut de la transaction pas encore confirmé."}), 502

    # pending / autres : rien à faire, et surtout jamais de rétrogradation.
    return jsonify({"received": True, "status": provider_status}), 200
