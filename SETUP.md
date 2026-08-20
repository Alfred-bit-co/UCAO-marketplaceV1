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

-- Cree automatiquement le profil applicatif apres une inscription Supabase.
-- Le role utilise la valeur par defaut definie sur public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Rattrape les comptes crees avant la mise en place du declencheur.
insert into public.profiles (id, full_name, email, phone)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', ''),
  users.email,
  users.raw_user_meta_data ->> 'phone'
from auth.users as users
where not exists (
  select 1 from public.profiles where profiles.id = users.id
);

create or replace function public.prevent_profile_phone_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    raise exception 'Le numero de telephone ne peut pas etre modifie';
  end if;
  return new;
end;
$$;

create trigger prevent_profile_phone_change
before update on public.profiles
for each row execute function public.prevent_profile_phone_change();

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

create table public.platform_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 10 and 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.stands enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.platform_reviews enable row level security;

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

create policy "Users read own reviews" on public.platform_reviews
for select using (auth.uid() = user_id);

create policy "Users create own reviews" on public.platform_reviews
for insert with check (auth.uid() = user_id);

create policy "Users update own reviews" on public.platform_reviews
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users delete own reviews" on public.platform_reviews
for delete using (auth.uid() = user_id);

create policy "Everyone reads approved reviews" on public.platform_reviews
for select using (status = 'approved');

create policy "Admins manage reviews" on public.platform_reviews
for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role::text = 'ADMIN')
) with check (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role::text = 'ADMIN')
);
```

Crée aussi un bucket Supabase Storage, par exemple `marketplace-media`, pour les images produits et bannières.

### Mise à jour d'une base existante

Si les tables existent déjà, exécute ce bloc pour réactiver proprement la lecture et la modération des avis sans recréer les données :

```sql
alter table public.platform_reviews enable row level security;

-- Supprime aussi les anciennes policies portant d'autres noms.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'platform_reviews'
  loop
    execute format('drop policy if exists %I on public.platform_reviews', policy_record.policyname);
  end loop;
end;
$$;

create policy "Reviews select" on public.platform_reviews
for select using (
  (select auth.uid()) = user_id
  or status = 'approved'
  or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'
  )
);

create policy "Reviews insert" on public.platform_reviews
for insert with check ((select auth.uid()) = user_id);

create policy "Reviews update" on public.platform_reviews
for update
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'
  )
)
with check (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'
  )
);

create policy "Reviews delete" on public.platform_reviews
for delete using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role::text = 'ADMIN'
  )
);
```

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
