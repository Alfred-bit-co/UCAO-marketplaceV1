# UCAO Marketplace

Marketplace étudiante UCAO-UUT — Next.js 15 + Supabase + micro-service Flask (FedaPay).

## Fonctionnalités

- Inscription / connexion via **Supabase Auth**
- **Vérification carte d'étudiant** : upload obligatoire, validation admin avant accès complet
- Rôles : `ACHETEUR`, `VENDEUR`, `ADMIN` — paliers vendeur : `STANDARD`, `PREMIUM`, `VIP`
- Catalogue produits avec pagination serveur (12/page), recherche et filtres
- Stands, dashboard vendeur, modération admin avec graphiques
- Upload d'images via **Supabase Storage**
- Paiements abonnement via **FedaPay** (backend Flask)
- Protection anti-bot via Cloudflare Turnstile (en cours d'intégration)
- SEO : sitemap, robots, Open Graph

## Lancer en local

```powershell
cd frontend
npm install
npm run dev
```

Dans un second terminal (paiements) :

```powershell
cd backend
pip install -r requirements.txt
python run.py
```

Ouvrir : http://127.0.0.1:3000

## Configuration

1. Copier `frontend/.env.local.example` vers `frontend/.env.local`
2. Copier `backend/.env.example` vers `backend/.env`
3. Exécuter le SQL de `SETUP.md` dans Supabase
4. Créer le bucket Storage `marketplace-media`

Variables frontend principales :

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PAYMENT_API_URL=
NEXT_PUBLIC_SITE_URL=
ARCJET_KEY=          # optionnel
```

## Tests

```powershell
cd frontend
npm test
```

## Déploiement

- **Frontend** : Vercel (root `frontend/`)
- **Backend paiement** : Railway ou Render (root `backend/`)
- **Base de données & auth** : Supabase PostgreSQL

Voir `SETUP.md` pour le schéma SQL complet et les migrations.
