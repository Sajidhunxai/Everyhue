export default function Loading() {
  return (
    <section className="panel route-loading" aria-busy="true" aria-live="polite">
      <div className="route-loading-bar" />
      <p className="lead">Loading…</p>
    </section>
  );
}
