"use client";

import type { AnalyzeResult } from "@photomatcher/types";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="guide-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TagRow({ items }: { items: string[] }) {
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

export function ResultsDisplay({ result }: { result: AnalyzeResult }) {
  const guide = result.styleGuide;
  if (!guide) return <p className="lead">Style guide unavailable — run a new analysis.</p>;

  return (
    <>
      <p className="lead">
        Undertone: {result.undertone} · Confidence {Math.round(result.confidence * 100)}%
        · Contrast: {guide.contrastLevel} · Depth: {guide.valueDepth}
      </p>

      <h2>Your palette</h2>
      <div className="swatch-row">
        {result.palette.map((s) => (
          <div className="swatch" key={s.hex + s.name}>
            <span style={{ background: s.hex }} />
            {s.name}
          </div>
        ))}
      </div>

      {result.faceBodyTips ? (
        <>
          <h2>Face &amp; body styling</h2>
          <p className="muted">
            Face: {result.faceBodyTips.faceShape} · Body: {result.faceBodyTips.bodyType}
          </p>
          <h3>Necklines</h3>
          <BulletList items={result.faceBodyTips.neckline} />
          <h3>Silhouettes</h3>
          <BulletList items={result.faceBodyTips.silhouettes} />
          <h3>Eyewear</h3>
          <BulletList items={result.faceBodyTips.eyewear} />
        </>
      ) : null}

      <h2>Suits &amp; formal wear</h2>
      <BulletList items={guide.suits} />
      <h2>Casual &amp; everyday</h2>
      <BulletList items={guide.casualWear} />
      <h2>Makeup</h2>
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
      <h2>Occasion outfits</h2>
      <div className="occasion-list">
        {guide.occasions.map((o) => (
          <div className="occasion-card" key={o.label}>
            <strong>{o.label}</strong>
            <p>{o.suggestion}</p>
          </div>
        ))}
      </div>
      <h2>Usually avoid</h2>
      <div className="swatch-row">
        {result.avoid.map((s) => (
          <div className="swatch" key={s.hex + s.name}>
            <span style={{ background: s.hex }} />
            {s.name}
          </div>
        ))}
      </div>
    </>
  );
}
