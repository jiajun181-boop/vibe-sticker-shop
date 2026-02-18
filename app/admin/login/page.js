"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

/* ── Keyframe animations (injected once via <style>) ── */
const ANIM_STYLES = `
@keyframes adminGridScroll {
  0% { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
}
@keyframes adminCardIn {
  0% { opacity: 0; transform: translateY(24px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes adminLockBounce {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
  50% { transform: translateY(0); }
  70% { transform: translateY(-3px); }
}
@keyframes adminLockUnlock {
  0% { transform: translateY(0) rotate(0deg); }
  40% { transform: translateY(-2px) rotate(-8deg); }
  60% { transform: translateY(-2px) rotate(8deg); }
  100% { transform: translateY(0) rotate(0deg); }
}
@keyframes adminShake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-6px); }
  30%, 70% { transform: translateX(6px); }
}
@keyframes adminPulseRing {
  0% { transform: scale(0.8); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 0; }
  100% { transform: scale(0.8); opacity: 0; }
}
@keyframes adminFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes adminDot {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
`;

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-white/40"
                style={{ animation: `adminDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
              />
            ))}
          </div>
        </div>
      }
    >
      <style dangerouslySetInnerHTML={{ __html: ANIM_STYLES }} />
      <LoginContent />
    </Suspense>
  );
}

/* ── Animated lock icon ── */
function LockIcon({ unlocking }) {
  return (
    <div className="relative" style={{ animation: unlocking ? "adminLockUnlock 0.5s ease" : "adminLockBounce 2s ease-in-out" }}>
      {/* Pulse ring behind the lock */}
      <div
        className="absolute inset-[-8px] rounded-full border-2 border-white/10"
        style={{ animation: "adminPulseRing 3s ease-in-out infinite" }}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/10">
        <svg
          className="h-6 w-6 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          {unlocking ? (
            /* Unlocked icon */
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          ) : (
            /* Locked icon */
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("from") || "/admin";
  // Prevent open redirect: only allow relative paths starting with /admin
  const redirectTo = rawRedirect.startsWith("/admin") && !rawRedirect.startsWith("//") ? rawRedirect : "/admin";

  const [mode, setMode] = useState("loading"); // "loading" | "setup" | "email"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((data) => {
        setMode(data.needsSetup ? "setup" : "email");
      })
      .catch(() => {
        setMode("email");
      });
  }, []);

  function triggerShake() {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }

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
        setUnlocking(true);
        setTimeout(() => { window.location.href = redirectTo; }, 600);
        return;
      }
      setError(data.error || "Setup failed");
      triggerShake();
    } catch {
      setError("Network error");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: (email || "").trim().toLowerCase(),
          password: password || "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUnlocking(true);
        setTimeout(() => { window.location.href = redirectTo; }, 600);
        return;
      }
      setError(data.error || "Login failed");
      triggerShake();
    } catch {
      setError("Network error");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  /* ── Loading state ── */
  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-white/40"
              style={{ animation: `adminDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const EyeToggle = () => (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {showPassword ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </>
        )}
      </svg>
    </button>
  );

  const inputClass =
    "w-full rounded-[3px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-white/30 focus:bg-white/[0.08] backdrop-blur-sm";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* ── Animated grid background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.035]">
        <div
          className="absolute inset-[-40px]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            animation: "adminGridScroll 8s linear infinite",
          }}
        />
      </div>

      {/* ── Radial glow ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* ── Main card ── */}
      <div
        ref={formRef}
        className="relative z-10 w-full max-w-sm px-4"
        style={{
          animation: shaking
            ? "adminShake 0.5s ease"
            : "adminCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo + heading + lock */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <LockIcon unlocking={unlocking} />
            <div className="text-center">
              <h1 className="text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                {mode === "setup" ? "ADMIN SETUP" : "ADMIN"}
              </h1>
              <p className="mt-1.5 text-[11px] text-white/30">
                {mode === "setup"
                  ? "Create your first admin account"
                  : "Sign in to continue"}
              </p>
            </div>
          </div>

          {/* ── Setup form (first-time) ── */}
          {mode === "setup" && (
            <form onSubmit={handleSetup} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                className={inputClass}
              />
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
                className={inputClass}
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  required
                  className={`${inputClass} pr-10`}
                />
                <EyeToggle />
              </div>

              {error && (
                <p
                  className="text-sm text-red-400"
                  style={{ animation: "adminFadeIn 0.3s ease" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[3px] bg-white py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>
          )}

          {/* ── Login form ── */}
          {mode === "email" && (
            <form onSubmit={handleLogin} className="space-y-3">
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
                className={inputClass}
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={`${inputClass} pr-10`}
                />
                <EyeToggle />
              </div>

              {error && (
                <p
                  className="text-sm text-red-400"
                  style={{ animation: "adminFadeIn 0.3s ease" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[3px] bg-white py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-white/20">
          Protected area &middot; Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
