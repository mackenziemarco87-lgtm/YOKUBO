# YOKUBO backend setup

## Workspace foundation

The preview branch includes a Supabase migration for private hotel workspaces:

`supabase/migrations/20261123190000_workspace_foundation.sql`

It creates:

- `workspaces` and `workspace_members` tables
- Row Level Security policies so members can only read workspaces they belong to
- An authenticated `create_workspace` function that creates a workspace and its owner membership together
- Limited database grants; the browser client cannot insert memberships or change member roles

To enable the workspace screen, open your Supabase project’s **SQL Editor**, paste the migration file contents into a new query, and run it. The migration is additive; it does not change the hotel demo data. Do not put a database password or Supabase secret/service-role key in the app.

Once the migration has run, sign in to the foundation preview and open `/workspace`. The first signed-in user can create a hotel workspace. Membership invitations and property records will be added in later steps.

## Existing hospitality chat endpoint

The repository also includes a server-side chat endpoint at `/api/chat`. GitHub Pages hosts the static hotel demo and cannot run this server endpoint. The website does not use this backend until its chat is connected to it.

The chat endpoint expects `OPENAI_API_KEY` in Vercel environment variables. Keep that key on the server only. If OpenAI usage limits are reached, the demo can continue using its fixed sample replies.
