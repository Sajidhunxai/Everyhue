"use client";

import { RESULT_IMAGES, seasonStory } from "@photomatcher/color-engine";
import type { AnalyzeResult } from "@photomatcher/types";
import { useState, type ReactNode } from "react";

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="guide-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TagRow({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="tag-row">
      {items.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function StoryCard({
  title,
  image,
  caption,
  children,
}: {
  title: string;
  image: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <article className="story-card">
      <div className="story-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" />
        <span>{caption}</span>
      </div>
      <div className="story-card-body">
        <h3>{title}</h3>
        {children}
      </div>
    </article>
  );
}

type Tab = "overview" | "wardrobe" | "beauty" | "fit";

type Props = {
  result: AnalyzeResult;
  beautyOnly?: boolean;
  actions?: ReactNode;
};

export function ResultsDisplay({ result, beautyOnly = false, actions }: Props) {
  const guide = result.styleGuide;
  const story = seasonStory(result.seasonId, result.seasonLabel);
  const [tab, setTab] = useState<Tab>("overview");

  if (!guide) return <p className="lead">Style guide unavailable — run a new analysis.</p>;

  const beauty = (
    <div className="story-stack">
      <StoryCard title="Makeup" image={RESULT_IMAGES.makeup} caption="Lips, cheeks, eyes">
        <div className="guide-grid">
          <div>
            <h3>Lips</h3>
            <TagRow items={guide.makeup.lips} />
          </div>
          <div>
            <h3>Cheeks</h3>
            <TagRow items={guide.makeup.cheeks} />
          </div>
          <div>
            <h3>Eyes</h3>
            <TagRow items={guide.makeup.eyes} />
          </div>
        </div>
      </StoryCard>
      <StoryCard title="Jewelry & metals" image={RESULT_IMAGES.jewelry} caption="Finish that matches your undertone">
        <TagRow items={guide.jewelry} />
      </StoryCard>
      <StoryCard title="Hair color hints" image={RESULT_IMAGES.hair} caption="Keep the season, change the depth">
        <BulletList items={guide.hairColorHints} />
      </StoryCard>
      <div className="story-card story-card-plain">
        <h3>Patterns &amp; neutrals</h3>
        <TagRow items={[...guide.patterns, ...guide.neutrals]} />
      </div>
    </div>
  );

  if (beautyOnly) {
    return (
      <>
        <header className="results-hero results-hero-compact">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.hero} alt="" />
          <div className="results-hero-copy">
            <p className="kicker">{result.seasonLabel}</p>
            <h2>Makeup &amp; hair</h2>
            <p>
              Beauty notes for a {result.undertone} undertone with {guide.contrastLevel} contrast.
            </p>
          </div>
        </header>
        {beauty}
      </>
    );
  }

  return (
    <>
      <header className="results-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={story.hero} alt="" />
        <div className="results-hero-copy">
          <p className="kicker">{story.mood}</p>
          <h1>{result.seasonLabel}</h1>
          <p>{story.blurb}</p>
          <div className="results-pills">
            <span>{result.undertone} undertone</span>
            <span>{Math.round(result.confidence * 100)}% confidence</span>
            <span>{guide.contrastLevel} contrast</span>
            <span>{guide.valueDepth} depth</span>
          </div>
        </div>
      </header>

      {actions}

      <div className="swatch-row swatch-row-lg" aria-label="Your palette">
        {result.palette.map((s) => (
          <div className="swatch" key={s.hex + s.name}>
            <span style={{ background: s.hex }} />
            {s.name}
          </div>
        ))}
      </div>

      <nav className="results-tabs" aria-label="Result sections">
        {(
          [
            ["overview", "Overview"],
            ["wardrobe", "Wardrobe"],
            ["beauty", "Beauty"],
            ["fit", "Fit"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "results-tab is-on" : "results-tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="story-stack">
          {result.tips?.length ? (
            <div className="story-card story-card-plain">
              <h2>How to wear it</h2>
              <BulletList items={result.tips} />
            </div>
          ) : null}
          <StoryCard title="Occasion outfits" image={RESULT_IMAGES.occasion} caption="Ready-made looks">
            <div className="occasion-list">
              {guide.occasions.map((o) => (
                <div className="occasion-card" key={o.label}>
                  <strong>{o.label}</strong>
                  <p>{o.suggestion}</p>
                </div>
              ))}
            </div>
          </StoryCard>
          <div className="story-card story-card-plain">
            <h2>Usually skip</h2>
            <p className="muted">These sit too far from your season — save them for other people.</p>
            <div className="swatch-row">
              {result.avoid.map((s) => (
                <div className="swatch" key={s.hex + s.name}>
                  <span style={{ background: s.hex }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "wardrobe" ? (
        <div className="story-stack">
          <StoryCard title="Suits &amp; formal wear" image={RESULT_IMAGES.suits} caption="Tailoring in your season">
            <BulletList items={guide.suits} />
          </StoryCard>
          <StoryCard title="Shirts &amp; blouses" image={RESULT_IMAGES.shirts} caption="Closest to the face">
            <BulletList items={guide.shirtsAndBlouses} />
          </StoryCard>
          <StoryCard title="Casual &amp; everyday" image={RESULT_IMAGES.casual} caption="Weekend color">
            <BulletList items={guide.casualWear} />
          </StoryCard>
          <StoryCard title="Dresses &amp; skirts" image={RESULT_IMAGES.dresses} caption="One-piece looks">
            <BulletList items={guide.dressesAndSkirts} />
          </StoryCard>
          <StoryCard title="Ties &amp; scarves" image={RESULT_IMAGES.ties} caption="Small color, big effect">
            <BulletList items={guide.tiesAndScarves} />
          </StoryCard>
          <StoryCard title="Denim" image={RESULT_IMAGES.denim} caption="Wash and finish">
            <BulletList items={guide.denim} />
          </StoryCard>
          <StoryCard title="Outerwear" image={RESULT_IMAGES.outerwear} caption="Coats that frame you">
            <BulletList items={guide.outerwear} />
          </StoryCard>
          <StoryCard title="Shoes &amp; bags" image={RESULT_IMAGES.shoes} caption="Ground the outfit">
            <BulletList items={guide.shoesAndBags} />
          </StoryCard>
        </div>
      ) : null}

      {tab === "beauty" ? beauty : null}

      {tab === "fit" ? (
        <div className="story-stack">
          {result.faceBodyTips ? (
            <StoryCard title="Face &amp; body styling" image={RESULT_IMAGES.fit} caption="Shape, not just color">
              <p className="muted">
                Face: {result.faceBodyTips.faceShape} · Body: {result.faceBodyTips.bodyType}
              </p>
              <h3>Necklines</h3>
              <BulletList items={result.faceBodyTips.neckline} />
              <h3>Silhouettes</h3>
              <BulletList items={result.faceBodyTips.silhouettes} />
            </StoryCard>
          ) : (
            <p className="lead">Add face and body notes on analyze for a custom fit guide.</p>
          )}
          {result.faceBodyTips ? (
            <StoryCard title="Eyewear" image={RESULT_IMAGES.eyewear} caption="Frames near the face">
              <BulletList items={result.faceBodyTips.eyewear} />
            </StoryCard>
          ) : null}
        </div>
      ) : null}

      <p className="muted results-engine">Engine {result.engine_version}</p>
    </>
  );
}
