import Link from "next/link";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";
import { HeroVisual, ShowcaseVisual } from "@/components/hero-visual";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, faqJsonLd, siteConfig } from "@/lib/seo";

export const metadata = buildMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  path: "/",
  keywords: ["color season", "cool undertone", "warm undertone", "personal stylist"],
});

const HOME_FAQS = [
  {
    question: "What is seasonal color analysis?",
    answer:
      "Seasonal color analysis matches your skin undertone and contrast to a color season (like Soft Autumn or Deep Winter) so clothes and makeup flatter you.",
  },
  {
    question: "How does Every Hue analyze my photo?",
    answer:
      "You upload a daylight face photo. We sample colors in CIE Lab space, estimate undertone, and map you to a 12-season palette with wardrobe and shopping tips.",
  },
  {
    question: "Do you store my photos?",
    answer:
      "Photos are processed for analysis. We do not sell your images. See our privacy policy for retention details and how to delete your account anytime.",
  },
  {
    question: "Is this professional colorimetry?",
    answer:
      "Every Hue is for style education and entertainment. Results are estimates based on photo sampling — not a lab colorimeter or medical advice.",
  },
];

const FEATURES = [
  {
    title: "Seasonal palette",
    desc: "Discover your undertone and a 12-season color profile from a single photo.",
    href: "/analyze",
    swatches: ["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8"],
  },
  {
    title: "Compare photos",
    desc: "Upload two shots and we pick the one with better lighting for analysis.",
    href: "/compare",
    swatches: ["#5A7FB8", "#F5F3F0", "#E07A7A", "#1C2028"],
  },
  {
    title: "Wardrobe & shop",
    desc: "Save colors you love and browse suit and accessory ideas in your palette.",
    href: "/wardrobe",
    swatches: ["#12141A", "#7B9FD4", "#E8A87C", "#A8AEB8"],
  },
  {
    title: "Family profiles",
    desc: "Keep separate palettes for partner, kids, or anyone in your household.",
    href: "/profiles",
    swatches: ["#9BC4A8", "#E8A87C", "#7B9FD4", "#F5F3F0"],
  },
  {
    title: "AI stylist",
    desc: "Ask outfit questions and get advice tailored to your season and neutrals.",
    href: "/stylist",
    swatches: ["#B8A8C8", "#7B9FD4", "#1C2028", "#E8A87C"],
  },
  {
    title: "Style quiz",
    desc: "Answer a few questions and get suit picks, outfit ideas, and a shopping plan.",
    href: "/quiz",
    swatches: ["#5A7FB8", "#E8A87C", "#1C2028", "#9BC4A8"],
  },
  {
    title: "Export & share",
    desc: "Download a printable style card with palette swatches and quick tips.",
    href: "/analyze",
    swatches: ["#F5F3F0", "#7B9FD4", "#9BC4A8", "#12141A"],
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Take a clear photo",
    desc: "Natural daylight, neutral background, face and shoulders visible. Skip filters.",
  },
  {
    n: "2",
    title: "We analyze undertone",
    desc: "Lab color science maps your skin sampling to an original 12-season profile.",
  },
  {
    n: "3",
    title: "Build your palette",
    desc: "Get swatches, styling tips, wardrobe tools, a personalized style quiz, and optional AI stylist chat.",
  },
] as const;

export default async function HomePage() {
  const session = await auth();
  const primaryHref = session ? "/analyze" : "/login";
  const primaryLabel = session ? "Start analyzing" : "Sign in to get started";

  return (
    <div className="landing">
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <section className="hero hero-split">
        <div className="hero-copy">
          <BrandLogo href="/" size="lg" className="hero-brand" />
          <h1>Find the hues that belong with you</h1>
          <p className="lead">
            Upload a daylight photo and get a seasonal palette, styling tips, and
            wardrobe tools — built on CIE Lab color science, not guesswork.
          </p>
          <div className="hero-swatches" aria-hidden="true">
            {["#7B9FD4", "#E8A87C", "#9BC4A8", "#B8A8C8", "#E07A7A", "#F5F3F0"].map(
              (hex) => (
                <span key={hex} style={{ background: hex }} />
              ),
            )}
          </div>
          <div className="actions">
            <Link className="btn btn-primary" href={primaryHref}>
              {primaryLabel}
            </Link>
            {session ? (
              <Link className="btn btn-secondary" href="/dashboard">
                Open dashboard
              </Link>
            ) : (
              <Link className="btn btn-secondary" href="/privacy">
                How we handle photos
              </Link>
            )}
          </div>
        </div>
        <HeroVisual />
      </section>

      <section className="landing-section showcase-section">
        <ShowcaseVisual />
        <div className="showcase-copy">
          <p className="section-kicker">Your colors, revealed</p>
          <h2>Science meets style</h2>
          <p className="section-lead">
            Every Hue maps your undertone to a personal palette — then helps you
            wear it with confidence through wardrobe tools, shopping ideas, and an
            AI stylist.
          </p>
        </div>
      </section>
      <section className="landing-section">
        <p className="section-kicker">How it works</p>
        <h2>Three steps to your palette</h2>
        <div className="steps">
          {STEPS.map((step) => (
            <article key={step.n} className="step-card">
              <span className="step-num">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <p className="section-kicker">Features</p>
        <h2>Everything in one place</h2>
        <p className="section-lead">
          From first analysis to everyday outfit questions — on web and Android.
        </p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="feature-card">
              <div className="feature-swatches" aria-hidden="true">
                {f.swatches.map((hex) => (
                  <span key={hex} style={{ background: hex }} />
                ))}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="feature-link">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section trust-panel">
        <p className="section-kicker">Privacy first</p>
        <h2>Your photos, your control</h2>
        <p className="section-lead">
          We built Every Hue for real people — not data brokers. You can read
          exactly what we collect, how long we keep it, and how to delete your
          account at any time.
        </p>
        <ul className="trust-list">
          <li>No selling of personal photos or profiles</li>
          <li>Sign in with Google — no passwords to manage</li>
          <li>Delete your account and data from settings</li>
        </ul>
        <div className="actions">
          <Link className="btn btn-secondary" href="/privacy">
            Read privacy policy
          </Link>
          <Link className="btn btn-secondary" href="/terms">
            Terms of use
          </Link>
        </div>
      </section>

      <section className="landing-section">
        <p className="section-kicker">FAQ</p>
        <h2>Common questions</h2>
        <div className="faq-list">
          {HOME_FAQS.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-section cta-panel">
        <h2>Ready to find your hues?</h2>
        <p className="section-lead">
          {session
            ? "Your account is ready — upload a photo and see your palette in under a minute."
            : "Sign in free with Google, upload a daylight photo, and explore your colors."}
        </p>
        <Link className="btn btn-primary" href={primaryHref}>
          {primaryLabel}
        </Link>
      </section>
    </div>
  );
}
