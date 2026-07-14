from flask import Blueprint, jsonify, request
from sqlalchemy import case, or_

from ..database.db import db
from ..models.product import Product
from ..models.user import User
from ..security import clean_text
from .auth import login_required

products_bp = Blueprint("products", __name__)


def _payload():
    return request.get_json(silent=True) or {}


def _ordered_products(query):
    return query.order_by(
        case(
            (User.role == User.ROLE_VIP, 1),
            (User.role == User.ROLE_PREMIUM, 2),
            else_=3,
        ),
        Product.created_at.desc(),
    )


@products_bp.get("")
def list_products():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 5)), 1), 5)
    category = request.args.get("category", "").strip().lower()
    search = request.args.get("q", "").strip()

    query = Product.query.join(User)
    if category and category != "tous":
        query = query.filter(Product.categorie == category)
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(Product.nom.ilike(pattern), Product.description.ilike(pattern)))

    pagination = _ordered_products(query).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "items": [product.to_dict(include_description=False) for product in pagination.items],
        "page": pagination.page,
        "pages": pagination.pages,
        "total": pagination.total,
    })


@products_bp.get("/<int:product_id>")
def product_detail(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Produit introuvable."}), 404
    return jsonify(product.to_dict(include_description=True))


@products_bp.post("")
@login_required
def create_product(user):
    data = _payload()
    required = ("nom", "categorie", "prix", "description")
    if any(not str(data.get(field, "")).strip() for field in required):
        return jsonify({"error": "Tous les champs obligatoires doivent etre remplis."}), 400
    try:
        price = int(data["prix"])
    except (TypeError, ValueError):
        return jsonify({"error": "Le prix doit etre un nombre entier."}), 400
    if price < 0:
        return jsonify({"error": "Le prix ne peut pas etre negatif."}), 400

    try:
        category = clean_text(data["categorie"], 30).lower()
        name = clean_text(data["nom"], 160)
        description = clean_text(data["description"], 4000)
        image_url = clean_text(data.get("image_url", ""), 500)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if category not in Product.CATEGORIES:
        return jsonify({"error": "Categorie invalide."}), 400

    product = Product(
        nom=name,
        categorie=category,
        prix=price,
        description=description,
        image_url=image_url,
        stand_id=data.get("stand_id") or None,
        user_id=user.id,
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"id": product.id, "message": "Produit cree.", "product": product.to_dict()}), 201


@products_bp.put("/<int:product_id>")
@login_required
def update_product(user, product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Produit introuvable."}), 404
    if product.user_id != user.id:
        return jsonify({"error": "Vous ne pouvez modifier que vos produits."}), 403

    data = _payload()
    for field in ("nom", "description", "image_url"):
        if field in data:
            try:
                limit = 160 if field == "nom" else 4000 if field == "description" else 500
                setattr(product, field, clean_text(data[field], limit))
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400
    if "categorie" in data:
        try:
            category = clean_text(data["categorie"], 30).lower()
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        if category not in Product.CATEGORIES:
            return jsonify({"error": "Categorie invalide."}), 400
        product.categorie = category
    if "prix" in data:
        try:
            product.prix = int(data["prix"])
        except (TypeError, ValueError):
            return jsonify({"error": "Le prix doit etre un nombre entier."}), 400

    db.session.commit()
    return jsonify({"message": "Produit modifie.", "product": product.to_dict()})


@products_bp.delete("/<int:product_id>")
@login_required
def delete_product(user, product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Produit introuvable."}), 404
    if product.user_id != user.id:
        return jsonify({"error": "Vous ne pouvez supprimer que vos produits."}), 403

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Produit supprime."})


@products_bp.get("/mine")
@login_required
def my_products(user):
    products = Product.query.filter_by(user_id=user.id).order_by(Product.created_at.desc()).all()
    return jsonify([product.to_dict() for product in products])
