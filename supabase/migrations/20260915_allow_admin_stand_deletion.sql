-- An administrator can remove any stand; sellers keep the right to remove only their own.
drop policy if exists "Admins delete stands" on public.stands;
create policy "Admins delete stands" on public.stands
for delete to authenticated
using (public.is_admin());
