"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function context(formData: FormData) {
  const id = String(formData.get("workspace_id") || "");
  if (!uuid.test(id)) redirect("/workspace");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: membership, error } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", id).eq("user_id", user.id).maybeSingle();
  if (error || !membership) redirect("/workspace");
  return { id, user, supabase, path: `/workspace/${id}` };
}
export async function addRequest(formData: FormData) {
  const { id, user, supabase, path } = await context(formData);
  const title = String(formData.get("title") || "").trim();
  if (!title || title.length > 200) redirect(path + "?request=invalid");
  const { error } = await supabase.from("hotel_requests").insert({ workspace_id: id, title, created_by: user.id });
  if (error) redirect(path + "?request=error");
  revalidatePath(path);
  redirect(path + "?request=added");
}
export async function updateRequestStatus(formData: FormData) {
  const { id, supabase, path } = await context(formData);
  const requestId = String(formData.get("request_id") || "");
  const status = String(formData.get("status") || "");
  if (!uuid.test(requestId) || !["open", "completed"].includes(status)) redirect(path + "?request=invalid");
  const { data, error } = await supabase.from("hotel_requests").update({ status })
    .eq("workspace_id", id).eq("id", requestId).select("id").maybeSingle();
  if (error || !data) redirect(path + "?request=error");
  revalidatePath(path);
  redirect(path + "?request=updated");
}
