from app.config import LOCAL_DEV_ORIGINS, build_cors_origins, is_production


def test_localhost_is_refused_in_production_on_render():
    env = {"RENDER": "true", "CORS_ORIGINS": "https://www.ucaomarketplace.com"}

    assert is_production(env) is True
    assert build_cors_origins(env) == ["https://www.ucaomarketplace.com"]
    for origin in LOCAL_DEV_ORIGINS:
        assert origin not in build_cors_origins(env)


def test_localhost_is_refused_when_app_env_is_production():
    env = {"APP_ENV": "production", "CORS_ORIGINS": "https://www.ucaomarketplace.com/"}

    assert build_cors_origins(env) == ["https://www.ucaomarketplace.com"]


def test_localhost_is_allowed_in_local_development():
    env = {"CORS_ORIGINS": "https://www.ucaomarketplace.com"}

    origins = build_cors_origins(env)
    assert origins[0] == "https://www.ucaomarketplace.com"
    for origin in LOCAL_DEV_ORIGINS:
        assert origin in origins


def test_origins_are_deduplicated_and_trimmed():
    env = {"CORS_ORIGINS": " https://a.example , https://a.example,, "}

    assert build_cors_origins(env)[:1] == ["https://a.example"]
    assert build_cors_origins(env).count("https://a.example") == 1
