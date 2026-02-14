"use client";

import { useEffect, useState } from "react";

const DEFAULTS = {
  "store.name": "Vibe Sticker Shop",
  "store.email": "",
  "store.phone": "",
  "store.address": "",
  "shipping.freeThreshold": 15000,
  "shipping.localRate": 1500,
  "shipping.nationwideRate": 2000,
  "tax.hstRate": 13,
  "tax.enabled": true,
  "order.autoConfirmEmail": true,
};

function centsToDollars(cents) {
  return (Number(cents) / 100).toFixed(2);
}

function dollarsToCents(dollars) {
  return Math.round(Number(dollars) * 100);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [openSections, setOpenSections] = useState({
    store: true,
    shipping: true,
    tax: true,
    order: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings({ ...DEFAULTS, ...data });
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(section) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        "store.name": settings["store.name"],
        "store.email": settings["store.email"],
        "store.phone": settings["store.phone"],
        "store.address": settings["store.address"],
        "shipping.freeThreshold": dollarsToCents(
          settings["shipping.freeThreshold"] >= 100
            ? centsToDollars(settings["shipping.freeThreshold"])
            : settings["shipping.freeThreshold"]
        ),
        "shipping.localRate": dollarsToCents(
          settings["shipping.localRate"] >= 100
            ? centsToDollars(settings["shipping.localRate"])
            : settings["shipping.localRate"]
        ),
        "shipping.nationwideRate": dollarsToCents(
          settings["shipping.nationwideRate"] >= 100
            ? centsToDollars(settings["shipping.nationwideRate"])
            : settings["shipping.nationwideRate"]
        ),
        "tax.hstRate": Number(settings["tax.hstRate"]),
        "tax.enabled": Boolean(settings["tax.enabled"]),
        "order.autoConfirmEmail": Boolean(settings["order.autoConfirmEmail"]),
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setMessage({ type: "success", text: "Settings saved successfully." });
      // Re-fetch to get canonical values from server
      await fetchSettings();
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  // For display, convert cents stored values to dollars
  function displayDollars(key) {
    const val = settings[key];
    if (typeof val === "number" && val >= 100) {
      return centsToDollars(val);
    }
    return val;
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Store Information */}
        <Section
          title="Store Information"
          isOpen={openSections.store}
          onToggle={() => toggleSection("store")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Store Name"
              type="text"
              value={settings["store.name"]}
              onChange={(v) => updateSetting("store.name", v)}
            />
            <Field
              label="Email"
              type="email"
              value={settings["store.email"]}
              onChange={(v) => updateSetting("store.email", v)}
              placeholder="hello@lunarprint.ca"
            />
            <Field
              label="Phone"
              type="tel"
              value={settings["store.phone"]}
              onChange={(v) => updateSetting("store.phone", v)}
              placeholder="+1 (555) 123-4567"
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Address
              </label>
              <textarea
                rows={3}
                value={settings["store.address"]}
                onChange={(e) => updateSetting("store.address", e.target.value)}
                placeholder="123 Main St, Toronto, ON M5V 1A1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>
        </Section>

        {/* Shipping Configuration */}
        <Section
          title="Shipping Configuration"
          isOpen={openSections.shipping}
          onToggle={() => toggleSection("shipping")}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <DollarField
              label="Free Shipping Threshold"
              value={displayDollars("shipping.freeThreshold")}
              onChange={(v) => updateSetting("shipping.freeThreshold", v)}
            />
            <DollarField
              label="Local Shipping Rate"
              value={displayDollars("shipping.localRate")}
              onChange={(v) => updateSetting("shipping.localRate", v)}
            />
            <DollarField
              label="Nationwide Shipping Rate"
              value={displayDollars("shipping.nationwideRate")}
              onChange={(v) => updateSetting("shipping.nationwideRate", v)}
            />
          </div>
        </Section>

        {/* Tax Configuration */}
        <Section
          title="Tax Configuration"
          isOpen={openSections.tax}
          onToggle={() => toggleSection("tax")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                HST Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings["tax.hstRate"]}
                  onChange={(e) => updateSetting("tax.hstRate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm outline-none focus:border-gray-900"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={Boolean(settings["tax.enabled"])}
                  onChange={(e) => updateSetting("tax.enabled", e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-gray-900 peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-gray-700">Tax collection enabled</span>
            </div>
          </div>
        </Section>

        {/* Order Settings */}
        <Section
          title="Order Settings"
          isOpen={openSections.order}
          onToggle={() => toggleSection("order")}
        >
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={Boolean(settings["order.autoConfirmEmail"])}
                onChange={(e) =>
                  updateSetting("order.autoConfirmEmail", e.target.checked)
                }
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-gray-900 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-gray-700">
              Send automatic order confirmation emails
            </span>
          </div>
        </Section>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Collapsible Section ─── */

function Section({ title, isOpen, onToggle, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between"
      >
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ─── Field Components ─── */

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
    </div>
  );
}

function DollarField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          $
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm outline-none focus:border-gray-900"
        />
      </div>
    </div>
  );
}
