# UCAO Marketplace

Marketplace etudiante UCAO UUT en Next.js + Tailwind CSS avec backend Flask.

## Fonctionnalites

- Register / login avec mot de passe hashe par bcrypt.
- Roles vendeurs: `SIMPLE`, `PREMIUM`, `VIP`.
- Produits avec categories: nourriture, vetements, numerique, livres, services.
- Pagination produits: 5 par page.
- Tri d'affichage: VIP, Premium, Simple.
- Stands en bandes larges avec pagination 1 par 1.
- Dashboard vendeur: ajout produit, creation stand, suppression produit.
- Limites de stands: Premium 3, VIP 5, Simple 0.
- IA DeepSeek preparee cote backend, reservee aux vendeurs VIP.
- Paiements TMoney/Flooz preparés dans `.env`, activation manuelle par admin.
- Garde-fous OWASP Top 10: validation d'entree, hash de mot de passe, JWT, CORS limite, cache-control, rate limit simple, controle d'acces par role.

## Lancer en local

```powershell
cd C:\Users\alfre\Desktop\ucao-marketplace
python -m pip install -r requirements.txt
python run.py
```

Dans un deuxieme terminal:

```powershell
python -m http.server 8000 --directory frontend
```

Ouvre ensuite:

```text
http://127.0.0.1:8000/index.html
```

## Configuration

Le fichier `.env` contient les variables sensibles:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
TMONEY_API_KEY=YOUR_TMONEY_API_KEY_HERE
FLOOZ_API_KEY=YOUR_FLOOZ_API_KEY_HERE
ADMIN_SECRET=change-this-admin-secret
```

En developpement, si `DATABASE_URL` reste vide, SQLite est utilise automatiquement.

## Deploiement

- Backend: Render
- Base de donnees: Supabase PostgreSQL
- Images: Cloudinary, stocker uniquement les URLs dans la base
- Variables sensibles: a definir dans le dashboard d'hebergement, jamais dans le code public

Commande de demarrage Render:

```text
gunicorn run:app
```
