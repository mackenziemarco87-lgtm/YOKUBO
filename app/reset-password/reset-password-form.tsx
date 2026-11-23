"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || pending) return;

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
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setUpdated(true);
      setMessage("Your password has been updated. Sign in with your new password.");
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn’t update your password. Open the reset link from your email and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (updated) {
    return (
      <div className="signin-form">
        <p className="signin-message" role="status">{message}</p>
        <Link className="signin-submit signin-submit-link" href="/sign-in">
          Go to sign in
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
