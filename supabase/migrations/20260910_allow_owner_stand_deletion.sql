-- Allows a seller to remove only their own stand. Deleting the stand releases
-- the corresponding subscription quota because the dashboard counts rows live.
drop policy if exists "Users delete own stands" on public.stands;
create policy "Users delete own stands" on public.stands
for delete using (auth.uid() = user_id);
