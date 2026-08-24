# UCAO Marketplace

Marketplace etudiante UCAO UUT en Next.js + Tailwind CSS avec backend Flask.

## Fonctionnalites

- Inscription / connexion via Supabase Auth.
- Rôles applicatifs : `ACHETEUR`, `VENDEUR`, `ADMIN` ; les paliers vendeur sont `STANDARD`, `PREMIUM`, `VIP`.
- Produits avec categories: nourriture, vetements, numerique, livres, services.
- Pagination produits: 5 par page.
- Tri d'affichage: VIP, Premium, Simple.
- Stands en bandes larges avec pagination 1 par 1.
- Dashboard vendeur : ajout, modification et suppression de produits ; création de stand.
- Limites de stands : STANDARD 0, PREMIUM 1, VIP 5.
- IA DeepSeek preparee cote backend, reservee aux vendeurs VIP.
- Paiements TMoney/Flooz preparés dans `.env`, activation manuelle par admin.
- Garde-fous OWASP Top 10: validation d'entree, hash de mot de passe, JWT, CORS limite, cache-control, rate limit simple, controle d'acces par role.

## Lancer en local

```powershell
cd C:\Users\alfre\Desktop\ucao-marketplace
python -m pip install -r requirements.txt
python run.py
```

Dans un deuxième terminal :

```powershell
cd C:\Users\alfre\Desktop\ucao-marketplace\frontend
npm install
npm run dev
```

Ouvre ensuite:

```text
http://127.0.0.1:3000
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

## Dernieres modifications du profil

- Le profil permet maintenant de modifier separement le prenom et le nom.
- L'adresse email et le numero de telephone sont affiches en lecture seule.
- Un compte historique sans téléphone peut le renseigner une seule fois depuis le parcours vendeur.
- Une règle SQL Supabase bloque ensuite toute modification directe de ce numéro (voir `SETUP.md`).
- La page profil affiche un resume du compte, le role et des messages de confirmation ou d'erreur.
