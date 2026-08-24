import requests
from datetime import datetime, timezone
from flask import Blueprint, current_app, jsonify, request

from ..security import check_rate_limit, clean_text, client_ip, verify_webhook_signature

subscriptions_bp = Blueprint("subscriptions", __name__)

TIER_PRICES = {"STANDARD": 500, "PREMIUM": 1500, "VIP": 5000}


def _fedapay_headers():
    return {
        "Authorization": f"Bearer {current_app.config['FEDAPAY_SECRET_KEY']}",
        "Content-Type": "application/json",
    }


def _supabase_headers():
    service_key = current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }


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
            "Echec verification utilisateur Supabase: %s %s", response.status_code, response.text
        )
        return None
    data = response.json()
    return {"id": data.get("id"), "email": data.get("email")}


@subscriptions_bp.post("/subscriptions/initiate")
def initiate_subscription():
    limiter = check_rate_limit(f"subscription:init:{client_ip(request)}", limit=10, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Réessayez plus tard."}), 429, {
            "Retry-After": str(limiter.retry_after)
        }

    if not current_app.config["FEDAPAY_SECRET_KEY"]:
        return jsonify({"error": "FedaPay n'est pas configuré."}), 503
    if not current_app.config["SUPABASE_URL"] or not current_app.config["SUPABASE_SERVICE_ROLE_KEY"]:
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

    amount = TIER_PRICES[tier]

    try:
        payment_response = requests.post(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments",
            headers={**_supabase_headers(), "Prefer": "return=representation"},
            json={"user_id": user["id"], "tier": tier, "amount": amount, "status": "pending"},
            timeout=15,
        )
    except requests.RequestException:
        current_app.logger.exception("Erreur réseau lors de la création du paiement.")
        return jsonify({"error": "Le service de paiement est temporairement indisponible."}), 502
    if payment_response.status_code >= 400:
        current_app.logger.error("Erreur creation subscription_payments: %s", payment_response.text)
        return jsonify({"error": "Impossible d'initialiser le paiement."}), 502
    try:
        payment_row = payment_response.json()[0]
    except (IndexError, ValueError, TypeError):
        current_app.logger.error("Réponse Supabase invalide à la création du paiement.")
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
                "custom_metadata": {"user_id": user["id"], "tier": tier},
            },
            timeout=20,
        )
        transaction_data = transaction_response.json()
    except (requests.RequestException, ValueError):
        current_app.logger.exception("Erreur de communication avec FedaPay.")
        return jsonify({"error": "Le service de paiement est temporairement indisponible."}), 502
    if transaction_response.status_code >= 400:
        current_app.logger.error("FedaPay a refusé la transaction: %s", transaction_data)
        return jsonify({"error": "Impossible de créer le paiement. Réessayez plus tard."}), 502

    transaction_id = transaction_data.get("v1/transaction", transaction_data).get("id") or transaction_data.get("id")
    if not transaction_id:
        current_app.logger.error("FedaPay n'a pas retourné d'identifiant de transaction: %s", transaction_data)
        return jsonify({"error": "Impossible de créer le paiement. Réessayez plus tard."}), 502

    try:
        token_response = requests.post(
            f"{current_app.config['FEDAPAY_API_BASE_URL']}/transactions/{transaction_id}/token",
            headers=_fedapay_headers(),
            timeout=20,
        )
        token_data = token_response.json()
    except (requests.RequestException, ValueError):
        current_app.logger.exception("Erreur lors de la création du lien FedaPay.")
        return jsonify({"error": "Impossible de créer le lien de paiement. Réessayez plus tard."}), 502
    if token_response.status_code >= 400:
        current_app.logger.error("FedaPay n'a pas généré de lien: %s", token_data)
        return jsonify({"error": "Impossible de créer le lien de paiement. Réessayez plus tard."}), 502

    payment_url = token_data.get("url") or token_data.get("v1/token", {}).get("url")
    if not payment_url:
        current_app.logger.error("Réponse FedaPay sans lien de paiement: %s", token_data)
        return jsonify({"error": "Impossible de créer le lien de paiement. Réessayez plus tard."}), 502

    try:
        requests.patch(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments?id=eq.{payment_row['id']}",
            headers=_supabase_headers(),
            json={"fedapay_transaction_id": str(transaction_id)},
            timeout=15,
        )
    except requests.RequestException:
        current_app.logger.exception("Impossible d'enregistrer la transaction FedaPay.")

    return jsonify({"payment_url": payment_url}), 201


@subscriptions_bp.post("/subscriptions/webhook")
def subscriptions_webhook():
    payload = request.get_data()
    signature = request.headers.get("X-FedaPay-Signature", "")
    webhook_secret = current_app.config["FEDAPAY_WEBHOOK_SECRET"]

    if not webhook_secret:
        current_app.logger.error("Webhook FedaPay refusé : FEDAPAY_WEBHOOK_SECRET absent.")
        return jsonify({"error": "Webhook non configuré."}), 503
    if not verify_webhook_signature(payload, signature, webhook_secret):
        return jsonify({"error": "Signature webhook invalide."}), 401

    event = request.get_json(silent=True) or {}
    transaction = event.get("entity") or event.get("transaction") or {}
    status = transaction.get("status")
    merchant_reference = transaction.get("merchant_reference")
    metadata = transaction.get("custom_metadata") or {}
    user_id = metadata.get("user_id")
    tier = metadata.get("tier")

    if status != "approved" or not user_id or not tier:
        if merchant_reference:
            requests.patch(
                f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments?id=eq.{merchant_reference}",
                headers=_supabase_headers(),
                json={"status": "failed" if status in ("declined", "canceled") else "pending"},
                timeout=15,
            )
        return jsonify({"received": True, "status": status})

    requests.post(
        f"{current_app.config['SUPABASE_URL']}/rest/v1/rpc/activate_or_renew_subscription",
        headers=_supabase_headers(),
        json={"p_user_id": user_id, "p_tier": tier},
        timeout=15,
    )

    if merchant_reference:
        requests.patch(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments?id=eq.{merchant_reference}",
            headers=_supabase_headers(),
            json={"status": "paid"},
            timeout=15,
        )

    return jsonify({"received": True, "status": "paid", "user_id": user_id, "tier": tier})
