export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "./actions";

type WorkspacePageProps = {
  searchParams: Promise<{ created?: string; error?: string; setup?: string }>;
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const supabase = await createClient();
  const [{ data: { user } }, params] = await Promise.all([
    supabase.auth.getUser(),
    searchParams,
  ]);

  if (!user) redirect("/sign-in?next=%2Fworkspace");

  const { data: memberships, error: membershipsError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id);

  let workspaces: Array<{ id: string; name: string; created_at: string }> = [];
  let workspaceReadError = membershipsError;

  if (!membershipsError && memberships?.length) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, created_at")
      .in("id", memberships.map((membership) => membership.workspace_id))
      .order("created_at", { ascending: true });

    if (error) {
      workspaceReadError = error;
    } else {
      workspaces = data ?? [];
    }
  }

  const databaseSetupNeeded =
    params.setup === "database" ||
    workspaceReadError?.code === "42P01" ||
    workspaceReadError?.code === "PGRST200" ||
    workspaceReadError?.code === "PGRST205";

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <Link className="yokubo-brand" href="/index.html">
          <span className="yokubo-mark">y</span>
          <span>YOKUBO</span>
        </Link>
        <span className="workspace-account">{user.email}</span>
      </header>

      <section className="workspace-content" aria-labelledby="workspace-title">
        <p className="eyebrow">YOUR YOKUBO ACCOUNT</p>
        <h1 id="workspace-title">
          {workspaces.length ? "Your hotel workspaces" : "Create your hotel workspace"}
        </h1>
        <p className="workspace-lede">
          A workspace is the private home for one hotel’s team, properties, and
          operations data.
        </p>

        {params.created === "1" && (
          <p className="workspace-notice" role="status">
            Your workspace is ready. It is private to you until you invite teammates.
          </p>
        )}
        {params.error === "name" && (
          <p className="workspace-error" role="alert">
            Enter a workspace name between 1 and 120 characters.
          </p>
        )}
        {params.error === "create" && (
          <p className="workspace-error" role="alert">
            We couldn’t create the workspace. Please try again.
          </p>
        )}

        {databaseSetupNeeded ? (
          <section className="workspace-setup" aria-labelledby="workspace-setup-title">
            <h2 id="workspace-setup-title">One-time database setup needed</h2>
            <p>
              The secure workspace tables are ready in the preview code, but
              they still need to be added to your Supabase project.
            </p>
            <ol>
              <li>Open your Supabase project and choose SQL Editor.</li>
              <li>Open the migration file linked below and copy its contents.</li>
              <li>Paste the SQL into a new Supabase query and click Run.</li>
            </ol>
            <a
              className="workspace-action"
              href="https://github.com/mackenziemarco87-lgtm/YOKUBO/blob/codex/stage-1-foundation/supabase/migrations/20261123190000_workspace_foundation.sql"
              target="_blank"
              rel="noreferrer"
            >
              Open workspace database setup SQL
            </a>
            <a
              className="workspace-secondary-action"
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              Open Supabase Dashboard
            </a>
          </section>
        ) : (
          <>
            {workspaceReadError && (
              <p className="workspace-error" role="alert">
                We couldn’t load your workspaces. Refresh the page or try again later.
              </p>
            )}

            {workspaces.length > 0 && (
              <div className="workspace-list">
                {workspaces.map((workspace) => {
                  const role = memberships?.find(
                    (membership) => membership.workspace_id === workspace.id,
                  )?.role;

                  return (
                    <Link className="workspace-card workspace-card-link" href={`/workspace/${workspace.id}`} key={workspace.id}>
                      <div className="workspace-card-mark" aria-hidden="true">Y</div>
                      <div>
                        <h2>{workspace.name}</h2>
                        <p>Hotel workspace · {role ?? "member"}</p>
                      </div>
                    <span className="workspace-card-arrow" aria-hidden="true">→</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <section className="workspace-create-card" aria-labelledby="create-title">
              <h2 id="create-title">
                {workspaces.length ? "Add another workspace" : "Name your hotel workspace"}
              </h2>
              <p>
                You’ll be the owner. You can invite teammates after the workspace is created.
              </p>
              <form action={createWorkspace} className="workspace-create-form">
                <label htmlFor="workspace-name">Hotel or company name</label>
                <input
                  id="workspace-name"
                  name="name"
                  type="text"
                  autoComplete="organization"
                  maxLength={120}
                  placeholder="For example, The Meridian Hotel"
                  required
                />
                <button className="workspace-action" type="submit">
                  Create workspace
                </button>
              </form>
            </section>
          </>
        )}

        <Link className="workspace-back" href="/index.html">
          ← Back to the hotel demo
        </Link>
      </section>
    </main>
  );
}
