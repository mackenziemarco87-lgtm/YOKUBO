"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "ready" | "invalid" | "updated";

export default function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<RecoveryState>(configured ? "checking" : "invalid");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (active) setState(!error && data.user ? "ready" : "invalid");
    }).catch(() => {
      if (active) setState("invalid");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") setState("invalid");
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setState(session ? "ready" : "invalid");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || state !== "ready" || pending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setMessage("Those passwords don’t match. Please check them and try again.");
      return;
    }

    setMessage("");
    setPending(true);

    try {
      const supabase = createClient();
      const { data: userData, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !userData.user) {
        setState("invalid");
        setMessage("This reset link is no longer valid. Request a fresh one from the sign-in page.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      setState("updated");
      setMessage(
        signOutError
          ? "Your password changed. For safety, sign out of this browser, then sign in again with the new password."
          : "Your password changed. We signed you out; sign in again with your new password.",
      );
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn’t update your password. Request a fresh reset link and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (state === "checking") {
    return <p className="signin-message" role="status">Checking your secure reset link…</p>;
  }

  if (state === "invalid") {
    return (
      <div className="signin-form">
        <p className="signin-message" role="alert">
          {message || "This reset link is expired or already used. Request a new one to continue."}
        </p>
        <Link className="signin-submit signin-submit-link" href="/sign-in">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (state === "updated") {
    return (
      <div className="signin-form">
        <p className="signin-message" role="status">{message}</p>
        <Link className="signin-submit signin-submit-link" href="/sign-in">
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form className="signin-form" onSubmit={handleSubmit}>
      <label htmlFor="password">New password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        placeholder="At least 8 characters"
        required
        disabled={!configured || pending}
      />

      <label htmlFor="confirmPassword">Confirm new password</label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        placeholder="Enter it again"
        required
        disabled={!configured || pending}
      />

      <button className="signin-submit" type="submit" disabled={!configured || pending}>
        {pending ? "Updating password…" : "Update password"}
      </button>

      {message && <p className="signin-message" role="status">{message}</p>}
      {!configured && (
        <p className="setup-note" role="status">
          Password recovery is not connected on this preview yet.
        </p>
      )}
      <p className="signin-switch">
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </form>
  );
}
