-- OAuth users accept the legal terms after their first Google callback.
alter table public.profiles
  add column if not exists cgu_accepted_at timestamptz;

grant update (cgu_accepted_at) on public.profiles to authenticated;

-- Keep the student-card path tied to auth.uid(), while allowing the stable
-- {user_id}/carte.ext filename used by the application.
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

  if p_url !~ ('^' || auth.uid()::text || '/carte\.(jpg|png|webp|avif)$') then
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
