"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PwaRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return;
    void navigator.serviceWorker.register("/sw.js");
  }, [pathname]);

  return null;
}
