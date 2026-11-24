# YOKUBO backend setup

## Workspace foundation

The preview branch includes a Supabase migration for private hotel workspaces:

`supabase/migrations/20261123190000_workspace_foundation.sql`

It creates the `workspaces` and `workspace_members` tables, row-level policies so members can only read workspaces they belong to, and an authenticated `create_workspace` function that creates a workspace and its owner membership together. The browser client cannot insert memberships or change member roles.

To enable the workspace screen, run the migration in the Supabase SQL Editor. The migration is additive; it does not change the hotel demo data. Do not put a database password or Supabase secret/service-role key in the app.

## Supabase email templates for the preview

This app uses Supabase Auth in a server-side Next.js flow. For links opened from an email client to establish the session in the preview, configure the **Confirm signup** template to use the server confirmation endpoint:

```html
<h2>Confirm your YOKUBO account</h2>
<p>Click below to confirm your email and open your YOKUBO workspace.</p>
<p><a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Confirm your email</a></p>
```

For the **Reset Password** template, use the same endpoint with the recovery type:

```html
<h2>Reset your YOKUBO password</h2>
<p><a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Set a new password</a></p>
```

Add this preview URL to **Authentication → URL Configuration → Redirect URLs**:

`https://yokubo-git-codex-stage-1-foundation-mackenziemarco87-lgtm.vercel.app/auth/confirm`

Keep the existing `/auth/callback` redirect as well. Do not paste any password, API secret, or token into the email template.

## Existing hospitality chat endpoint

The repository also includes a server-side chat endpoint at `/api/chat`. GitHub Pages hosts the static hotel demo and cannot run this server endpoint. The website does not use this backend until its chat is connected to it.

The chat endpoint expects `OPENAI_API_KEY` in Vercel environment variables. Keep that key on the server only. If OpenAI usage limits are reached, the demo can continue using its fixed sample replies.
