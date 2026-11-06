import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
# Load both environments so run.py works from the repository root or backend/.
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env", override=True)


def _non_negative_int(value: str | None, default: int = 0) -> int:
    try:
        return max(int(value or default), 0)
    except ValueError:
        return default


LOCAL_DEV_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")


def is_production(env=os.environ) -> bool:
    """Vrai sur Render (qui définit RENDER=true) ou si APP_ENV=production."""
    return env.get("RENDER", "").lower() == "true" or env.get("APP_ENV", "").lower() == "production"


def build_cors_origins(env=os.environ) -> list[str]:
    """Origines autorisées : celles de CORS_ORIGINS, plus localhost UNIQUEMENT hors production.

    Avant, localhost était toujours ajouté : en production, n'importe quelle page servie
    sur le port 3000 d'un ordinateur pouvait appeler l'API avec la session de l'utilisateur.
    """
    configured = [origin.strip().rstrip("/") for origin in env.get("CORS_ORIGINS", "").split(",") if origin.strip()]
    if not is_production(env):
        configured.extend(LOCAL_DEV_ORIGINS)
    return list(dict.fromkeys(configured))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") or os.urandom(32)
    CORS_ORIGINS = build_cors_origins()
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    FEDAPAY_SECRET_KEY = os.getenv("FEDAPAY_SECRET_KEY", "")
    FEDAPAY_PUBLIC_KEY = os.getenv("FEDAPAY_PUBLIC_KEY", "")
    FEDAPAY_WEBHOOK_SECRET = os.getenv("FEDAPAY_WEBHOOK_SECRET", "")
    FEDAPAY_API_BASE_URL = os.getenv("FEDAPAY_API_BASE_URL", "https://api.fedapay.com/v1")
    TRUSTED_PROXY_HOPS = _non_negative_int(os.getenv("TRUSTED_PROXY_HOPS"))
