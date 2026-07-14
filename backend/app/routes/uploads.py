from flask import Blueprint, jsonify

uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.get("")
def uploads_status():
    return jsonify({"message": "Upload service is not enabled in this starter."})
