"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const authLoading = useAuthStore((s) => s.loading);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
          setName(data.profile.name || "");
          setPhone(data.profile.phone || "");
          setCompanyName(data.profile.companyName || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      showErrorToast(t("account.profile.validation.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          companyName: companyName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setProfile(data.profile);
      if (user) {
        setUser({ ...user, name: data.profile.name, phone: data.profile.phone, companyName: data.profile.companyName });
      }
      showSuccessToast(t("account.profile.saved"));
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">{t("account.profile.loadError")}</p>
      </div>
    );
  }

  const hasChanges =
    name.trim() !== (profile.name || "") ||
    (phone.trim() || "") !== (profile.phone || "") ||
    (companyName.trim() || "") !== (profile.companyName || "");

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-[0.15em] text-gray-900">
        {t("account.profile.title")}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
            profile.accountType === "B2B"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {profile.accountType}
        </span>
        <span className="text-xs text-gray-400">
          {t("account.profile.memberSince")}{" "}
          {new Date(profile.createdAt).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1.5">
            {t("account.profile.name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 focus:ring-0"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1.5">
            {t("account.profile.email")}
          </label>
          <input
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-400">{t("account.profile.emailReadonly")}</p>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1.5">
            {t("account.profile.phone")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 focus:ring-0"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1.5">
            {t("account.profile.company")}
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={200}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 focus:ring-0"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="rounded-full border border-gray-900 bg-gray-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("account.profile.saving") : t("account.profile.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
