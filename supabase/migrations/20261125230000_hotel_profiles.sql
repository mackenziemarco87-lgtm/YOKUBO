-- Each workspace has one hotel profile. Access is limited to workspace members.
create table if not exists public.hotel_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  city text not null default '' check (char_length(city) <= 120),
  room_count integer check (room_count between 0 and 100000),
  updated_at timestamptz not null default now()
);
alter table public.hotel_profiles enable row level security;
revoke all on public.hotel_profiles from anon, authenticated;
grant select, insert, update on public.hotel_profiles to authenticated;
create policy "Members can read hotel profiles" on public.hotel_profiles
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Owners and admins can create hotel profiles" on public.hotel_profiles
  for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner','admin']::text[]));
create policy "Owners and admins can update hotel profiles" on public.hotel_profiles
  for update to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin']::text[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::text[]));
