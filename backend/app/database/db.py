from pathlib import Path

from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import SQLAlchemyError

db = SQLAlchemy()
bcrypt = Bcrypt()


def _sqlite_fallback_uri(app):
    return f"sqlite:///{Path(app.root_path).parent / 'ucao_marketplace.db'}"


def _database_is_reachable(uri):
    engine = create_engine(uri, pool_pre_ping=True)
    try:
        with engine.connect():
            return True
    finally:
        engine.dispose()


def init_extensions(app):
    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    if uri.startswith("postgresql"):
        try:
            _database_is_reachable(uri)
        except SQLAlchemyError as exc:
            app.logger.warning("Database connection failed, falling back to SQLite: %s", exc)
            uri = _sqlite_fallback_uri(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = uri
    db.init_app(app)
    bcrypt.init_app(app)

    with app.app_context():
        from ..models.product import Product  # noqa: F401
        from ..models.stand import Stand  # noqa: F401
        from ..models.user import User  # noqa: F401

        if uri.startswith("sqlite"):
            inspector = inspect(db.engine)
            if "users" in inspector.get_table_names():
                user_columns = {column["name"] for column in inspector.get_columns("users")}
                if {"nom", "password", "role"} - user_columns:
                    db.drop_all()
        db.create_all()
