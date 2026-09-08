import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
# Load both environments so run.py works from the repository root or backend/.
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env", override=True)


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") or os.urandom(32)
    CORS_ORIGINS = list(dict.fromkeys([
        *[origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()],
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]))
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    FEDAPAY_SECRET_KEY = os.getenv("FEDAPAY_SECRET_KEY", "")
    FEDAPAY_PUBLIC_KEY = os.getenv("FEDAPAY_PUBLIC_KEY", "")
    FEDAPAY_WEBHOOK_SECRET = os.getenv("FEDAPAY_WEBHOOK_SECRET", "")
    FEDAPAY_API_BASE_URL = os.getenv("FEDAPAY_API_BASE_URL", "https://api.fedapay.com/v1")
