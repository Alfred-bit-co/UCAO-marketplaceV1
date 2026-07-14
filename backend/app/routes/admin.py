from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request

from ..database.db import db
from ..models.user import User
from ..security import check_rate_limit, clean_text, client_ip

admin_bp = Blueprint("admin", __name__)


def _admin_allowed():
    secret = request.headers.get("X-Admin-Secret", "")
    return bool(secret) and secret == current_app.config["ADMIN_SECRET"]


@admin_bp.put("/users/<int:user_id>/role")
def activate_subscription(user_id):
    limiter = check_rate_limit(f"admin:{client_ip(request)}", limit=20, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de requetes. Reessayez plus tard."}), 429, {"Retry-After": str(limiter.retry_after)}

    if not _admin_allowed():
        return jsonify({"error": "Acces administrateur refuse."}), 403

    data = request.get_json(silent=True) or {}
    try:
        role = clean_text(data.get("role", ""), 20).upper()
        subscription_type = clean_text(data.get("subscription_type", "mensuel"), 20).lower()
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if role not in User.ALLOWED_ROLES:
        return jsonify({"error": "Role invalide."}), 400
    if subscription_type not in {"mensuel", "annuel"}:
        return jsonify({"error": "Type d'abonnement invalide."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Utilisateur introuvable."}), 404

    user.role = role
    user.subscription_type = subscription_type
    user.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=365 if subscription_type == "annuel" else 30)
    db.session.commit()
    return jsonify({"message": "Abonnement valide manuellement.", "user": user.to_dict()})


@admin_bp.get("/payments/config")
def payments_config_status():
    if not _admin_allowed():
        return jsonify({"error": "Acces administrateur refuse."}), 403
    return jsonify({
        "tmoney_configured": bool(current_app.config["TMONEY_API_KEY"]),
        "flooz_configured": bool(current_app.config["FLOOZ_API_KEY"]),
        "activation": "manual",
    })
