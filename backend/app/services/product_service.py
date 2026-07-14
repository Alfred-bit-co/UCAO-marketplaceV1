from ..models.product import Product


def order_products(query):
    return query.order_by(Product.created_at.desc())
