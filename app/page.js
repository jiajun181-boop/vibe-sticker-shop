import Link from "next/link";
import { PRODUCTS } from "@/config/products";

const CATEGORY_META = {
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

function groupByCategory(products) {
  const map = new Map();
  for (const p of products) {
    const cat = p.category || "other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(p);
  }
  // Optional: sort each category by name
  for (const [cat, items] of map) {
    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
  return Array.from(map.entries());
}

export default function HomePage() {
  const grouped = groupByCategory(PRODUCTS);

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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {grouped.map(([category, items]) => {
          const meta = CATEGORY_META[category] || {
            title: category,
            icon: "🧩",
          };

          return (
            <section key={category} className="mb-16">
              <div className="flex items-end gap-4 mb-8">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  {meta.title}
                </h2>
                <div className="h-px bg-gray-200 flex-1 mb-2"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductCard key={`${product.category}-${product.product}`} item={product} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Product card: live -> /shop, draft -> /quote
function ProductCard({ item }) {
  const startPrice = item.config?.minimumPrice || 0;

  const href =
    item.status === "live"
      ? `/shop/${item.category}/${item.product}`
      : `/quote?sku=${item.category}/${item.product}`;

  const icon =
    CATEGORY_META[item.category]?.icon || (item.category === "stickers" ? "✨" : "🪧");

  return (
    <Link
      href={href}
      className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
    >
      <div className="space-y-4">
        <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-500">
          {icon}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors">
              {item.name}
            </h3>

            {item.status !== "live" && (
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-black text-white uppercase tracking-widest">
                Quote
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {item.status === "live" ? "From" : "Starting"}
        </div>
        <div className="text-sm font-black">
          {item.status === "live" ? `$${startPrice}` : "Get Quote"}
        </div>
      </div>
    </Link>
  );
}
