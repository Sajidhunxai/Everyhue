import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of use",
  description:
    "Terms for using Every Hue personal color analysis, wardrobe tools, and Look studio.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <section className="panel">
      <h1>Terms of use</h1>
      <p className="muted">Last updated: September 23, 2026</p>
      <p className="lead">
        Every Hue provides personal color and style suggestions for entertainment
        and education. Results are estimates, not professional colorimetry, fashion
        certification, or medical advice. You must be 13 or older.
      </p>
      <ul className="lead">
        <li>Do not upload photos of other people without their permission.</li>
        <li>Do not upload sexual or exploitative images, or photos of children for those purposes.</li>
        <li>
          Look studio may send your photo to our servers and to Google Gemini (or
          another image model) to recolor hair, eyes, lips, and clothes. Output can
          be imperfect.
        </li>
        <li>Do not abuse the API (scraping, spam, or attacks).</li>
        <li>
          You may delete your account at{" "}
          <Link href="/account/delete">Account deletion</Link> or in the Android
          app.
        </li>
        <li>We may update features; continued use means you accept the updated terms.</li>
      </ul>
      <p className="lead">
        Questions:{" "}
        <a href="mailto:support@asktheimageguru.com">support@asktheimageguru.com</a>
      </p>
    </section>
  );
}
