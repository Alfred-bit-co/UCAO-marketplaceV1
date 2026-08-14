import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    FEDAPAY_SECRET_KEY = os.getenv("FEDAPAY_SECRET_KEY", "")
    FEDAPAY_PUBLIC_KEY = os.getenv("FEDAPAY_PUBLIC_KEY", "")
    FEDAPAY_WEBHOOK_SECRET = os.getenv("FEDAPAY_WEBHOOK_SECRET", "")
    FEDAPAY_API_BASE_URL = os.getenv("FEDAPAY_API_BASE_URL", "https://api.fedapay.com/v1")