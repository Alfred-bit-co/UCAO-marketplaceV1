-- Subscription periods are calendar months, never an approximation of 30 days.
begin;

alter table public.profiles
  add column if not exists subscription_activated_at timestamptz;

-- Backfill existing subscriptions for display. New and renewed subscriptions use
-- the precise start date stored by the function below.
update public.profiles
set subscription_activated_at = subscription_expires_at - interval '1 month'
where subscription_activated_at is null
  and subscription_expires_at is not null;

create or replace function public.activate_or_renew_subscription(p_user_id uuid, p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_period_start timestamptz;
begin
  if p_tier not in ('STANDARD', 'PREMIUM', 'VIP') then
    raise exception 'Palier invalide';
  end if;

  select case
    when subscription_expires_at > now() then subscription_expires_at
    else now()
  end
  into next_period_start
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profil introuvable';
  end if;

  update public.profiles
  set role = 'VENDEUR',
      subscription_tier = p_tier,
      subscription_activated_at = next_period_start,
      subscription_expires_at = next_period_start + interval '1 month'
  where id = p_user_id;
end;
$$;

revoke all on function public.activate_or_renew_subscription(uuid, text) from public;
grant execute on function public.activate_or_renew_subscription(uuid, text) to service_role;

commit;
