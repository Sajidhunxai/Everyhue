"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "admin@everyhue.app";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: ADMIN_EMAIL, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not sign in.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="admin-login panel">
      <p className="section-kicker">Staff only</p>
      <h1>Admin login</h1>
      <p className="lead">The admin account is already set. Enter the password to manage users and quizzes.</p>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="admin-locked-email">
          <span>Email</span>
          <strong>{ADMIN_EMAIL}</strong>
        </div>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Enter admin password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
