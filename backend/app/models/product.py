from datetime import datetime, timezone

from ..database.db import db


class Product(db.Model):
    __tablename__ = "produits"

    CATEGORIES = {"nourriture", "vetements", "numerique", "livres", "services"}

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    prix = db.Column(db.Integer, nullable=False)
    categorie = db.Column(db.String(40), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    stand_id = db.Column(db.Integer, db.ForeignKey("stands.id"), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    vendeur = db.relationship("User", back_populates="produits")
    stand = db.relationship("Stand", back_populates="produits")

    def to_dict(self, include_description=True):
        payload = {
            "id": self.id,
            "nom": self.nom,
            "prix": self.prix,
            "categorie": self.categorie,
            "image_url": self.image_url,
            "user_id": self.user_id,
            "stand_id": self.stand_id,
            "vendeur": self.vendeur.to_dict() if self.vendeur else None,
            "role_vendeur": self.vendeur.role if self.vendeur else "SIMPLE",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_description:
            payload["description"] = self.description
        return payload
