-- FractFlow: maps access control policy
-- Goal: public read, owner-only write/delete.

alter table public.maps enable row level security;
alter table public.maps force row level security;

-- Optional cleanup if policies already exist (safe for re-apply).
drop policy if exists "public read maps" on public.maps;
drop policy if exists "owner insert maps" on public.maps;
drop policy if exists "owner update maps" on public.maps;
drop policy if exists "owner delete maps" on public.maps;

create policy "public read maps"
on public.maps
for select
using (true);

create policy "owner insert maps"
on public.maps
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owner update maps"
on public.maps
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "owner delete maps"
on public.maps
for delete
to authenticated
using (auth.uid() = user_id);
