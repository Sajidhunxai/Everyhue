"use client";

import { useId } from "react";

type Props = {
  value: string;
  onChange: (hex: string) => void;
  "aria-label"?: string;
};

function toHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

export function ColorField({ value, onChange, "aria-label": ariaLabel }: Props) {
  const id = useId();
  const hex = toHex(value) ?? "#7B9FD4";

  return (
    <div className="color-field">
      <label className="color-field-swatch" htmlFor={id} title={ariaLabel ?? "Pick a color"} style={{ background: hex }}>
        <span className="visually-hidden">{ariaLabel ?? "Pick a color"}</span>
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
      </label>
      <input
        className="color-field-hex"
        value={value.toUpperCase()}
        spellCheck={false}
        aria-label="Hex color"
        onChange={(e) => {
          const next = e.target.value.toUpperCase();
          if (next === "" || next === "#") {
            onChange(next === "" ? "#" : next);
            return;
          }
          const parsed = toHex(next);
          onChange(parsed ?? next);
        }}
        onBlur={() => onChange(hex)}
        maxLength={7}
      />
    </div>
  );
}
