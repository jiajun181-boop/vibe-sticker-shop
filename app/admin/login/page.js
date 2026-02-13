"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [mode, setMode] = useState("email"); // "email" | "legacy"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
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
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold tracking-wide text-gray-900">
              ADMIN
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "email" ? "Sign in with your admin account" : "Enter master password"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}
