# YOKUBO backend setup

## Workspace foundation

The preview branch includes a Supabase migration for private hotel workspaces:

`supabase/migrations/20261123190000_workspace_foundation.sql`

It creates the `workspaces` and `workspace_members` tables, row-level policies so members can only read workspaces they belong to, and an authenticated `create_workspace` function that creates a workspace and its owner membership together. The browser client cannot insert memberships or change member roles.

To enable the workspace screen, run the migration in the Supabase SQL Editor. The migration is additive; it does not change the hotel demo data. Do not put a database password or Supabase secret/service-role key in the app.

## Email setup for the preview

The preview uses Supabase's built-in confirmation email and the existing `/auth/callback` URL. Keep that URL in **Authentication → URL Configuration → Redirect URLs**. Do not change the email templates for initial testing.

Supabase's built-in email sender is for development and is rate-limited. It is limited to project team email addresses and currently sends up to two emails per hour. If you reach the limit, wait before trying again. Custom SMTP is for sending Auth emails to general users or for higher volume; it is optional for this preview.

Once the email is confirmed, sign in and open `/workspace` to create the first hotel workspace.

## Existing hospitality chat endpoint

The repository also includes a server-side chat endpoint at `/api/chat`. GitHub Pages hosts the static hotel demo and cannot run this server endpoint. The website does not use this backend until its chat is connected to it.

The chat endpoint expects `OPENAI_API_KEY` in Vercel environment variables. Keep that key on the server only. If OpenAI usage limits are reached, the demo can continue using its fixed sample replies.
