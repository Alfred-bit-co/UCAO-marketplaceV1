import datetime as dt
import re
from functools import wraps

import jwt
from flask import Blueprint, current_app, jsonify, request

from ..database.db import bcrypt, db
from ..models.user import User
from ..security import check_rate_limit, clean_email, clean_text, client_ip

auth_bp = Blueprint("auth", __name__)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _payload():
    data = request.get_json(silent=True) or {}
    return {key: str(value).strip() for key, value in data.items()}


def _make_token(user):
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "iss": current_app.config["JWT_ISSUER"],
        "iat": now,
        "exp": now + dt.timedelta(hours=8),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def current_user_from_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=["HS256"],
            issuer=current_app.config["JWT_ISSUER"],
        )
    except jwt.PyJWTError:
        return None
    return db.session.get(User, int(payload["sub"]))


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user_from_token()
        if not user:
            return jsonify({"error": "Authentification requise."}), 401
        return view(user, *args, **kwargs)

    return wrapped


@auth_bp.post("/register")
def register():
    limiter = check_rate_limit(f"register:{client_ip(request)}", limit=8, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Reessayez plus tard."}), 429, {"Retry-After": str(limiter.retry_after)}

    data = _payload()
    try:
        name = clean_text(data.get("name") or data.get("nom", ""), 120)
        email = clean_email(data.get("email", ""))
        password = clean_text(data.get("password", ""), 128)
        phone = clean_text(data.get("phone", ""), 40)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if len(name) < 2:
        return jsonify({"error": "Le nom complet est obligatoire."}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "L'adresse email est invalide."}), 400
    if len(password) < 8:
        return jsonify({"error": "Le mot de passe doit contenir au moins 8 caracteres."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Un compte existe deja avec cette adresse email."}), 409

    user = User(
        nom=name,
        email=email,
        password=bcrypt.generate_password_hash(password).decode("utf-8"),
        role=User.ROLE_SIMPLE,
        phone=phone,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Compte cree avec succes."}), 201


@auth_bp.post("/login")
def login():
    limiter = check_rate_limit(f"login:{client_ip(request)}", limit=10, window_seconds=900)
    if not limiter.allowed:
        return jsonify({"error": "Trop de tentatives. Reessayez plus tard."}), 429, {"Retry-After": str(limiter.retry_after)}

    data = _payload()
    try:
        email = clean_email(data.get("email", ""))
        password = clean_text(data.get("password", ""), 128)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Email ou mot de passe incorrect."}), 401

    return jsonify({"token": _make_token(user), "user": user.to_dict()})


@auth_bp.get("/me")
@login_required
def me(user):
    return jsonify(user.to_dict())
