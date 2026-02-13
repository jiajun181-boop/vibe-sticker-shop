"use client";

import { useEffect, useState } from "react";

export default function AdminLoginPage() {
  const [mode, setMode] = useState("loading"); // "loading" | "setup" | "legacy" | "email"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if setup is needed (no admin users yet)
  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((data) => {
        setMode(data.needsSetup ? "setup" : "legacy");
      })
      .catch(() => {
        setMode("legacy");
      });
  }, []);

  async function handleSetup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Admin", email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        window.location.href = "/admin";
        return;
      } else {
        setError(data.error || "Setup failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = mode === "email"
        ? { email, password }
        : { password };

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/admin";
        return;
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold tracking-wide text-gray-900">
              {mode === "setup" ? "ADMIN SETUP" : "ADMIN"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "setup" && "Create your first admin account"}
              {mode === "email" && "Sign in with your admin account"}
              {mode === "legacy" && "Enter master password"}
            </p>
          </div>

          {/* ── Setup form (first-time) ── */}
          {mode === "setup" && (
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-900"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-900"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-900"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create Admin Account"}
              </button>
            </form>
          )}

          {/* ── Login form ── */}
          {(mode === "legacy" || mode === "email") && (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                {mode === "email" && (
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      autoFocus
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-900"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoFocus={mode === "legacy"}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-900"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:bg-gray-400"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode(mode === "email" ? "legacy" : "email"); setError(""); }}
                  className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                  {mode === "email" ? "Use master password" : "Sign in with email"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
