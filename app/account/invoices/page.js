"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/product-helpers";

const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  void: "bg-gray-100 text-gray-400",
};

export default function InvoicesPage() {
  const { t, locale } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/invoices")
      .then((r) => (r.ok ? r.json() : { invoices: [] }))
      .then((data) => setInvoices(data.invoices || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--color-gray-400)]">
        {t("common.loading") || "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
          {t("invoices.title") || "Invoices"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">
          {t("invoices.subtitle") || "View and pay your invoices"}
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-8 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">
            {t("invoices.empty") || "No invoices yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-gray-900)]">
                    {inv.invoiceNumber}
                  </p>
                  {inv.companyName && (
                    <p className="text-xs text-[var(--color-gray-500)]">
                      {inv.companyName}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}
                >
                  {t(`invoices.status.${inv.status}`) || inv.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--color-gray-500)]">
                <span>
                  {t("invoices.amount") || "Amount"}: <strong className="text-[var(--color-gray-900)]">{formatCad(inv.totalCents)}</strong>
                </span>
                {inv.issuedAt && (
                  <span>
                    {t("invoices.issued") || "Issued"}: {new Date(inv.issuedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}
                  </span>
                )}
                {inv.dueAt && (
                  <span>
                    {t("invoices.due") || "Due"}: {new Date(inv.dueAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}
                  </span>
                )}
                {inv.paidAt && (
                  <span className="text-emerald-600">
                    {t("invoices.paid") || "Paid"}: {new Date(inv.paidAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}
                  </span>
                )}
              </div>

              {/* Payment info for unpaid invoices */}
              {(inv.status === "sent" || inv.status === "overdue") && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                  <p className="font-semibold">{t("invoices.paymentInstructions") || "Payment Instructions"}</p>
                  <p className="mt-1">
                    {t("invoices.payViaEtransfer") || "Send Interac e-Transfer to orders@lunarprint.ca"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-blue-600">
                    {t("invoices.referenceNote") || `Reference: ${inv.invoiceNumber}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
