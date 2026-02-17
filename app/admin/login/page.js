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
        // Default to email login for existing admin accounts.
        setMode(data.needsSetup ? "setup" : "email");
      })
      .catch(() => {
        setMode("email");
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
        ? { email: (email || "").trim().toLowerCase(), password: password || "" }
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-sm text-[#999]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
      <div className="w-full max-w-sm">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8">
          <div className="mb-6 text-center">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-black">
              {mode === "setup" ? "ADMIN SETUP" : "ADMIN"}
            </h1>
            <p className="mt-1 text-xs text-[#999]">
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
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-black placeholder-[#999] outline-none transition-colors focus:border-black"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail((e.target.value || "").toLowerCase())}
                  placeholder="Email"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="email"
                  spellCheck={false}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-black placeholder-[#999] outline-none transition-colors focus:border-black"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  required
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-black placeholder-[#999] outline-none transition-colors focus:border-black"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[3px] bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:bg-[#999]"
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
                      onChange={(e) => setEmail((e.target.value || "").toLowerCase())}
                      placeholder="Email"
                      required
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="email"
                      spellCheck={false}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-black placeholder-[#999] outline-none transition-colors focus:border-black"
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-3 text-sm text-black placeholder-[#999] outline-none transition-colors focus:border-black"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[3px] bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:bg-[#999]"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode(mode === "email" ? "legacy" : "email"); setError(""); }}
                  className="text-xs text-[#999] transition-colors hover:text-black"
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
