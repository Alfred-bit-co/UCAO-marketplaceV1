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
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    access_token = auth_header.split(" ", 1)[1]
    anon_key = current_app.config.get("SUPABASE_ANON_KEY") or current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    response = requests.get(
        f"{current_app.config['SUPABASE_URL']}/auth/v1/user",
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {access_token}",
        },
        timeout=10,
    )
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

    user = _get_authenticated_user(request)
    if not user or not user.get("id"):
        return jsonify({"error": "Vous devez être connecté."}), 401

    data = request.get_json(silent=True) or {}
    tier = clean_text(data.get("tier", ""), 20).upper()
    if tier not in TIER_PRICES:
        return jsonify({"error": "Palier invalide."}), 400

    amount = TIER_PRICES[tier]

    payment_response = requests.post(
        f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments",
        headers={**_supabase_headers(), "Prefer": "return=representation"},
        json={"user_id": user["id"], "tier": tier, "amount": amount, "status": "pending"},
        timeout=15,
    )
    if payment_response.status_code >= 400:
        current_app.logger.error("Erreur creation subscription_payments: %s", payment_response.text)
        return jsonify({"error": "Impossible d'initialiser le paiement."}), 502
    payment_row = payment_response.json()[0]

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
    if transaction_response.status_code >= 400:
        return jsonify({"error": "Erreur FedaPay.", "details": transaction_data}), transaction_response.status_code

    transaction_id = transaction_data.get("v1/transaction", transaction_data).get("id") or transaction_data.get("id")

    token_response = requests.post(
        f"{current_app.config['FEDAPAY_API_BASE_URL']}/transactions/{transaction_id}/token",
        headers=_fedapay_headers(),
        timeout=20,
    )
    token_data = token_response.json()
    if token_response.status_code >= 400:
        return jsonify({"error": "Erreur génération du lien de paiement.", "details": token_data}), 502

    payment_url = token_data.get("url") or token_data.get("v1/token", {}).get("url")

    requests.patch(
        f"{current_app.config['SUPABASE_URL']}/rest/v1/subscription_payments?id=eq.{payment_row['id']}",
        headers=_supabase_headers(),
        json={"fedapay_transaction_id": str(transaction_id)},
        timeout=15,
    )

    return jsonify({"payment_url": payment_url}), 201


@subscriptions_bp.post("/subscriptions/webhook")
def subscriptions_webhook():
    payload = request.get_data()
    signature = request.headers.get("X-FedaPay-Signature", "")
    webhook_secret = current_app.config["FEDAPAY_WEBHOOK_SECRET"]

    if webhook_secret and not verify_webhook_signature(payload, signature, webhook_secret):
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