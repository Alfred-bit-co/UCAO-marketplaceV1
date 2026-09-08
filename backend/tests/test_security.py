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


def test_webhook_signature_requires_exact_payload_and_secret():
    payload = b'{"status":"approved"}'
    signature = "70e6ebabdd87784f077927d4beec75743526bbfe73fa2426daf0d833ce97edc5"

    assert verify_webhook_signature(payload, signature, "test-secret") is True
    assert verify_webhook_signature(b'{"status":"declined"}', signature, "test-secret") is False
    assert verify_webhook_signature(payload, "", "test-secret") is False
