"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type FormMode = "sign-in" | "sign-up" | "reset";

type SignInFormProps = {
  configured: boolean;
};

export default function SignInForm({ configured }: SignInFormProps) {
  const [mode, setMode] = useState<FormMode>("sign-in");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || pending) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setMessage("");
    setPending(true);

    try {
      const supabase = createClient();

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Freset-password`,
        });
        if (error) throw error;
        setMessage("If there’s an account for that email, a password reset link will arrive shortly.");
      } else if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fworkspace`,
          },
        });

        if (error) throw error;
        if (data.session) {
          window.location.assign("/workspace");
          return;
        }
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign("/workspace");
        return;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t complete that request. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function switchMode(nextMode: FormMode) {
    setMessage("");
    setMode(nextMode);
  }

  return (
    <form className="signin-form" onSubmit={handleSubmit}>
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@hotel.com"
        required
        disabled={!configured || pending}
      />

      {mode !== "reset" && (
        <>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            placeholder="At least 8 characters"
            required
            disabled={!configured || pending}
          />
        </>
      )}

      <button className="signin-submit" type="submit" disabled={!configured || pending}>
        {pending
          ? "Please wait…"
          : mode === "reset"
            ? "Send reset link"
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
      </button>

      {mode === "sign-in" && (
        <p className="signin-switch">
          <button type="button" onClick={() => switchMode("reset")} disabled={!configured || pending}>
            Forgot your password?
          </button>
        </p>
      )}

      <p className="signin-switch">
        {mode === "sign-up"
          ? "Already have an account?"
          : mode === "reset"
            ? "Remembered your password?"
            : "New to YOKUBO?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          disabled={pending}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>

      {message && <p className="signin-message" role="status">{message}</p>}
      {mode === "reset" && (
        <p className="signin-switch">
          <Link href="/index.html">Back to the hotel demo</Link>
        </p>
      )}
    </form>
  );
}
