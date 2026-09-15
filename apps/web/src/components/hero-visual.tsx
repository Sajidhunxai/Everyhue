"use client";

import Image from "next/image";

export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual-glow" />
      <div className="hero-visual-frame">
        <Image
          src="/images/hero-every-hue.png"
          alt=""
          fill
          priority
          sizes="(max-width: 860px) 100vw, 480px"
          className="hero-visual-img hero-visual-a"
        />
        <Image
          src="/images/hero-colors-flow.png"
          alt=""
          fill
          sizes="(max-width: 860px) 100vw, 480px"
          className="hero-visual-img hero-visual-b"
        />
        <div className="hero-visual-shimmer" />
      </div>
      <p className="hero-visual-caption">Personal color · Inclusive beauty</p>
    </div>
  );
}

export function ShowcaseVisual() {
  return (
    <div className="showcase-visual">
      <div className="showcase-visual-inner">
        <Image
          src="/images/hero-colors-flow.png"
          alt="Flowing seasonal color palette visualization"
          fill
          sizes="(max-width: 960px) 100vw, 960px"
          className="showcase-visual-img"
        />
        <div className="showcase-visual-overlay" />
      </div>
    </div>
  );
}
