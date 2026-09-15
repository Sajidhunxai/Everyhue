import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const SWATCHES = ["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8", "#E07A7A", "#F5F3F0"];

type Props = {
  error?: string;
  mode?: "signin" | "signup";
  googleReady: boolean;
  facebookReady: boolean;
  googleAction: () => Promise<void>;
  facebookAction: () => Promise<void>;
  emailAction: (formData: FormData) => Promise<void>;
};

export function SignInPanel({
  error,
  mode = "signin",
  googleReady,
  facebookReady,
  googleAction,
  facebookAction,
  emailAction,
}: Props) {
  const isSignup = mode === "signup";

  return (
    <div className="sign-page">
      <div className="sign-layout">
        <aside className="sign-aside anim-fade-up">
          <BrandLogo variant="full" size="lg" href="/" className="sign-brand" />
          <h1>Find the hues that belong with you</h1>
          <p className="sign-aside-lead">
            Sign in once and keep your seasonal palette, wardrobe colors, and
            family profiles synced everywhere.
          </p>
          <ul className="sign-benefits">
            <li>Personal seasonal color analysis</li>
            <li>Wardrobe &amp; family profiles synced</li>
            <li>Delete your data anytime</li>
          </ul>
          <div className="sign-swatches-large" aria-hidden="true">
            {SWATCHES.map((hex, i) => (
              <span
                key={hex}
                className="sign-swatch-lg"
                style={{
                  background: hex,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </aside>

        <div className="sign-card anim-fade-up anim-delay-1">
          <h2 className="sign-card-title">
            {isSignup ? "Create account" : "Welcome back"}
          </h2>
          <p className="sign-lead">
            {isSignup
              ? "Sign up with email, or continue with Google."
              : `Continue with email${googleReady || facebookReady ? ", Google" : ""}${facebookReady ? ", or Facebook" : ""}. We never sell your photos.`}
          </p>

          {error ? <p className="error sign-error">{error}</p> : null}

          <form action={emailAction} className="sign-email-form">
            {isSignup ? (
              <label className="sign-field">
                <span>Name</span>
                <input name="name" type="text" autoComplete="name" placeholder="Optional" />
              </label>
            ) : null}
            <label className="sign-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label className="sign-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={isSignup ? 8 : 1}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
              />
            </label>
            <input type="hidden" name="mode" value={mode} />
            <button className="btn btn-primary" type="submit">
              {isSignup ? "Create account" : "Sign in with email"}
            </button>
          </form>

          <p className="sign-switch">
            {isSignup ? (
              <>
                Already have an account? <Link href="/login">Sign in</Link>
              </>
            ) : (
              <>
                New here? <Link href="/login?mode=signup">Create an account</Link>
              </>
            )}
          </p>

          <div className="sign-or" aria-hidden="true">
            <span>or</span>
          </div>

          <div className="auth-stack sign-actions">
            {googleReady ? (
              <form action={googleAction}>
                <button className="btn btn-google" type="submit">
                  Continue with Google
                </button>
              </form>
            ) : null}
            {facebookReady ? (
              <form action={facebookAction}>
                <button className="btn btn-facebook" type="submit">
                  Continue with Facebook
                </button>
              </form>
            ) : null}
          </div>

          <p className="sign-footer muted">
            By signing in you agree to our{" "}
            <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy">Privacy policy</Link>.
          </p>
        </div>
      </div>

      <Link href="/" className="sign-back muted">
        ← Back to home
      </Link>
    </div>
  );
}
