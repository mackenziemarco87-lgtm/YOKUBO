export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveHotelProfile } from "./actions";

export default async function HotelWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ profile?: string }> }) {
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

  const status = await searchParams;
  const { data: profile, error: profileError } = await supabase.from("hotel_profiles").select("city, room_count").eq("workspace_id", id).maybeSingle();
  const canEdit = ["owner", "admin"].includes(membership.role);

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
          <h2>Hotel details</h2>
          {profileError ? (
            <p>Hotel details need database setup. Please ask your administrator to complete the hotel profile setup.</p>
          ) : (
            <>
              <p>Location: {profile?.city || "Not added yet"}</p>
              <p>Rooms: {profile?.room_count ?? "Not added yet"}</p>
              {status.profile === "saved" && <p className="workspace-notice" role="status">Hotel details saved.</p>}
              {status.profile === "invalid" && <p className="workspace-error" role="alert">Check the location and room count, then try again.</p>}
              {status.profile === "error" && <p className="workspace-error" role="alert">Couldn’t save hotel details. Please try again.</p>}
              {canEdit && <form action={saveHotelProfile} className="workspace-create-form">
                <input type="hidden" name="workspace_id" value={id} />
                <label htmlFor="city">City or location</label>
                <input id="city" name="city" maxLength={120} defaultValue={profile?.city ?? ""} placeholder="For example, Barcelona" />
                <label htmlFor="room_count">Number of rooms</label>
                <input id="room_count" name="room_count" type="number" min="0" max="100000" defaultValue={profile?.room_count ?? ""} placeholder="For example, 40" />
                <button className="workspace-action" type="submit">Save hotel details</button>
              </form>}
            </>
          )}
        </section>
        <section className="workspace-create-card">
          <h2>Explore the hotel demo</h2>
          <p>See an example dashboard with sample data.</p>
          <Link className="workspace-action" href="/index.html">Open demo</Link>
        </section>
      </section>
    </main>
  );
}
