"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "vibe_exit_popup_shown";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const dismiss = useCallback(() => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    let triggered = false;
    const onMouseLeave = (e) => {
      if (triggered) return;
      if (e.clientY <= 0) {
        triggered = true;
        setShow(true);
      }
    };

    // Desktop: mouse leaves viewport top
    document.addEventListener("mouseleave", onMouseLeave);

    // Mobile: show after 45s of browsing (scroll-based fallback)
    const timer = setTimeout(() => {
      if (!triggered) {
        triggered = true;
        setShow(true);
      }
    }, 45000);

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Exit Popup Subscriber",
          email: email.trim(),
          message: "Newsletter signup via exit-intent popup — send FIRST10 code",
        }),
      });
    } catch {}

    setSubmitted(true);
    setTimeout(dismiss, 3000);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={dismiss}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close popup"
      />

      <div className="relative w-full max-w-md animate-[slideUp_0.3s_ease-out] rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-gray-900"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">{t("exit.success")}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
                <span className="text-2xl font-black text-white">10%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{t("exit.headline")}</h3>
              <p className="mt-2 text-sm text-gray-600">{t("exit.subtext")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("exit.placeholder")}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-gray-900 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-black"
              >
                {t("exit.cta")}
              </button>
            </form>

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              {t("exit.dismiss")}
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
