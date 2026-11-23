import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { claims } } = await supabase.auth.getClaims();

  if (!claims) redirect("/");

  return (
    <main className="workspace-preview">
      <LinkBack />
      <p className="eyebrow">YOKUBO WORKSPACE</p>
      <h1>You’re signed in.</h1>
      <p>
        Your account is connected. Next we’ll add your organization, property,
        and secure team access.
      </p>
    </main>
  );
}

function LinkBack() {
  return <a className="workspace-back" href="/">← Back to YOKUBO</a>;
}
