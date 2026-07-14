import os

import requests


def generate_product_description(product_name, category):
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key or api_key.startswith("YOUR_"):
        return (
            f"{product_name} est une offre {category} sur UCAO Marketplace. "
            "Elle aide les étudiants à comprendre rapidement la valeur, "
            "le prix et les bénéfices du produit."
        )

    response = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "Write short, clear, professional product descriptions in French."},
                {
                    "role": "user",
                    "content": (
                        f"Product: {product_name}. Category: {category}. "
                        "UCAO UUT student marketplace description."
                    ),
                },
            ],
            "temperature": 0.7,
        },
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()
