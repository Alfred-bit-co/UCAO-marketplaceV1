from datetime import datetime, timezone

from ..database.db import db


class Stand(db.Model):
    __tablename__ = "stands"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    banniere_url = db.Column(db.String(500), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    vendeur = db.relationship("User", back_populates="stands")
    produits = db.relationship("Product", back_populates="stand")

    def to_dict(self, include_products=False):
        payload = {
            "id": self.id,
            "nom": self.nom,
            "description": self.description,
            "banniere_url": self.banniere_url,
            "user_id": self.user_id,
            "vendeur": self.vendeur.to_dict() if self.vendeur else None,
            "role_vendeur": self.vendeur.role if self.vendeur else "SIMPLE",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_products:
            payload["produits"] = [product.to_dict(include_description=False) for product in self.produits]
        return payload
