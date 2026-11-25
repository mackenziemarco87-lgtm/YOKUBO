export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HotelWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) throw new Error("Unable to load workspace membership");
  if (!membership) notFound();

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (workspaceError) throw new Error("Unable to load workspace");
  if (!workspace) notFound();

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <Link className="yokubo-brand" href="/workspace"><span className="yokubo-mark">y</span><span>YOKUBO</span></Link>
        <span className="workspace-account">{user.email}</span>
      </header>
      <section className="workspace-content">
        <Link className="workspace-back" href="/workspace">← All workspaces</Link>
        <p className="eyebrow">HOTEL WORKSPACE · {membership.role}</p>
        <h1>{workspace.name}</h1>
        <p className="workspace-lede">Welcome to your hotel workspace. This is where your team and hotel operations will come together.</p>
        <section className="workspace-create-card">
          <h2>Get started</h2>
          <p>Your workspace is ready. Hotel data, team invitations, and AI agents are coming next.</p>
          <Link className="workspace-action" href="/index.html">Explore the hotel demo</Link>
          <p>The demo uses sample data and is shared across workspaces.</p>
        </section>
      </section>
    </main>
  );
}
