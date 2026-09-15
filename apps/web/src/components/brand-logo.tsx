import type { CSSProperties } from "react";
import Link from "next/link";

type Variant = "full" | "mark";
type Size = "sm" | "md" | "lg";

type Props = {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
};

const sizes = {
  sm: { mark: 28, text: "1.05rem", gap: "0.45rem" },
  md: { mark: 36, text: "1.35rem", gap: "0.55rem" },
  lg: { mark: 44, text: "1.65rem", gap: "0.65rem" },
} as const;

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="brand-logo-mark"
    >
      <circle cx="24" cy="24" r="22" fill="#1C2028" stroke="rgba(245,243,240,0.08)" strokeWidth="1" />
      <path d="M24 8c-2 8-8 12-8 16s6 8 8 8 8-4 8-8-6-8-8-16z" fill="#7B9FD4" opacity="0.95" />
      <path d="M40 24c-8 2-12 8-16 8s-8-6-8-8 4-8 8-8 8 6 16 8z" fill="#E8A87C" opacity="0.92" />
      <path d="M24 40c2-8 8-12 8-16s-6-8-8-8-8 4-8 8 6 8 8 16z" fill="#9BC4A8" opacity="0.92" />
      <path d="M8 24c8-2 12-8 16-8s8 6 8 8-4 8-8 8-8-6-16-8z" fill="#B8A8C8" opacity="0.9" />
      <path d="M32 12c-4 4-4 10-6 12-2 2-8 2-10 0 2-6 6-10 10-12 4-2 8 0 6 0z" fill="#E07A7A" opacity="0.85" />
      <circle cx="24" cy="24" r="4.5" fill="#F5F3F0" />
      <circle cx="24" cy="24" r="2" fill="#12141A" opacity="0.35" />
    </svg>
  );
}

function LogoWordmark({ fontSize }: { fontSize: string }) {
  return (
    <span className="brand-logo-wordmark" style={{ fontSize }}>
      Every<span className="brand-logo-hue"> Hue</span>
    </span>
  );
}

export function BrandLogo({ variant = "full", size = "md", href = "/", className = "" }: Props) {
  const dim = sizes[size];
  const content = (
    <>
      <LogoMark size={dim.mark} />
      {variant === "full" ? <LogoWordmark fontSize={dim.text} /> : null}
    </>
  );

  const style = {
    gap: dim.gap,
  } as CSSProperties;

  if (href) {
    return (
      <Link className={`brand-logo ${className}`.trim()} href={href} style={style} aria-label="Every Hue home">
        {content}
      </Link>
    );
  }

  return (
    <span className={`brand-logo ${className}`.trim()} style={style} aria-label="Every Hue">
      {content}
    </span>
  );
}
