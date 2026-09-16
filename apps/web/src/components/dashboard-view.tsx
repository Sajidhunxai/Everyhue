"use client";

import Link from "next/link";

export type DashboardLink = {
  href: string;
  title: string;
  desc: string;
  icon: DashboardIconName;
};

export type DashboardIconName =
  | "analyze"
  | "compare"
  | "match"
  | "beauty"
  | "tryon"
  | "looks"
  | "shop"
  | "wardrobe"
  | "family"
  | "stylist"
  | "quiz"
  | "results"
  | "history";

type Props = {
  firstName: string | null;
  image: string | null;
  stats: {
    analysisCount: number;
    wardrobeCount: number;
    profileCount: number;
    latestSeason: string | null;
    undertone: string | null;
    palette: { hex: string; name: string }[];
  };
  links: DashboardLink[];
};

function Icon({ name }: { name: DashboardIconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "analyze":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="7.5" height="14" rx="1.5" />
          <rect x="13.5" y="5" width="7.5" height="14" rx="1.5" />
        </svg>
      );
    case "match":
      return (
        <svg {...common}>
          <path d="M4 7h6v10H4zM14 7h6v10h-6z" />
          <path d="M10 12h4" />
        </svg>
      );
    case "beauty":
      return (
        <svg {...common}>
          <path d="M8 20c2-6 3-10 4-16 1 6 2 10 4 16" />
          <path d="M7 14h10" />
        </svg>
      );
    case "tryon":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M6 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" />
        </svg>
      );
    case "looks":
      return (
        <svg {...common}>
          <path d="M12 3l2.2 6.4H21l-5.4 3.9 2.1 6.4L12 16.6 6.3 19.7l2.1-6.4L3 9.4h6.8z" />
        </svg>
      );
    case "shop":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 11H7L6 8z" />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" />
        </svg>
      );
    case "wardrobe":
      return (
        <svg {...common}>
          <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
          <path d="M12 4v16M8.5 12h.1M15.5 12h.1" />
        </svg>
      );
    case "family":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="2.4" />
          <circle cx="16" cy="9.2" r="2" />
          <path d="M4.5 19c.6-3 2.6-4.6 4.5-4.6S13 16 13.6 19" />
          <path d="M13.2 19c.3-2.2 1.7-3.4 3-3.4s2.6 1.1 3.1 3.4" />
        </svg>
      );
    case "stylist":
      return (
        <svg {...common}>
          <path d="M8 11h8M8 15h5" />
          <path d="M5 6h14v12H9l-4 3V6z" />
        </svg>
      );
    case "quiz":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M9.4 9.4a2.6 2.6 0 1 1 3.8 2.3c-.8.5-1.2 1-1.2 2" />
          <path d="M12 16.6h.1" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      );
  }
}

const GROUPS: { id: string; label: string; hrefs: string[] }[] = [
  {
    id: "studio",
    label: "Color studio",
    hrefs: ["/analyze", "/compare", "/match", "/beauty", "/try-on"],
  },
  {
    id: "closet",
    label: "Wardrobe",
    hrefs: ["/wardrobe", "/looks", "/shop"],
  },
  {
    id: "style",
    label: "Style & family",
    hrefs: ["/stylist", "/quiz", "/profiles", "/history", "/results"],
  },
];

export function DashboardView({ firstName, image, stats, links }: Props) {
  const byHref = new Map(links.map((l) => [l.href, l]));
  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";

  return (
    <div className="dashboard-page">
      <section className="dash-hero-card anim-fade-up">
        <div className="dash-hero-copy">
          <p className="dash-kicker">Your color home</p>
          <h1>{greeting}</h1>
          <p className="dash-lead">
            {stats.latestSeason
              ? `Continue as ${stats.latestSeason}${stats.undertone ? ` · ${stats.undertone} undertone` : ""}.`
              : "Start with a daylight portrait to unlock your seasonal palette."}
          </p>
          <div className="dash-hero-actions">
            <Link href="/analyze" className="btn btn-primary">
              {stats.analysisCount > 0 ? "New analysis" : "Start analysis"}
            </Link>
            {stats.latestSeason ? (
              <Link href="/results" className="btn btn-secondary">
                View results
              </Link>
            ) : (
              <Link href="/compare" className="btn btn-secondary">
                Compare lighting
              </Link>
            )}
            {stats.analysisCount > 0 ? (
              <Link href="/history" className="btn btn-secondary">
                History
              </Link>
            ) : null}
          </div>
        </div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="dash-avatar" src={image} alt="" />
        ) : (
          <div className="dash-avatar dash-avatar-fallback">{(firstName ?? "?")[0]?.toUpperCase()}</div>
        )}
      </section>

      <section className="dash-metrics anim-fade-up anim-delay-1">
        <Link href="/history" className="dash-metric">
          <span className="dash-metric-value">{stats.analysisCount}</span>
          <span className="dash-metric-label">Analyses</span>
        </Link>
        <div className="dash-metric">
          <span className="dash-metric-value">{stats.wardrobeCount}</span>
          <span className="dash-metric-label">Wardrobe</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-value">{stats.profileCount}</span>
          <span className="dash-metric-label">Profiles</span>
        </div>
        <div className="dash-metric dash-metric-season">
          <span className="dash-metric-value dash-metric-season-name">
            {stats.latestSeason ?? "—"}
          </span>
          <span className="dash-metric-label">Season</span>
        </div>
      </section>

      {stats.latestSeason ? (
        <Link href="/results" className="dash-season anim-fade-up anim-delay-2">
          <div className="dash-season-copy">
            <p className="dash-kicker">Latest palette</p>
            <h2>{stats.latestSeason}</h2>
            <p>Open your style card, shop the palette, or try hair and makeup colors.</p>
          </div>
          <div className="dash-season-swatches" aria-hidden="true">
            {(stats.palette.length ? stats.palette : [{ hex: "#7B9FD4", name: "Accent" }]).slice(0, 6).map((s) => (
              <span key={s.hex + s.name} style={{ background: s.hex }} title={s.name} />
            ))}
          </div>
        </Link>
      ) : null}

      {GROUPS.map((group) => {
        const items = group.hrefs.map((href) => byHref.get(href)).filter(Boolean) as DashboardLink[];
        return (
          <section key={group.id} className="dash-group">
            <h2 className="dash-group-title">{group.label}</h2>
            <div className={`dash-bento dash-bento-${group.id}`}>
              {items.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-tile${i === 0 && group.id === "studio" ? " dash-tile-feature" : ""}`}
                >
                  <span className="dash-tile-icon">
                    <Icon name={item.icon} />
                  </span>
                  <span className="dash-tile-body">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <p className="dash-foot">
        <Link href="/account/delete">Delete account</Link>
      </p>
    </div>
  );
}
