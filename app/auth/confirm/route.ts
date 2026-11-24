import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (value === "/workspace" || value === "/reset-password") {
    return value;
  }
  return "/workspace";
}

function confirmationError(request: NextRequest) {
  return NextResponse.redirect(new URL("/sign-in?auth=confirmation", request.url));
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const allowedTypes: EmailOtpType[] = ["email", "recovery"];

  if (!tokenHash || !rawType || !allowedTypes.includes(rawType as EmailOtpType)) {
    return confirmationError(request);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType as EmailOtpType,
  });

  if (error) {
    return confirmationError(request);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
