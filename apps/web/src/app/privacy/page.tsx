import Link from "next/link";

export default function PrivacyPage() {
  return (
    <section className="panel">
      <h1>Privacy policy</h1>
      <p className="muted">Last updated: August 28, 2026</p>
      <p className="lead">
        Every Hue helps you discover a seasonal color palette from a photo.
        This policy explains what we collect and how we use it.
      </p>
      <h2>What we collect</h2>
      <ul className="lead">
        <li>
          <strong>Account:</strong> name, email, and avatar from Google (or Facebook
          when enabled) via OAuth.
        </li>
        <li>
          <strong>Analysis results:</strong> seasonal palette, style tips, optional
          face/body selections, and related metadata saved to your account.
        </li>
        <li>
          <strong>Wardrobe, family profiles, and stylist chat:</strong> content you
          create while signed in.
        </li>
        <li>
          <strong>Photos:</strong> when you choose a photo, color samples are taken
          for analysis. Uploaded images are processed in memory and are not stored
          on our servers in this version.
        </li>
      </ul>
      <h2>How we use data</h2>
      <ul className="lead">
        <li>To run color analysis and personalize style recommendations.</li>
        <li>To sync wardrobe, family profiles, and chat across your devices.</li>
        <li>To secure the API and prevent abuse (rate limits).</li>
      </ul>
      <h2>Your choices</h2>
      <ul className="lead">
        <li>
          Delete your account and all server data anytime at{" "}
          <Link href="/account/delete">Account deletion</Link>.
        </li>
        <li>Sign out to clear your browser session.</li>
      </ul>
      <h2>Third parties</h2>
      <p className="lead">
        Sign-in is provided by Google and optionally Facebook. If AI stylist is
        enabled with an OpenAI key on the server, chat messages may be sent to
        OpenAI to generate replies.
      </p>
      <h2>Contact</h2>
      <p className="lead">
        For privacy requests, use the account deletion page or contact the app
        publisher listed on Google Play.
      </p>
      <p className="muted">
        Have counsel review this text before a public Play Store launch.
      </p>
    </section>
  );
}
