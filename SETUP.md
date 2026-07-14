# UCAO Marketplace - setup

## 1. Supabase

1. Crée un projet Supabase.
2. Copie les clés dans `frontend/.env.local` depuis `frontend/.env.local.example` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copie les clés serveur dans `backend/.env` depuis `backend/.env.example` :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Ne commit jamais `frontend/.env.local` ni `backend/.env`. Le `.gitignore` les ignore déjà.

## 2. Schéma SQL Supabase

Exécute ce SQL dans l’éditeur SQL Supabase.

```sql
create type public.user_role as enum ('SIMPLE', 'PREMIUM', 'VIP');
create type public.stand_status as enum ('pending', 'approved', 'rejected');
create type public.product_category as enum ('nourriture', 'vetements', 'numerique', 'livres', 'services');
create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role public.user_role not null default 'SIMPLE',
  phone text,
  subscription_type text,
  subscription_expires_at timestamptz,
  stand_limit integer generated always as (
    case role when 'VIP' then 5 when 'PREMIUM' then 3 else 0 end
  ) stored,
  created_at timestamptz not null default now()
);

create table public.stands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  banner_url text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.stand_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price integer not null check (price >= 0),
  category public.product_category not null,
  image_url text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stand_id uuid references public.stands(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  amount integer not null check (amount > 0),
  status public.order_status not null default 'pending',
  fedapay_transaction_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.stands enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Profiles are readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Approved stands are readable" on public.stands for select using (status = 'approved' or auth.uid() = user_id);
create policy "Users create own stands" on public.stands for insert with check (auth.uid() = user_id);
create policy "Users update own stands" on public.stands for update using (auth.uid() = user_id);

create policy "Products are readable" on public.products for select using (true);
create policy "Users create own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users delete own products" on public.products for delete using (auth.uid() = user_id);

create policy "Users read own orders" on public.orders for select using (auth.uid() = user_id);
```

Crée aussi un bucket Supabase Storage, par exemple `marketplace-media`, pour les images produits et bannières.

## 3. FedaPay

1. Crée un compte FedaPay.
2. Récupère les clés API et colle-les dans `backend/.env` :
   - `FEDAPAY_SECRET_KEY`
   - `FEDAPAY_PUBLIC_KEY`
   - `FEDAPAY_WEBHOOK_SECRET`
3. Configure l’URL webhook FedaPay vers Railway :
   - `https://ton-backend.up.railway.app/api/payments/fedapay/webhook`

## 4. Développement local

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Backend paiement :

```bash
cd backend
pip install -r requirements.txt
python run.py
```

## 5. Déploiement

Vercel :

1. Connecte le repo GitHub.
2. Définis le root directory sur `frontend/`.
3. Ajoute `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_PAYMENT_API_URL`.

Railway :

1. Connecte le même repo GitHub.
2. Définis le root directory sur `backend/`.
3. Ajoute toutes les variables de `backend/.env.example`.
4. Utilise Gunicorn avec `gunicorn run:app`.

## 6. IA mise de côté

L’ancienne intégration DeepSeek a été déplacée dans `backend/future/ai_recommendations/`. Elle n’est pas branchée au micro-service paiement. Pour la réactiver plus tard, recrée une API dédiée qui vérifie Supabase Auth, le rôle VIP, le rate limiting, puis appelle DeepSeek.
