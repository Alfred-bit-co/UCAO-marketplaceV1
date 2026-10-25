import hashlib
import hmac
import time

from flask import Flask, request

from app.security import check_rate_limit, client_ip, verify_webhook_signature


def test_client_ip_ignores_untrusted_forwarded_header():
    app = Flask(__name__)
    with app.test_request_context(
        "/",
        headers={"X-Forwarded-For": "198.51.100.99"},
        environ_base={"REMOTE_ADDR": "203.0.113.10"},
    ):
        assert client_ip(request) == "203.0.113.10"


def test_rate_limit_rejects_after_limit():
    key = "test-rate-limit"
    assert check_rate_limit(key, limit=2, window_seconds=60).allowed
    assert check_rate_limit(key, limit=2, window_seconds=60).allowed
    assert not check_rate_limit(key, limit=2, window_seconds=60).allowed


SECRET = "test-secret"
PAYLOAD = b'{"status":"approved"}'


def _sign(payload, secret=SECRET, timestamp=None):
    """Signe comme le fait FedaPay : HMAC-SHA256, avec ou sans horodatage."""
    if timestamp is None:
        return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    signed = str(timestamp).encode("utf-8") + b"." + payload
    digest = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
    return "t=" + str(timestamp) + ",s=" + digest


def test_webhook_signature_requires_exact_payload_and_secret():
    signature = _sign(PAYLOAD)

    assert verify_webhook_signature(PAYLOAD, signature, SECRET) is True
    assert verify_webhook_signature(b'{"status":"declined"}', signature, SECRET) is False
    assert verify_webhook_signature(PAYLOAD, signature, "autre-secret") is False
    assert verify_webhook_signature(PAYLOAD, "", SECRET) is False
    assert verify_webhook_signature(PAYLOAD, signature, "") is False


def test_webhook_signature_with_fresh_timestamp():
    signature = _sign(PAYLOAD, timestamp=int(time.time()))

    assert verify_webhook_signature(PAYLOAD, signature, SECRET) is True
    assert verify_webhook_signature(b'{"status":"declined"}', signature, SECRET) is False
    assert verify_webhook_signature(PAYLOAD, signature, "autre-secret") is False


def test_webhook_signature_accepts_millisecond_timestamp():
    signature = _sign(PAYLOAD, timestamp=int(time.time() * 1000))

    assert verify_webhook_signature(PAYLOAD, signature, SECRET) is True


def test_webhook_signature_rejects_old_timestamp():
    # Un webhook valide mais rejoué bien après coup doit être refusé (protection contre le rejeu).
    signature = _sign(PAYLOAD, timestamp=int(time.time()) - 24 * 3600)

    assert verify_webhook_signature(PAYLOAD, signature, SECRET) is False
