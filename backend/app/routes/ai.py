from flask import Blueprint, jsonify, request

from ..security import check_rate_limit, clean_text, client_ip
from ..services.ai_service import generate_product_description
from .auth import login_required

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/generate-description")
@login_required
def generate_description(user):
    if not user.can_use_ai():
        return jsonify({"error": "L'IA est reservee aux vendeurs VIP."}), 403

    limiter = check_rate_limit(f"ai:{client_ip(request)}", limit=8, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de requetes. Reessayez plus tard."}), 429, {"Retry-After": str(limiter.retry_after)}

    data = request.get_json(silent=True) or {}
    try:
        product_name = clean_text(data.get("nom", ""), 160)
        category = clean_text(data.get("categorie", ""), 30)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not product_name or not category:
        return jsonify({"error": "Le nom du produit et la categorie sont obligatoires."}), 400

    try:
        description = generate_product_description(product_name, category)
    except Exception:
        return jsonify({"error": "Le service IA est momentanement indisponible."}), 503
    return jsonify({"description": description})
