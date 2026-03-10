"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "vibe_guest_email_captured";

export default function GuestEmailCapture() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done

  useEffect(() => {
    // Only show for guests who haven't submitted yet
    const isLoggedIn = document.cookie.includes("session=");
    const alreadyCaptured = localStorage.getItem(STORAGE_KEY);
    if (!isLoggedIn && !alreadyCaptured) {
      setVisible(true);
    }
  }, []);

  if (!visible || status === "done") {
    if (status === "done") {
      return (
        <div className="border-t border-[var(--color-gray-200)] bg-emerald-50 px-5 py-3 text-center text-xs font-medium text-emerald-700">
          {t("cart.emailCapture.thanks")}
        </div>
      );
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setStatus("saving");
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "add-to-cart" }),
      });
      localStorage.setItem(STORAGE_KEY, "1");
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="border-t border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-5 py-4">
      <p className="text-[11px] font-semibold text-[var(--color-gray-700)]">
        {t("cart.emailCapture.title")}
      </p>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("cart.emailCapture.placeholder")}
          className="w-full rounded-sm border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-500)]"
          required
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-sm bg-[var(--color-moon-blue-deep)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fff] hover:bg-[var(--color-ink-black)] disabled:opacity-50"
        >
          {status === "saving" ? "..." : t("cart.emailCapture.cta")}
        </button>
      </form>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-1.5 text-[10px] text-[var(--color-gray-400)] hover:text-[var(--color-gray-600)]"
      >
        {t("cart.emailCapture.dismiss")}
      </button>
    </div>
  );
}
