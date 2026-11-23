"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") || "").trim();

  if (name.length < 1 || name.length > 120) {
    redirect("/workspace?error=name");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=%2Fworkspace");
  }

  const { error } = await supabase.rpc("create_workspace", {
    workspace_name: name,
  });

  if (error) {
    if (error.code === "PGRST202" || error.code === "42P01") {
      redirect("/workspace?setup=database");
    }
    redirect("/workspace?error=create");
  }

  redirect("/workspace?created=1");
}
