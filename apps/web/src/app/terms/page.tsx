import Link from "next/link";

export default function TermsPage() {
  return (
    <section className="panel">
      <h1>Terms of use</h1>
      <p className="muted">Last updated: August 28, 2026</p>
      <p className="lead">
        Every Hue provides personal color and style suggestions for
        entertainment and education. Results are estimates, not professional
        colorimetry or medical advice.
      </p>
      <ul className="lead">
        <li>You must be old enough to use Google Play / App Store accounts in your region.</li>
        <li>Do not upload photos of others without permission.</li>
        <li>Do not abuse the API (scraping, automated spam, or reverse engineering for harm).</li>
        <li>
          You may delete your account at{" "}
          <Link href="/account/delete">Account deletion</Link>.
        </li>
        <li>We may update features; continued use means you accept the updated terms.</li>
      </ul>
      <p className="muted">Have counsel review before a public launch.</p>
    </section>
  );
}
