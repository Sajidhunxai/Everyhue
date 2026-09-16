"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [on, setOn] = useState(false);
  const [wide, setWide] = useState(0);
  const tick = useRef<number | null>(null);

  function start() {
    setOn(true);
    setWide(12);
    if (tick.current) window.clearInterval(tick.current);
    tick.current = window.setInterval(() => {
      setWide((w) => (w >= 88 ? w : w + Math.max(1, (90 - w) * 0.08)));
    }, 180);
  }

  function finish() {
    if (tick.current) {
      window.clearInterval(tick.current);
      tick.current = null;
    }
    setWide(100);
    window.setTimeout(() => {
      setOn(false);
      setWide(0);
    }, 280);
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    function onStart() {
      start();
    }
    function onFinish() {
      finish();
    }
    window.addEventListener("everyhue:progress-start", onStart);
    window.addEventListener("everyhue:progress-finish", onFinish);
    return () => {
      window.removeEventListener("everyhue:progress-start", onStart);
      window.removeEventListener("everyhue:progress-finish", onFinish);
    };
  }, []);

  useEffect(() => {
    finish();
  }, [pathname, search]);

  useEffect(() => {
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, []);

  if (!on && wide === 0) return null;

  return (
    <div className={`nav-progress ${on ? "nav-progress-on" : ""}`} role="progressbar" aria-hidden={!on} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(wide)}>
      <span style={{ width: `${wide}%` }} />
    </div>
  );
}
