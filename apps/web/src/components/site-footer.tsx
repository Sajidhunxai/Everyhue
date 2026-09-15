import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const FEATURE_LINKS = [
  { href: "/analyze", label: "Color analysis" },
  { href: "/compare", label: "Compare photos" },
  { href: "/shop", label: "Shop by season" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/profiles", label: "Family profiles" },
  { href: "/stylist", label: "AI stylist" },
  { href: "/quiz", label: "Style quiz" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/account/delete", label: "Delete account" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandLogo href="/" size="sm" className="footer-logo" />
          <p className="footer-tagline">
            Find the hues that belong with you. Personal color analysis for
            everyone — inclusive, practical, and built on color science.
          </p>
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <h3>Features</h3>
            <ul>
              {FEATURE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3>Legal &amp; privacy</h3>
            <ul>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3>Photo tips</h3>
            <ul className="footer-tips">
              <li>Use natural daylight</li>
              <li>No heavy filters or makeup</li>
              <li>Face the camera, shoulders visible</li>
              <li>We never sell your photos</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="muted">© {year} Every Hue. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
