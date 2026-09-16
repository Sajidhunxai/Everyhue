"use client";

import { useMemo, useState } from "react";
import type { TryOnCatalog, TryOnFeature, TryOnLook } from "@photomatcher/types";
import { useToast } from "@/components/toast";

const FEATURES: { id: TryOnFeature; label: string }[] = [
  { id: "hair", label: "Hair" },
  { id: "eyes", label: "Eyes" },
  { id: "lips", label: "Lips" },
  { id: "cheeks", label: "Cheeks" },
  { id: "jewelry", label: "Jewelry" },
];

type Props = {
  catalog: TryOnCatalog;
  seasonLabel: string;
};

function shade(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  const n = parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function Portrait({ look, shirt }: { look: TryOnLook; shirt: string }) {
  const hairDark = shade(look.hair, -28);
  const lipDark = shade(look.lips, -24);
  return (
    <svg className="tryon-svg" viewBox="0 0 280 360" role="img" aria-label="Look preview">
      <rect width="280" height="360" rx="24" fill="#161920" />
      <ellipse cx="140" cy="330" rx="88" ry="42" fill={shirt} />
      <path d="M70 168 C62 90 92 42 140 38 C188 42 218 90 210 168 C200 118 168 78 140 76 C112 78 80 118 70 168Z" fill={hairDark} />
      <path d="M92 292 C100 318 180 318 188 292 L176 248 C168 268 112 268 104 248Z" fill={look.skin} />
      <ellipse cx="140" cy="188" rx="58" ry="72" fill={look.skin} />
      <ellipse cx="118" cy="198" rx="16" ry="10" fill={look.cheeks} opacity="0.45" />
      <ellipse cx="162" cy="198" rx="16" ry="10" fill={look.cheeks} opacity="0.45" />
      <path d="M88 150 C96 92 120 68 140 66 C160 68 184 92 192 150 C186 108 166 88 140 86 C114 88 94 108 88 150Z" fill={look.hair} />
      <path d="M108 128 C118 118 128 116 136 122" stroke={hairDark} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M144 122 C152 116 162 118 172 128" stroke={hairDark} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="118" cy="176" rx="14" ry="9" fill="#F5F3F0" />
      <ellipse cx="162" cy="176" rx="14" ry="9" fill="#F5F3F0" />
      <ellipse cx="118" cy="176" rx="7" ry="7" fill={look.eyes} />
      <ellipse cx="162" cy="176" rx="7" ry="7" fill={look.eyes} />
      <circle cx="118" cy="176" r="3.2" fill="#12141A" />
      <circle cx="162" cy="176" r="3.2" fill="#12141A" />
      <circle cx="115.5" cy="174" r="1.4" fill="#fff" />
      <circle cx="159.5" cy="174" r="1.4" fill="#fff" />
      <path d="M140 184 L134 204 L146 204 Z" fill={shade(look.skin, -18)} opacity="0.5" />
      <path d="M126 222 C136 230 144 230 154 222" fill={look.lips} />
      <path d="M128 222 C136 218 144 218 152 222 C144 228 136 228 128 222Z" fill={lipDark} />
      <circle cx="84" cy="208" r="7" fill={look.jewelry} />
      <circle cx="196" cy="208" r="7" fill={look.jewelry} />
      <circle cx="84" cy="208" r="3" fill={shade(look.jewelry, 40)} />
      <circle cx="196" cy="208" r="3" fill={shade(look.jewelry, 40)} />
    </svg>
  );
}

export function TryOnStudio({ catalog, seasonLabel }: Props) {
  const { toast } = useToast();
  const [look, setLook] = useState<TryOnLook>(catalog.look);
  const [feature, setFeature] = useState<TryOnFeature>("hair");
  const [photo, setPhoto] = useState<string | null>(null);
  const shirt = catalog.options.hair[0]?.hex ?? "#1C2A4A";

  const activeOptions = catalog.options[feature];

  const summary = useMemo(() => {
    const nameOf = (id: TryOnFeature, hex: string) =>
      catalog.options[id].find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
    return {
      hair: nameOf("hair", look.hair),
      eyes: nameOf("eyes", look.eyes),
      lips: nameOf("lips", look.lips),
    };
  }, [catalog, look]);

  function apply(hex: string, name: string) {
    setLook((current) => ({ ...current, [feature]: hex }));
    toast(`${FEATURES.find((f) => f.id === feature)?.label} → ${name}`);
  }

  async function onPhoto(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    toast("Photo added for overlay preview");
  }

  async function saveHair() {
    const name = summary.hair;
    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hex: look.hair, name, category: "Makeup" }),
    });
    if (!res.ok) {
      toast(res.status === 401 ? "Sign in to save colors." : "Could not save.", "error");
      return;
    }
    toast(`Saved ${name} to wardrobe`);
  }

  return (
    <div className="tryon-layout">
      <div className="tryon-stage">
        {photo ? (
          <div className="tryon-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Your photo" />
            <div className="tryon-photo-hair" style={{ background: look.hair }} />
            <div className="tryon-photo-eye tryon-photo-eye-l" style={{ background: look.eyes }} />
            <div className="tryon-photo-eye tryon-photo-eye-r" style={{ background: look.eyes }} />
            <div className="tryon-photo-cheek tryon-photo-cheek-l" style={{ background: look.cheeks }} />
            <div className="tryon-photo-cheek tryon-photo-cheek-r" style={{ background: look.cheeks }} />
            <div className="tryon-photo-lips" style={{ background: look.lips }} />
          </div>
        ) : (
          <Portrait look={look} shirt={shirt} />
        )}
        <p className="muted tryon-caption">
          {seasonLabel} look · {summary.hair} hair · {summary.eyes} eyes · {summary.lips} lips
        </p>
      </div>

      <div className="tryon-controls">
        <div className="chip-select">
          {FEATURES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip-toggle ${feature === item.id ? "chip-toggle-on" : ""}`}
              onClick={() => setFeature(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="tryon-swatches">
          {activeOptions.map((option) => (
            <button
              key={`${feature}-${option.hex}-${option.name}`}
              type="button"
              className={`tryon-swatch ${look[feature].toLowerCase() === option.hex.toLowerCase() ? "tryon-swatch-on" : ""}`}
              onClick={() => apply(option.hex, option.name)}
            >
              <span className="color-dot large" style={{ background: option.hex }} />
              <strong>{option.name}</strong>
              {option.recommended ? <span className="muted">Suggested</span> : <span className="muted">Palette</span>}
            </button>
          ))}
        </div>

        <label>
          Custom {feature} color
          <input
            type="color"
            value={look[feature]}
            onChange={(e) => apply(e.target.value.toUpperCase(), e.target.value.toUpperCase())}
          />
        </label>

        <div className="actions" style={{ marginTop: "1rem" }}>
          <label className="btn btn-primary">
            Use my photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          {photo ? (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                if (photo) URL.revokeObjectURL(photo);
                setPhoto(null);
              }}
            >
              Studio portrait
            </button>
          ) : null}
          <button className="btn btn-secondary" type="button" onClick={() => setLook(catalog.look)}>
            Reset look
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => void saveHair()}>
            Save hair color
          </button>
        </div>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          Photo overlays are a quick preview, not a salon simulation. Face the camera in daylight for a clearer match.
        </p>
      </div>
    </div>
  );
}
