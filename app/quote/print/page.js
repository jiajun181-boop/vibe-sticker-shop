import QuotePrintClient from "./QuotePrintClient";

export const metadata = {
  title: "Quote Document | La Lunar Printing Inc.",
  robots: { index: false, follow: false },
};

function formatCad(cents) {
  const numeric = Number(cents || 0);
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(numeric / 100);
}

function parsePayload(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export default async function QuotePrintPage({ searchParams }) {
  const params = await searchParams;
  const data = parsePayload(params?.data || "");

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <h1 className="text-2xl font-semibold text-[var(--color-gray-900)]">Quote data missing</h1>
        <p className="mt-2 text-sm text-[var(--color-gray-500)]">Please generate the quote from a product page.</p>
      </main>
    );
  }

  const selections = Array.isArray(data.selections) ? data.selections : [];

  return (
    <main className="mx-auto max-w-4xl bg-white p-8 text-[var(--color-gray-900)]">
      <QuotePrintClient />

      <header className="border-b border-[var(--color-gray-200)] pb-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-gray-500)]">La Lunar Printing Inc.</p>
            <h1 className="mt-2 text-3xl font-bold">Quote</h1>
            <p className="mt-1 text-sm text-[var(--color-gray-500)]">Generated {new Date(data.generatedAt || Date.now()).toLocaleString("en-CA")}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-gray-500)]">Reference</p>
            <p className="font-mono text-xs">{data.productSlug || "-"}</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-gray-200)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">Product</p>
          <p className="mt-2 text-lg font-semibold">{data.productName || "-"}</p>
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">Category: {data.category || "-"}</p>
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">Qty: {data.quantity || "-"}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-gray-200)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">SLA Window</p>
          <p className="mt-2 text-sm">Ship by: <span className="font-semibold">{data.shipByLabel || "-"}</span></p>
          <p className="mt-1 text-sm">Delivery estimate: <span className="font-semibold">{data.deliveryLabel || "-"}</span></p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--color-gray-200)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">Configuration</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {selections.map((row, idx) => (
            <div key={`${row.label || "row"}-${idx}`} className="flex items-center justify-between rounded-lg border border-[var(--color-gray-100)] px-3 py-2 text-sm">
              <span className="text-[var(--color-gray-500)]">{row.label || "-"}</span>
              <span className="font-medium text-[var(--color-gray-900)]">{row.value || "-"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[var(--color-gray-200)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)]">Pricing (CAD)</p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-gray-500)]">Unit</span>
            <span className="font-semibold">{formatCad(data.unitAmount || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-gray-500)]">Subtotal</span>
            <span className="font-semibold">{formatCad(data.subtotal || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-gray-500)]">Tax (HST)</span>
            <span className="font-semibold">{formatCad(data.tax || 0)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-gray-200)] pt-2 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{formatCad(data.total || 0)}</span>
          </div>
        </div>
      </section>

      <footer className="mt-8 border-t border-[var(--color-gray-200)] pt-4 text-xs text-[var(--color-gray-500)]">
        This quote is valid for 7 days and subject to artwork/preflight review.
      </footer>
    </main>
  );
}

