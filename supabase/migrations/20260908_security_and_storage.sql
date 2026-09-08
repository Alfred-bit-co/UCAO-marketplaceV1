-- Apply this migration in Supabase SQL Editor after the base schema in SETUP.md.
-- It is safe to run on an existing project.

begin;

-- Profiles contain private data (email, student-card path and moderation notes).
-- The public catalogue reads the deliberately limited public_profiles view instead.
alter table public.profiles enable row level security;
drop policy if exists "Profiles are readable" on public.profiles;
drop policy if exists "Users read own profile or admins read profiles" on public.profiles;
create policy "Users read own profile or admins read profiles" on public.profiles
for select using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'ADMIN'
  )
);

create or replace view public.public_profiles
with (security_invoker = false)
as
select id, full_name, role, phone, subscription_tier
from public.profiles;

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

revoke update (student_id_url) on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Public images can be displayed by the catalogue, but only their owner can write
-- into the matching products/<user-id>/ or stands/<user-id>/ directory.
insert into storage.buckets (id, name, public)
values ('marketplace-media', 'marketplace-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users manage own marketplace media" on storage.objects;
create policy "Users manage own marketplace media" on storage.objects
for all to authenticated
using (
  bucket_id = 'marketplace-media'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'marketplace-media'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Student cards never enter a public bucket. Students can manage only their own
-- directory and administrators can create short-lived signed URLs to review them.
insert into storage.buckets (id, name, public)
values ('student-ids', 'student-ids', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users manage own student card" on storage.objects;
create policy "Users manage own student card" on storage.objects
for all to authenticated
using (
  bucket_id = 'student-ids'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'student-ids'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins read student cards" on storage.objects;
create policy "Admins read student cards" on storage.objects
for select to authenticated
using (
  bucket_id = 'student-ids'
  and exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'ADMIN'
  )
);

-- A client cannot point its profile to an arbitrary Storage object. The path must
-- be its own freshly-uploaded card.
create or replace function public.submit_student_id(p_url text)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifie';
  end if;

  if p_url !~ ('^' || auth.uid()::text || '/carte-[0-9]+\\.(jpg|png|webp)$') then
    raise exception 'Chemin de carte invalide';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'student-ids' and name = p_url
  ) then
    raise exception 'Carte introuvable';
  end if;

  update public.profiles
  set student_id_url = p_url, verification_status = 'pending', verification_note = null
  where id = auth.uid();
end;
$$;

-- Clubs are managed by administrators and publicly readable.
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  banner_url text not null,
  external_url text not null,
  short_description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;
drop policy if exists "Everyone reads clubs" on public.clubs;
create policy "Everyone reads clubs" on public.clubs for select using (true);
drop policy if exists "Admins manage clubs" on public.clubs;
create policy "Admins manage clubs" on public.clubs
for all using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid() and admin_profile.role = 'ADMIN'
  )
);

commit;
