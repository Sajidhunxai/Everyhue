export function startRouteProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("everyhue:progress-start"));
}

export function finishRouteProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("everyhue:progress-finish"));
}
