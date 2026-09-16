"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/compare", label: "Compare" },
  { href: "/match", label: "Match" },
  { href: "/shop", label: "Shop" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

const MORE_LINKS = [
  { href: "/beauty", label: "Makeup & hair" },
  { href: "/try-on", label: "Look studio" },
  { href: "/looks", label: "Looks" },
  { href: "/quiz", label: "Style quiz" },
  { href: "/profiles", label: "Family" },
  { href: "/stylist", label: "Stylist" },
] as const;

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Props = {
  user: User | null | undefined;
  signOutAction: () => Promise<void>;
};

export function SiteNav({ user, signOutAction }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navClass = (href: string) =>
    pathname === href ? "nav-link nav-link-active" : "nav-link";

  const links = user
    ? NAV_LINKS
    : NAV_LINKS.filter((l) => l.href !== "/dashboard");

  return (
    <div className="site-nav">
      <nav className="nav nav-desktop nav-main" aria-label="Main">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={navClass(link.href)}>
            {link.label}
          </Link>
        ))}
        <details className="nav-more">
          <summary className="nav-link">More</summary>
          <div className="nav-more-menu">
            {MORE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>
        </details>
      </nav>

      <div className="nav-actions">
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        {user ? (
          <div className="nav-auth nav-auth-desktop">
            <div className="user-chip">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" />
              ) : null}
              <span className="user-chip-name">{user.name ?? user.email}</span>
            </div>
            <form action={signOutAction}>
              <button className="btn btn-secondary btn-sm" type="submit">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link className="btn btn-primary btn-sm nav-auth-desktop" href="/login">
            Sign in
          </Link>
        )}
      </div>

      <nav
        id="site-nav-panel"
        className={`nav-panel ${open ? "nav-panel-open" : ""}`}
        aria-label="Mobile menu"
      >
        <div className="nav-panel-inner">
          <p className="nav-panel-label">Menu</p>
          {[...links, ...MORE_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "nav-active" : undefined}
            >
              {link.label}
            </Link>
          ))}

          <p className="nav-panel-label">Account</p>
          {user ? (
            <>
              <div className="user-chip nav-user">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" />
                ) : null}
                <span>{user.name ?? user.email}</span>
              </div>
              <Link href="/account/delete" className="nav-muted">
                Delete account
              </Link>
              <form action={signOutAction}>
                <button className="btn btn-secondary nav-signout" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link className="btn btn-primary nav-signin" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
