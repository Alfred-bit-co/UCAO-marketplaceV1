# UCAO Marketplace

Le modèle de vente est 100 % WhatsApp : aucun panier, checkout ou paiement de produit n'est activé sur la plateforme. Le micro-service Flask ne traite que les abonnements vendeurs.

Marketplace étudiante UCAO-UUT — Next.js 15 + Supabase + micro-service Flask (FedaPay).

## Fonctionnalités

- Inscription / connexion via **Supabase Auth** (e-mail et mot de passe, ou Google via **Google Identity Services**)
- E-mails d'authentification envoyés par **Resend** (expéditeur `noreply@ucaomarketplace.com`)
- **Vérification carte d'étudiant** : upload obligatoire, validation admin avant accès complet
- Rôles : `ACHETEUR`, `VENDEUR`, `ADMIN` — paliers vendeur : `STANDARD`, `PREMIUM`, `VIP`
- Catalogue produits avec pagination serveur (12/page), recherche et filtres
- Stands, dashboard vendeur, modération admin avec graphiques
- Upload d'images via **Supabase Storage**
- Paiements abonnement via **FedaPay** (backend Flask)
- Protection anti-bot via **Cloudflare Turnstile** (inscription, connexion, mot de passe oublié)
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
4. Exécuter la migration `supabase/migrations/20260908_security_and_storage.sql` dans Supabase

Variables frontend principales :

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PAYMENT_API_URL=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY= # optionnel, anti-bot Cloudflare Turnstile
TURNSTILE_SECRET_KEY=           # secret serveur Turnstile, optionnel en développement
```

## Tests

```powershell
cd frontend
npm test
```

## Déploiement

- **Frontend** : Vercel (root `frontend/`), domaine officiel https://www.ucaomarketplace.com
- **Backend paiement** : Render, service `ucao-marketplace-api`, région Oregon (États-Unis), root `backend/`
- **Base de données, auth et fichiers** : Supabase PostgreSQL, région `eu-west-1` (Irlande)
- **E-mails d'authentification** : Resend, région Irlande, expéditeur `noreply@ucaomarketplace.com`

Voir `SETUP.md` pour le schéma SQL complet et les migrations.
