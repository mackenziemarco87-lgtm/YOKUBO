import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value === "/reset-password" || value === "/workspace"
    ? value
    : "/workspace";
}

function callbackRedirect(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set("yokubo_auth_next", "", {
    path: "/auth/callback",
    maxAge: 0,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const savedNextPath = request.cookies.get("yokubo_auth_next")?.value ?? null;
  const queryNextPath = request.nextUrl.searchParams.get("next");
  const nextPath = safeNextPath(savedNextPath ?? queryNextPath);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!code || !url || !publishableKey) {
    return callbackRedirect(
      request,
      !url || !publishableKey ? "/sign-in?auth=setup" : "/sign-in?auth=confirmation",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return callbackRedirect(request, "/sign-in?auth=confirmation");
  }

  return callbackRedirect(request, nextPath);
}
