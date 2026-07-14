import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Config:
    BASE_DIR = Path(__file__).resolve().parents[1]
    raw_database_url = os.getenv("DATABASE_URL") or f"sqlite:///{BASE_DIR / 'ucao_marketplace.db'}"
    if raw_database_url.startswith("postgresql://"):
        raw_database_url = raw_database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
    ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-this-admin-secret")
    JWT_ISSUER = "ucao-marketplace"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://127.0.0.1:8000,http://localhost:8000").split(",")
    MAX_CONTENT_LENGTH = 4 * 1024 * 1024
    SQLALCHEMY_DATABASE_URI = raw_database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    TMONEY_API_KEY = os.getenv("TMONEY_API_KEY", "")
    FLOOZ_API_KEY = os.getenv("FLOOZ_API_KEY", "")
