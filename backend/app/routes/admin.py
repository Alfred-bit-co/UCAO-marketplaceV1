import requests
from uuid import UUID
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


def _supabase_configured():
    return bool(
        current_app.config.get("SUPABASE_URL")
        and current_app.config.get("SUPABASE_SERVICE_ROLE_KEY")
        and current_app.config.get("SUPABASE_ANON_KEY")
    )


def _get_authenticated_user(req):
    if not _supabase_configured():
        return None
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    access_token = auth_header.split(" ", 1)[1]
    try:
        response = requests.get(
            f"{current_app.config['SUPABASE_URL']}/auth/v1/user",
            headers={"apikey": current_app.config["SUPABASE_ANON_KEY"], "Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        current_app.logger.exception("Impossible de vérifier la session administrateur.")
        return None
    if response.status_code != 200:
        return None
    try:
        return response.json()
    except ValueError:
        current_app.logger.warning("Supabase a renvoyé une session invalide.")
        return None


def _require_admin(req):
    user = _get_authenticated_user(req)
    if not user or not user.get("id"):
        return None
    try:
        profile_response = requests.get(
            f"{current_app.config['SUPABASE_URL']}/rest/v1/profiles?id=eq.{user['id']}&select=role",
            headers=_supabase_headers(),
            timeout=10,
        )
    except requests.RequestException:
        current_app.logger.exception("Impossible de vérifier le rôle administrateur.")
        return None
    try:
        rows = profile_response.json() if profile_response.status_code == 200 else []
    except ValueError:
        rows = []
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

    if not _supabase_configured():
        current_app.logger.error("Suppression de compte impossible : configuration Supabase incomplète.")
        return jsonify({"error": "Service momentanément indisponible."}), 503

    if user_id == admin_user["id"]:
        return jsonify({"error": "Vous ne pouvez pas supprimer votre propre compte administrateur."}), 400
    try:
        UUID(user_id)
    except ValueError:
        return jsonify({"error": "Identifiant utilisateur invalide."}), 400

    try:
        response = requests.delete(
            f"{current_app.config['SUPABASE_URL']}/auth/v1/admin/users/{user_id}",
            headers=_supabase_headers(),
            timeout=15,
        )
    except requests.RequestException:
        current_app.logger.exception("Supabase n'a pas répondu lors de la suppression du compte.")
        return jsonify({"error": "Service momentanément indisponible."}), 503
    if response.status_code >= 400:
        current_app.logger.warning(
            "Suppression Supabase refusée pour %s (status=%s).",
            user_id,
            response.status_code,
        )
        return jsonify({"error": "Impossible de supprimer ce compte."}), 502

    return jsonify({"deleted": True, "user_id": user_id})
