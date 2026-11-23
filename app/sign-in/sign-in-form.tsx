"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type SignInFormProps = {
  configured: boolean;
};

export default function SignInForm({ configured }: SignInFormProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
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

      if (mode === "sign-up") {
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
      setMessage(error instanceof Error ? error.message : "We couldn't complete that request. Please try again.");
    } finally {
      setPending(false);
    }
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

      <button className="signin-submit" type="submit" disabled={!configured || pending}>
        {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
      </button>

      <p className="signin-switch">
        {mode === "sign-in" ? "New to YOKUBO?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>

      {message && <p className="signin-message" role="status">{message}</p>}
    </form>
  );
}
