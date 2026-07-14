from datetime import datetime, timezone

from ..database.db import db


class User(db.Model):
    __tablename__ = "users"

    ROLE_SIMPLE = "SIMPLE"
    ROLE_PREMIUM = "PREMIUM"
    ROLE_VIP = "VIP"
    ALLOWED_ROLES = {ROLE_SIMPLE, ROLE_PREMIUM, ROLE_VIP}

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False, unique=True, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=ROLE_SIMPLE)
    phone = db.Column(db.String(40), nullable=True)
    subscription_type = db.Column(db.String(20), nullable=True)
    subscription_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    produits = db.relationship("Product", back_populates="vendeur", cascade="all, delete-orphan")
    stands = db.relationship("Stand", back_populates="vendeur", cascade="all, delete-orphan")

    def stand_limit(self):
        if self.role == self.ROLE_VIP:
            return 5
        if self.role == self.ROLE_PREMIUM:
            return 3
        return 0

    def can_use_ai(self):
        return self.role == self.ROLE_VIP

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "subscription_type": self.subscription_type,
            "subscription_expires_at": self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
            "stand_limit": self.stand_limit(),
            "stands_count": len(self.stands),
        }
