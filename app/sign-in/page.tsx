import Link from "next/link";
import SignInForm from "./sign-in-form";

export default function SignInPage() {
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
      <section className="signin-layout" aria-labelledby="signin-title">
        <div className="signin-intro">
          <p className="eyebrow">HOSPITALITY AI OPERATING SYSTEM</p>
          <h1 id="signin-title">One workspace for your hotel team and AI agents.</h1>
          <p className="signin-subtitle">
            Sign in to manage your hotel workspace. This preview is where we’re
            building secure team access.
          </p>
          <Link className="demo-link" href="/index.html">
            Back to the hotel dashboard demo <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="signin-card">
          <div className="signin-card-heading">
            <h2>Welcome to YOKUBO</h2>
            <p>Sign in or create your workspace account.</p>
          </div>
          <SignInForm configured={configured} />
          {!configured && (
            <p className="setup-note" role="status">
              Sign-in isn’t connected on this preview yet. The Supabase project
              configuration is still needed.
            </p>
          )}
          <p className="signin-footnote">
            Hotel data separation is part of the foundation we’re building.
          </p>
        </div>
      </section>
      <footer className="signin-footer">YOKUBO · Hospitality operations, made clearer.</footer>
    </main>
  );
}
