import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy policy",
  description:
    "How Every Hue collects, uses, shares, and deletes account data and photos.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <section className="panel">
      <h1>Privacy policy</h1>
      <p className="muted">Last updated: September 23, 2026</p>
      <p className="lead">
        Every Hue (Ask the Image Guru) is a personal color and style app for people 13
        and older. This policy explains what we collect and how we use it.
      </p>

      <h2>What we collect</h2>
      <ul className="lead">
        <li>
          <strong>Account:</strong> name, email, and avatar when you sign in with
          email, Google, or Facebook (if enabled).
        </li>
        <li>
          <strong>Photos you choose:</strong> camera or gallery images for color
          analysis and Look studio. A copy may be saved with your analysis history
          and on your device.
        </li>
        <li>
          <strong>Analysis and app data:</strong> seasonal palette, style quiz,
          wardrobe, family profiles, looks, and stylist chat while you are signed in.
        </li>
      </ul>

      <h2>How we use data</h2>
      <ul className="lead">
        <li>To estimate a seasonal palette and style recommendations.</li>
        <li>To recolor hair, eyes, lips, and clothes in Look studio.</li>
        <li>To sync your saved results across devices.</li>
        <li>To secure the service and limit abuse.</li>
      </ul>

      <h2>Who we share photos and text with</h2>
      <p className="lead">
        We do not sell your data. To provide features we send limited data to
        processors:
      </p>
      <ul className="lead">
        <li>
          <strong>Google (Gemini)</strong> when Look studio uses cloud image
          editing. Your portrait is sent to generate a recolored image.
        </li>
        <li>
          <strong>OpenAI</strong> if the stylist or a fallback image model is
          enabled on the server. Chat text or a photo may be sent to generate a
          reply or edit.
        </li>
        <li>
          <strong>Google / Facebook</strong> only for sign-in if you choose those
          buttons.
        </li>
        <li>
          <strong>Supabase / our hosting</strong> to store your account and saved
          results.
        </li>
      </ul>
      <p className="lead">
        We do not use photos for advertising. We do not show third-party ads in
        the app.
      </p>

      <h2>Your choices</h2>
      <ul className="lead">
        <li>
          Delete your account and server data in the app (Home → Delete account)
          or at <Link href="/account/delete">asktheimageguru.com/account/delete</Link>.
        </li>
        <li>You can decline camera or photo access. Some features will not run.</li>
        <li>Sign out to clear the session on that device.</li>
      </ul>

      <h2>Children</h2>
      <p className="lead">
        Every Hue is not directed at children under 13. Do not create an account
        or upload a child’s photo unless you are the parent or guardian.
      </p>

      <h2>Contact</h2>
      <p className="lead">
        Privacy requests:{" "}
        <a href="mailto:support@asktheimageguru.com">support@asktheimageguru.com</a>
        . You can also use the account deletion page.
      </p>
    </section>
  );
}
