import Link from "next/link";
import { BANNER_TYPES, BANNER_TYPE_GROUPS } from "@/lib/banner-order-config";

export function generateMetadata() {
  return {
    title: "Banners, Displays & Flags — Order Online",
    description: "Order custom banners, display stands, flags, and backdrops for events, trade shows, and business.",
    openGraph: { title: "Banners, Displays & Flags — Order Online", url: "/order/banners" },
    alternates: { canonical: "https://www.lunarprint.ca/order/banners" },
  };
}

const TYPE_LINKS = {
  "vinyl-banner": "/order/vinyl-banners",
  "mesh-banner": "/order/mesh-banners",
  "fabric-banner": "/order/fabric-banners",
  "pole-banner": "/order/pole-banners",
  "retractable-stand": "/order/retractable-stands",
  "x-banner-stand": "/order/x-banner-stands",
  "feather-flag": "/order/flags",
  "teardrop-flag": "/order/flags",
  "backdrop": "/order/backdrops",
  "tabletop": "/order/tabletop-displays",
};

const TYPE_DESCRIPTIONS = {
  "vinyl-banner": "Durable outdoor vinyl — events, sales, grand openings",
  "mesh-banner": "Wind-through mesh — fences, construction, outdoor",
  "fabric-banner": "Premium polyester — trade shows, indoor display",
  "pole-banner": "Street light pole banners — municipal, commercial",
  "retractable-stand": "Portable roll-up stands — trade shows, lobbies",
  "x-banner-stand": "Lightweight X-frame stands — retail, events",
  "feather-flag": "Tall feather flags — storefronts, car lots, events",
  "teardrop-flag": "Teardrop-shaped flags — compact outdoor display",
  "backdrop": "Step & repeat backdrops — photo ops, media walls",
  "tabletop": "Compact tabletop displays — counters, reception desks",
};

const GROUP_ICONS = {
  banners: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
  displays: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
    </svg>
  ),
  flags: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
  backdrops: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 3h18a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 21 21H3a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 3 3Z" />
    </svg>
  ),
};

export default function BannerNavigationPage() {
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 text-center">
          <nav className="mb-4 text-xs text-gray-400">
            <Link href="/shop" className="hover:text-gray-600">Shop</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-600">Banners & Displays</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Banners, Displays & Flags
          </h1>
          <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
            Choose a product to start configuring. All products include free shipping on orders over $99 and a free digital proof.
          </p>
        </div>
      </div>

      {/* Grouped product cards */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-10">
        {BANNER_TYPE_GROUPS.map((grp) => {
          const items = BANNER_TYPES.filter((bt) => bt.group === grp.id);
          if (items.length === 0) return null;
          return (
            <section key={grp.id}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-gray-400">{GROUP_ICONS[grp.id]}</span>
                <h2 className="text-lg font-bold text-gray-900">{grp.label}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((bt) => {
                  const href = TYPE_LINKS[bt.id] || "/order/banners";
                  return (
                    <Link
                      key={bt.id}
                      href={href}
                      className="group flex flex-col gap-2 rounded-2xl border-2 border-gray-200 bg-white p-5 transition-all hover:border-gray-900 hover:shadow-lg"
                    >
                      <span className="text-base font-bold text-gray-900 group-hover:text-gray-900">
                        {bt.id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                      <span className="text-xs text-gray-500 leading-relaxed">
                        {TYPE_DESCRIPTIONS[bt.id] || ""}
                      </span>
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        {bt.includesHardware && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Includes hardware
                          </span>
                        )}
                        <span className="ml-auto text-xs font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">
                          Configure &rarr;
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
