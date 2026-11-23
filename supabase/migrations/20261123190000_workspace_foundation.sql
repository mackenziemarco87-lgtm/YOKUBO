-- YOKUBO workspace foundation.
-- Workspace records are isolated by RLS. Workspace creation is only available
-- through the authenticated RPC, which creates the owner membership atomically.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.role = any (allowed_roles)
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.has_workspace_role(uuid, text[]) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;

revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
grant select on table public.workspaces to authenticated;
grant update (name) on table public.workspaces to authenticated;
grant select on table public.workspace_members to authenticated;

create policy "Members can read their workspaces"
on public.workspaces
for select
to authenticated
using ((select public.is_workspace_member(id)));

create policy "Workspace owners and admins can rename workspaces"
on public.workspaces
for update
to authenticated
using ((select public.has_workspace_role(id, array['owner', 'admin']::text[])))
with check ((select public.has_workspace_role(id, array['owner', 'admin']::text[])));

create policy "Members can read membership in their workspaces"
on public.workspace_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_workspace_member(workspace_id))
);

create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must sign in before creating a workspace.'
      using errcode = '42501';
  end if;

  if workspace_name is null or char_length(btrim(workspace_name)) not between 1 and 120 then
    raise exception 'Workspace name must be between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  insert into public.workspaces (name, created_by)
  values (btrim(workspace_name), current_user_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, current_user_id, 'owner');

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;
