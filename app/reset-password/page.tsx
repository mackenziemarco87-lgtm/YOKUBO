import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPasswordPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return (
    <main className="signin-page">
      <header className="signin-header">
        <Link className="yokubo-brand" href="/index.html" aria-label="Return to the hotel demo">
          <span className="yokubo-mark">y</span>
          <span>YOKUBO</span>
        </Link>
        <span className="preview-label">FOUNDATION PREVIEW</span>
      </header>
      <section className="signin-layout" aria-labelledby="reset-title">
        <div className="signin-intro">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1 id="reset-title">Choose a new password.</h1>
          <p className="signin-subtitle">
            Set a new password for your YOKUBO workspace account. Use at least
            eight characters and keep it private.
          </p>
          <Link className="demo-link" href="/sign-in">
            Back to sign in <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="signin-card">
          <div className="signin-card-heading">
            <h2>Reset your password</h2>
            <p>Enter your new password below.</p>
          </div>
          <ResetPasswordForm configured={configured} />
          <p className="signin-footnote">
            Your password is managed securely by Supabase Auth.
          </p>
        </div>
      </section>
      <footer className="signin-footer">YOKUBO · Hospitality operations, made clearer.</footer>
    </main>
  );
}
