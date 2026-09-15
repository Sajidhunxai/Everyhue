"use client";

import Link from "next/link";

export type DashboardLink = {
  href: string;
  title: string;
  desc: string;
  icon: string;
};

type Props = {
  firstName: string | null;
  image: string | null;
  stats: {
    analysisCount: number;
    wardrobeCount: number;
    profileCount: number;
    latestSeason: string | null;
  };
  links: DashboardLink[];
};

export function DashboardView({ firstName, image, stats, links }: Props) {
  const statItems = [
    { label: "Analyses", value: stats.analysisCount },
    { label: "Wardrobe", value: stats.wardrobeCount },
    { label: "Profiles", value: stats.profileCount },
  ];

  return (
    <div className="dashboard-page">
      <header className="dash-hero anim-fade-up">
        <div className="dash-hero-text">
          <p className="section-kicker">Your dashboard</p>
          <h1>Hello{firstName ? `, ${firstName}` : ""}</h1>
          <p className="section-lead">
            {stats.latestSeason
              ? `Your latest season is ${stats.latestSeason}. Pick up where you left off.`
              : "Upload your first photo to discover your seasonal palette."}
          </p>
        </div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="dash-avatar anim-scale-in anim-delay-1" src={image} alt="" />
        ) : (
          <div className="dash-avatar dash-avatar-fallback anim-scale-in anim-delay-1">
            {(firstName ?? "?")[0]?.toUpperCase()}
          </div>
        )}
      </header>

      <div className="dash-stats">
        {statItems.map((s, i) => (
          <div
            key={s.label}
            className={`dash-stat anim-fade-up anim-delay-${i + 1}`}
          >
            <span className="dash-stat-value">{s.value}</span>
            <span className="dash-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <Link href="/analyze" className="btn btn-primary dash-cta anim-fade-up anim-delay-2">
        {stats.analysisCount > 0 ? "New analysis" : "Start your first analysis"}
      </Link>

      <p className="section-kicker dash-section-label anim-fade-up anim-delay-2">
        Quick links
      </p>
      <div className="dashboard-grid">
        {links.map((l, i) => (
          <Link
            className={`dash-card anim-fade-up anim-delay-${Math.min(i + 2, 6)}`}
            href={l.href}
            key={l.href}
          >
            <span className="dash-card-icon" aria-hidden="true">
              {l.icon}
            </span>
            <strong>{l.title}</strong>
            <span>{l.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
