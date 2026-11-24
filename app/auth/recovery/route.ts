import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function recoveryRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/reset-password", request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!code || !url || !publishableKey) {
    return recoveryRedirect(request);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return recoveryRedirect(request);
  }

  return recoveryRedirect(request);
}
