from flask import Blueprint, jsonify, request

from backend.app.security import check_rate_limit, clean_text, client_ip
from .ai_service import generate_product_description

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/generate-description")
def generate_description():
    # Inactive preserved code. Reconnect through Supabase Auth/RLS later.
    limiter = check_rate_limit(f"ai:{client_ip(request)}", limit=8, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de requêtes. Réessayez plus tard."}), 429, {
            "Retry-After": str(limiter.retry_after)
        }

    data = request.get_json(silent=True) or {}
    try:
        product_name = clean_text(data.get("nom", ""), 160)
        category = clean_text(data.get("categorie", ""), 30)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not product_name or not category:
        return jsonify({"error": "Le nom du produit et la catégorie sont obligatoires."}), 400

    try:
        description = generate_product_description(product_name, category)
    except Exception:
        return jsonify({"error": "Le service IA est momentanément indisponible."}), 503
    return jsonify({"description": description})
