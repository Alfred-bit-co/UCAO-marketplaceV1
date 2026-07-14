import requests
from flask import Blueprint, current_app, jsonify, request

from ..security import check_rate_limit, clean_email, clean_text, client_ip, verify_webhook_signature

payments_bp = Blueprint("payments", __name__)


def _fedapay_headers():
    secret_key = current_app.config["FEDAPAY_SECRET_KEY"]
    return {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json",
    }


@payments_bp.post("/fedapay/initiate")
def initiate_fedapay_transaction():
    limiter = check_rate_limit(f"fedapay:init:{client_ip(request)}", limit=20, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Réessayez plus tard."}), 429, {
            "Retry-After": str(limiter.retry_after)
        }

    if not current_app.config["FEDAPAY_SECRET_KEY"]:
        return jsonify({"error": "FedaPay n'est pas configuré."}), 503

    data = request.get_json(silent=True) or {}
    try:
        amount = int(data.get("amount", 0))
        description = clean_text(data.get("description", "Abonnement UCAO Marketplace"), 220)
        customer_email = clean_email(data.get("customer_email", ""))
        customer_name = clean_text(data.get("customer_name", ""), 120)
        callback_url = clean_text(data.get("callback_url", ""), 500)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if amount <= 0:
        return jsonify({"error": "Le montant doit être positif."}), 400
    if not customer_email:
        return jsonify({"error": "L'email client est obligatoire."}), 400

    payload = {
        "description": description,
        "amount": amount,
        "currency": {"iso": "XOF"},
        "customer": {
            "firstname": customer_name or "Client",
            "email": customer_email,
        },
    }
    if callback_url:
        payload["callback_url"] = callback_url

    response = requests.post(
        f"{current_app.config['FEDAPAY_API_BASE_URL']}/transactions",
        headers=_fedapay_headers(),
        json=payload,
        timeout=20,
    )
    fedapay_data = response.json()
    if response.status_code >= 400:
        return jsonify({"error": "Erreur FedaPay.", "details": fedapay_data}), response.status_code

    return jsonify(
        {
            "transaction": fedapay_data,
            "public_key": current_app.config["FEDAPAY_PUBLIC_KEY"],
        }
    ), 201


@payments_bp.post("/fedapay/webhook")
def fedapay_webhook():
    payload = request.get_data()
    signature = request.headers.get("X-FedaPay-Signature", "")
    webhook_secret = current_app.config["FEDAPAY_WEBHOOK_SECRET"]

    if webhook_secret and not verify_webhook_signature(payload, signature, webhook_secret):
        return jsonify({"error": "Signature webhook invalide."}), 401

    event = request.get_json(silent=True) or {}
    transaction = event.get("entity") or event.get("transaction") or {}
    status = transaction.get("status")
    reference = transaction.get("reference") or transaction.get("id")

    # TODO: Update Supabase orders/subscriptions with SUPABASE_SERVICE_ROLE_KEY.
    return jsonify(
        {
            "received": True,
            "reference": reference,
            "status": status,
            "next_step": "Persist payment state in Supabase once the schema is created.",
        }
    )
