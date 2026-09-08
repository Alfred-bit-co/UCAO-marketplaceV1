from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import Config
from .routes.subscriptions import subscriptions_bp
from .routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    if app.config["TRUSTED_PROXY_HOPS"]:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=app.config["TRUSTED_PROXY_HOPS"])

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    app.register_blueprint(subscriptions_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        return response

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "ucao-payment-service"})

    return app
