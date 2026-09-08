from collections import defaultdict, deque
import hmac
import hashlib
from dataclasses import dataclass
from threading import Lock
from time import monotonic

_EVENTS = defaultdict(deque)
_LOCK = Lock()
MAX_RATE_LIMIT_KEYS = 10_000


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    retry_after: int


def client_ip(request):
    # ProxyFix rewrites remote_addr only when TRUSTED_PROXY_HOPS is explicitly set.
    # Reading X-Forwarded-For here would let clients forge their own rate-limit key.
    return request.remote_addr or "unknown"


def check_rate_limit(key, limit, window_seconds):
    now = monotonic()
    with _LOCK:
        if key not in _EVENTS and len(_EVENTS) >= MAX_RATE_LIMIT_KEYS:
            _EVENTS.pop(next(iter(_EVENTS)), None)
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
