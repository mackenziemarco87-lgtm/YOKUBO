import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/");

  return (
    <main className="workspace-preview">
      <a className="workspace-back" href="/">← Back to YOKUBO</a>
      <p className="eyebrow">YOKUBO WORKSPACE</p>
      <h1>You’re signed in.</h1>
      <p>
        Your account is connected. Next we’ll add your organization, property,
        and secure team access.
      </p>
    </main>
  );
}
