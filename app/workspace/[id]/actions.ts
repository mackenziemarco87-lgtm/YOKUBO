"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveHotelProfile(formData: FormData) {
  const id = String(formData.get("workspace_id") || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) redirect("/workspace");
  const path = `/workspace/${id}`;
  const city = String(formData.get("city") || "").trim();
  const rawRooms = String(formData.get("room_count") || "").trim();
  const rooms = rawRooms === "" ? null : Number(rawRooms);
  if (city.length > 120 || (rooms !== null && (!Number.isInteger(rooms) || rooms < 0 || rooms > 100000))) {
    redirect(path + "?profile=invalid");
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: membership } = await supabase.from("workspace_members").select("role")
    .eq("workspace_id", id).eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) redirect("/workspace");
  const { error } = await supabase.from("hotel_profiles").upsert({
    workspace_id: id, city, room_count: rooms, updated_at: new Date().toISOString(),
  }, { onConflict: "workspace_id" });
  if (error) redirect(path + "?profile=error");
  revalidatePath(path);
  redirect(path + "?profile=saved");
}
