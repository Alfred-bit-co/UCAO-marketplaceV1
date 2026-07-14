from collections import defaultdict, deque
import hmac
import hashlib
from dataclasses import dataclass
from threading import Lock
from time import monotonic

_EVENTS = defaultdict(deque)
_LOCK = Lock()


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    retry_after: int


def client_ip(request):
    forwarded = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    return forwarded or request.remote_addr or "unknown"


def check_rate_limit(key, limit, window_seconds):
    now = monotonic()
    with _LOCK:
        bucket = _EVENTS[key]
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            retry_after = int(window_seconds - (now - bucket[0])) if bucket else window_seconds
            return RateLimitResult(False, max(retry_after, 1))
        bucket.append(now)
        return RateLimitResult(True, 0)


def clean_text(value, max_length):
    text = str(value or "").strip()
    if len(text) > max_length:
        raise ValueError(f"Le champ ne doit pas depasser {max_length} caracteres.")
    return text


def clean_email(value):
    return clean_text(value, 180).lower()


def verify_webhook_signature(payload, signature, secret):
    if not signature or not secret:
        return False
    expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
