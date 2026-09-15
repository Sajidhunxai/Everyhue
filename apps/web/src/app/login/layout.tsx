export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-main">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-orb auth-orb-a" />
        <span className="auth-orb auth-orb-b" />
        <span className="auth-orb auth-orb-c" />
        <span className="auth-shimmer" />
      </div>
      <div className="auth-content">{children}</div>
    </div>
  );
}
