from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from .database.db import init_extensions
from .routes.admin import admin_bp
from .routes.ai import ai_bp
from .routes.auth import auth_bp
from .routes.products import products_bp
from .routes.stands import stands_bp
from .routes.uploads import uploads_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    init_extensions(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(stands_bp, url_prefix="/api/stands")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' https://unpkg.com; connect-src 'self' http://127.0.0.1:5000 http://localhost:5000"
        return response

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "ucao-marketplace"})

    return app
