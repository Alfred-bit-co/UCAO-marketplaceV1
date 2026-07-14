from flask import Blueprint, jsonify, request

from ..database.db import db
from ..models.stand import Stand
from ..security import clean_text
from .auth import login_required

stands_bp = Blueprint("stands", __name__)


@stands_bp.get("")
def list_stands():
    page = max(int(request.args.get("page", 1)), 1)
    pagination = Stand.query.order_by(Stand.created_at.desc()).paginate(page=page, per_page=1, error_out=False)
    return jsonify({
        "items": [stand.to_dict(include_products=True) for stand in pagination.items],
        "page": pagination.page,
        "pages": pagination.pages,
        "total": pagination.total,
    })


@stands_bp.get("/<int:stand_id>")
def stand_detail(stand_id):
    stand = db.session.get(Stand, stand_id)
    if not stand:
        return jsonify({"error": "Stand introuvable."}), 404
    return jsonify(stand.to_dict(include_products=True))


@stands_bp.post("")
@login_required
def create_stand(user):
    data = request.get_json(silent=True) or {}
    required = ("nom", "description")
    if any(not str(data.get(field, "")).strip() for field in required):
        return jsonify({"error": "Le nom et la description du stand sont obligatoires."}), 400

    current_count = Stand.query.filter_by(user_id=user.id).count()
    if current_count >= user.stand_limit():
        return jsonify({"error": f"Votre role {user.role} permet au maximum {user.stand_limit()} stand(s)."}), 403

    try:
        stand = Stand(
            nom=clean_text(data["nom"], 160),
            description=clean_text(data["description"], 4000),
            banniere_url=clean_text(data.get("banniere_url", ""), 500),
            user_id=user.id,
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    db.session.add(stand)
    db.session.commit()
    return jsonify({"id": stand.id, "message": "Stand cree.", "stand": stand.to_dict()}), 201


@stands_bp.get("/mine")
@login_required
def my_stands(user):
    stands = Stand.query.filter_by(user_id=user.id).order_by(Stand.created_at.desc()).all()
    return jsonify([stand.to_dict(include_products=True) for stand in stands])
