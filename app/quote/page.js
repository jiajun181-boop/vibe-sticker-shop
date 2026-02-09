export const dynamic = "force-dynamic";

export default function QuotePage({ searchParams }) {
  const sku = searchParams?.sku || "";
  return (
    <div className="min-h-screen bg-[#fafafa] px-6 pt-24 pb-20">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Request a Quote</h1>
        <p className="text-sm text-gray-500">
          This product is currently in setup. Send specs + artwork and we’ll quote fast.
        </p>

        <div className="text-xs font-mono bg-gray-50 rounded-2xl p-4 border">
          SKU: {sku}
        </div>

        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>Size (W × H)</li>
          <li>Quantity</li>
          <li>Material / Finish</li>
          <li>Upload file (or email it)</li>
          <li>Needed-by date (rush?)</li>
        </ul>

        <div className="pt-4">
          <a
            className="inline-flex items-center justify-center w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform"
            href={`mailto:orders@lunarprint.ca?subject=Quote%20Request&body=SKU:%20${encodeURIComponent(
              sku
            )}%0A%0ASize:%0AQuantity:%0AMaterial/Finish:%0ARush:%0ANotes:`}
          >
            Email to Quote
          </a>
        </div>
      </div>
    </div>
  );
}