from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from .routes.payments import payments_bp
from .routes.subscriptions import subscriptions_bp
from .routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(subscriptions_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "ucao-payment-service"})

    return app