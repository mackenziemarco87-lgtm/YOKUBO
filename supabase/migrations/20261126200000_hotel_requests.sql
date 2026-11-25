create table public.hotel_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'completed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index hotel_requests_workspace_created_idx on public.hotel_requests(workspace_id, created_at desc);
alter table public.hotel_requests enable row level security;
revoke all on public.hotel_requests from anon, authenticated;
grant select, insert on public.hotel_requests to authenticated;
grant update (status) on public.hotel_requests to authenticated;
create policy "Members can view hotel requests" on public.hotel_requests
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Members can add hotel requests" on public.hotel_requests
  for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "Members can update hotel request status" on public.hotel_requests
  for update to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
