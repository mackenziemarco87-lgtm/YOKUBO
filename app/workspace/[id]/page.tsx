export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveHotelProfile } from "./actions";
import { addRequest, updateRequestStatus } from "./request-actions";

export default async function HotelWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ profile?: string; request?: string }> }) {
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
  const { data: requests, error: requestsError } = await supabase.from("hotel_requests").select("id, title, status, created_at").eq("workspace_id", id).order("created_at", { ascending: false });

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
        <nav className="workspace-tools" aria-label="Workspace tools">
          <a href="#hotel-overview">Overview</a>
          <a href="#hotel-details">Hotel details</a>
          <a href="#hotel-requests">Requests</a>
          <Link href="/index.html">AI assistant demo</Link>
          <Link href="/builder.html">Agent Studio demo</Link>
        </nav>
        <section id="hotel-overview" className="workspace-create-card">
          <h2>Hotel overview</h2>
          <div className="hotel-overview-grid">
            <div className="hotel-overview-stat"><span>LOCATION</span><strong>{profileError ? "Unavailable" : profile?.city || "Not added"}</strong></div>
            <div className="hotel-overview-stat"><span>ROOMS</span><strong>{profileError ? "Unavailable" : profile?.room_count ?? "Not added"}</strong></div>
            <div className="hotel-overview-stat"><span>OPEN REQUESTS</span><strong>{requestsError ? "Unavailable" : requests?.filter((item) => item.status === "open").length ?? 0}</strong></div>
          </div>
          <p>These details and requests belong to {workspace.name}. The assistant and Agent Studio links open demos with sample data.</p>
        </section>
        <section id="hotel-details" className="workspace-create-card">
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
        <section id="hotel-requests" className="workspace-create-card">
          <h2>Hotel requests</h2>
          {requestsError ? <p>Requests need database setup or could not be loaded.</p> : <>
            <p>Keep track of guest and team requests for this hotel.</p>
            {(status.request === "error" || status.request === "invalid") && <p className="workspace-error" role="alert">Couldn’t save the request. Check your entry and try again.</p>}
            {status.request === "added" && <p className="workspace-notice" role="status">Request added.</p>}
            {status.request === "updated" && <p className="workspace-notice" role="status">Request updated.</p>}
            <form action={addRequest} className="workspace-create-form">
              <input type="hidden" name="workspace_id" value={id} />
              <label htmlFor="request-title">New request</label>
              <input id="request-title" name="title" maxLength={200} required placeholder="For example, extra towels for room 215" />
              <button className="workspace-action" type="submit">Add request</button>
            </form>
            <div className="workspace-list">
              {requests?.length ? requests.map((item) => <div className="workspace-card" key={item.id}>
                <div><h2>{item.title}</h2><p>{item.status === "completed" ? "Completed" : "Open"}</p></div>
                <form action={updateRequestStatus} style={{ marginLeft: "auto" }}>
                  <input type="hidden" name="workspace_id" value={id} />
                  <input type="hidden" name="request_id" value={item.id} />
                  <input type="hidden" name="status" value={item.status === "open" ? "completed" : "open"} />
                  <button className="workspace-action" type="submit">{item.status === "open" ? "Mark completed" : "Reopen"}</button>
                </form>
              </div>) : <p>No requests yet. Add one above to get started.</p>}
            </div>
          </>}
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
