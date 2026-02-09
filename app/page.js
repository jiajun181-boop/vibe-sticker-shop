import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_TAGS, INDUSTRY_LABELS } from "@/lib/industryTags";

export const dynamic = "force-dynamic";

// ── Canonical category metadata (merged, no duplicates) ──
const CATEGORY_META = {
  "stickers-labels": { title: "Stickers & Labels", icon: "✨" },
  "rigid-signs": { title: "Signs & Boards", icon: "🪧" },
  "banners-displays": { title: "Banners & Displays", icon: "🏳️" },
  "marketing-prints": { title: "Marketing Prints", icon: "🗞️" },
  displays: { title: "Display Hardware", icon: "🧱" },
  "vehicle-branding-advertising": { title: "Vehicle Branding", icon: "🚐" },
  "safety-warning-decals": { title: "Safety & Warning Decals", icon: "⚠️" },
  "fleet-compliance-id": { title: "Fleet Compliance & ID", icon: "🚛" },
  "facility-asset-labels": { title: "Facility & Asset Labels", icon: "🏭" },
  "retail-promo": { title: "Retail Promo", icon: "🏷️" },
  packaging: { title: "Packaging Inserts", icon: "📦" },
  "business-forms": { title: "Business Forms", icon: "🧾" },
  "large-format-graphics": { title: "Large Format Graphics", icon: "🪟" },
  "window-graphics": { title: "Window & Wall Graphics", icon: "🪟" },
};

// Top 8 categories shown on homepage (curated order)
const HOMEPAGE_CATEGORIES = [
  "stickers-labels",
  "rigid-signs",
  "banners-displays",
  "marketing-prints",
  "vehicle-branding-advertising",
  "safety-warning-decals",
  "fleet-compliance-id",
  "facility-asset-labels",
];

const MAX_PER_CATEGORY = 4;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default async function HomePage() {
  // Only fetch products in the featured homepage categories
  const products = await prisma.product.findMany({
    where: { isActive: true, category: { in: HOMEPAGE_CATEGORIES } },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const totalCount = await prisma.product.count({ where: { isActive: true } });

  // Group by category and cap at MAX_PER_CATEGORY
  const grouped = [];
  for (const cat of HOMEPAGE_CATEGORIES) {
    const items = products
      .filter((p) => p.category === cat)
      .slice(0, MAX_PER_CATEGORY);
    if (items.length > 0) grouped.push([cat, items]);
  }

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
          {totalCount} Products Available
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

      {/* Featured categories — 8 categories, 4 products each */}
      <div className="max-w-7xl mx-auto px-6">
        {grouped.map(([category, items]) => {
          const meta = CATEGORY_META[category] || { title: category, icon: "🧩" };
          const totalInCat = products.filter((p) => p.category === category).length;

          return (
            <section key={category} className="mb-14">
              <div className="flex items-end gap-4 mb-6">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span className="text-xl">{meta.icon}</span>
                  {meta.title}
                </h2>
                <div className="h-px bg-gray-200 flex-1 mb-1" />
                <Link
                  href={`/shop?category=${category}`}
                  className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors whitespace-nowrap mb-1"
                >
                  {totalInCat > MAX_PER_CATEGORY ? `All ${totalInCat}` : "View All"} &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductCard key={product.id} item={product} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Browse all CTA */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/shop"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
          >
            Browse All {totalCount} Products
          </Link>
        </div>
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
