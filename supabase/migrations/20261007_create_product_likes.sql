-- Likes sur les produits : un like par utilisateur connecté et par produit.
-- Les compteurs sont dans une table séparée (product_stats), mise à jour uniquement par trigger,
-- afin qu'un vendeur ne puisse pas gonfler ses propres likes en modifiant son produit.
--
-- Déjà appliquée dans Supabase le 07/10/2026 et testée :
--   like -> compteur à 1 ; visiteur anonyme lit le compteur ; un autre utilisateur ne voit pas
--   les likes d'autrui ; retrait -> compteur à 0 ; like de son propre produit refusé ;
--   falsification du compteur refusée ; doublon refusé.
-- Ce fichier sert de trace dans le dépôt.

begin;

create table if not exists public.product_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists idx_product_likes_product_id on public.product_likes (product_id);

create table if not exists public.product_stats (
  product_id uuid primary key references public.products(id) on delete cascade,
  like_count integer not null default 0 check (like_count >= 0)
);

alter table public.product_likes enable row level security;
alter table public.product_stats enable row level security;

-- product_likes : chacun ne voit, n'ajoute et ne retire que ses propres likes
-- (personne ne peut lister qui a aimé quoi)
drop policy if exists "Users read own likes" on public.product_likes;
create policy "Users read own likes"
  on public.product_likes for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users like visible products of others" on public.product_likes;
create policy "Users like visible products of others"
  on public.product_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.products p
      where p.id = product_id
        and p.user_id <> (select auth.uid())
    )
  );

drop policy if exists "Users remove own likes" on public.product_likes;
create policy "Users remove own likes"
  on public.product_likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- product_stats : lecture publique du nombre de likes, aucune écriture possible depuis le site
drop policy if exists "Like counts are readable" on public.product_stats;
create policy "Like counts are readable"
  on public.product_stats for select to anon, authenticated
  using (true);

revoke all on public.product_likes from public, anon, authenticated;
grant select, insert, delete on public.product_likes to authenticated;

revoke all on public.product_stats from public, anon, authenticated;
grant select on public.product_stats to anon, authenticated;

-- Mise à jour automatique du compteur
create or replace function public.update_product_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.product_stats (product_id, like_count)
    values (new.product_id, 1)
    on conflict (product_id) do update
      set like_count = public.product_stats.like_count + 1;
    return new;
  elsif tg_op = 'DELETE' then
    update public.product_stats
      set like_count = greatest(like_count - 1, 0)
      where product_id = old.product_id;
    return old;
  end if;
  return null;
end;
$$;

revoke execute on function public.update_product_like_count() from public, anon, authenticated;

drop trigger if exists trg_update_product_like_count on public.product_likes;
create trigger trg_update_product_like_count
  after insert or delete on public.product_likes
  for each row
  execute function public.update_product_like_count();

commit;

-- ===== ROLLBACK (seulement en cas de problème) =====
-- begin;
-- drop trigger if exists trg_update_product_like_count on public.product_likes;
-- drop function if exists public.update_product_like_count();
-- drop table if exists public.product_stats;
-- drop table if exists public.product_likes;
-- commit;