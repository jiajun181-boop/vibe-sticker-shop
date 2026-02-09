import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_TAGS, INDUSTRY_LABELS } from "@/lib/industryTags";

export const dynamic = "force-dynamic";

const CATEGORY_META = {
  // Existing 5 categories
  "fleet-compliance-id": { title: "Fleet Compliance & ID", icon: "🚛" },
  "vehicle-branding-advertising": { title: "Vehicle Branding & Advertising", icon: "🚐" },
  "safety-warning-decals": { title: "Safety & Warning Decals", icon: "⚠️" },
  "facility-asset-labels": { title: "Facility & Asset Labels", icon: "🏭" },
  "display-stands": { title: "Display Stands", icon: "🖼️" },
  // New 14 categories
  stickers: { title: "Stickers & Labels", icon: "✨" },
  signs: { title: "Rigid Signs & Boards", icon: "🪧" },
  banners: { title: "Banners & Flags", icon: "🏳️" },
  marketing: { title: "Marketing Prints", icon: "🗞️" },
  packaging: { title: "Packaging Inserts", icon: "📦" },
  "window-graphics": { title: "Window & Wall Graphics", icon: "🪟" },
  displays: { title: "Display Hardware", icon: "🧱" },
  "marketing-prints": { title: "Marketing Prints", icon: "🗞️" },
  "stickers-labels": { title: "Stickers & Labels", icon: "✨" },
  "rigid-signs": { title: "Rigid Signs", icon: "🪧" },
  "banners-displays": { title: "Banners & Displays", icon: "🏳️" },
  "business-forms": { title: "Business Forms", icon: "🧾" },
  "retail-promo": { title: "Retail Promo", icon: "🏷️" },
  "large-format-graphics": { title: "Large Format Graphics", icon: "🪟" },
};

// Preferred display order — categories not listed sort alphabetically at the end
const CATEGORY_ORDER = [
  "fleet-compliance-id",
  "vehicle-branding-advertising",
  "safety-warning-decals",
  "facility-asset-labels",
  "display-stands",
  "stickers",
  "stickers-labels",
  "signs",
  "rigid-signs",
  "banners",
  "banners-displays",
  "marketing",
  "marketing-prints",
  "packaging",
  "window-graphics",
  "large-format-graphics",
  "displays",
  "business-forms",
  "retail-promo",
];

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function groupByCategory(products) {
  const map = new Map();
  for (const p of products) {
    const cat = p.category || "other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(p);
  }
  for (const [, items] of map) {
    items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  }
  // Sort categories by preferred order
  const entries = Array.from(map.entries());
  entries.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a[0]);
    const ib = CATEGORY_ORDER.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return entries;
}

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const grouped = groupByCategory(products);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 relative">
      {/* Hero */}
      <div className="bg-black text-white pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
            Toronto Printing Shop
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            PRINT. <span className="text-gray-500">SHIP.</span> DONE.
          </h1>
          <p className="text-gray-400 max-w-xl text-lg">
            The easiest way to order custom stickers & signs in the GTA.
            Industrial quality, factory direct pricing.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href="/shop"
              className="bg-white text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Shop All Products
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:border-white/70 transition-colors"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Product count badge */}
      <div className="max-w-7xl mx-auto px-6 -mt-5 mb-8">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-xs font-bold text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {products.length} Products Available
        </div>
      </div>

      {/* Shop by Industry */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Shop by Industry</p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_TAGS.map((tag) => {
            const meta = INDUSTRY_LABELS[tag];
            if (!meta) return null;
            return (
              <Link
                key={tag}
                href={`/shop/industry/${tag}`}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-bold text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all"
              >
                <span>{meta.icon}</span> {meta.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {grouped.map(([category, items]) => {
          const meta = CATEGORY_META[category] || { title: category, icon: "🧩" };

          return (
            <section key={category} className="mb-16">
              <div className="flex items-end gap-4 mb-8">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  {meta.title}
                </h2>
                <div className="h-px bg-gray-200 flex-1 mb-2" />
                <Link
                  href={`/shop?category=${category}`}
                  className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors whitespace-nowrap mb-2"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductCard key={product.id} item={product} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ item }) {
  const href = `/shop/${item.category}/${item.slug}`;
  const img = item.images?.[0]?.url;
  const icon = CATEGORY_META[item.category]?.icon || "🧩";

  return (
    <Link
      href={href}
      className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
    >
      <div className="space-y-4">
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
          {img ? (
            <Image
              src={img}
              alt={item.name}
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">{icon}</span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {item.basePrice > 0 ? "From" : "Get Quote"}
        </div>
        <div className="text-sm font-black">
          {item.basePrice > 0 ? formatCad(item.basePrice) : "Custom"}
        </div>
      </div>
    </Link>
  );
}
