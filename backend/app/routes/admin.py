import requests
from flask import Blueprint, current_app, jsonify, request

from ..security import check_rate_limit, client_ip

admin_bp = Blueprint("admin", __name__)


def _supabase_headers():
    service_key = current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }


def _get_authenticated_user(req):
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    access_token = auth_header.split(" ", 1)[1]
    anon_key = current_app.config.get("SUPABASE_ANON_KEY") or current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    response = requests.get(
        f"{current_app.config['SUPABASE_URL']}/auth/v1/user",
        headers={"apikey": anon_key, "Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if response.status_code != 200:
        return None
    return response.json()


def _require_admin(req):
    user = _get_authenticated_user(req)
    if not user or not user.get("id"):
        return None
    profile_response = requests.get(
        f"{current_app.config['SUPABASE_URL']}/rest/v1/profiles?id=eq.{user['id']}&select=role",
        headers=_supabase_headers(),
        timeout=10,
    )
    rows = profile_response.json() if profile_response.status_code == 200 else []
    if not rows or rows[0].get("role") != "ADMIN":
        return None
    return user


@admin_bp.delete("/admin/users/<user_id>")
def delete_user(user_id):
    limiter = check_rate_limit(f"admin:delete:{client_ip(request)}", limit=20, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Réessayez plus tard."}), 429

    admin_user = _require_admin(request)
    if not admin_user:
        return jsonify({"error": "Accès réservé aux administrateurs."}), 403

    if user_id == admin_user["id"]:
        return jsonify({"error": "Vous ne pouvez pas supprimer votre propre compte administrateur."}), 400

    response = requests.delete(
        f"{current_app.config['SUPABASE_URL']}/auth/v1/admin/users/{user_id}",
        headers=_supabase_headers(),
        timeout=15,
    )
    if response.status_code >= 400:
        return jsonify({"error": "Impossible de supprimer ce compte.", "details": response.text}), 502

    return jsonify({"deleted": True, "user_id": user_id})