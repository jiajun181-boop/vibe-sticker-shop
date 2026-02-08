import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FeaturedBanner from "@/components/home/FeaturedBanner";
import QuoteCalculator from "@/components/home/QuoteCalculator";
import TrustSignals from "@/components/home/TrustSignals";
import BundlesSection from "@/components/home/BundlesSection";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  {
    slug: "display-stands",
    label: "Display Stands",
    description: "Retractable banners, X-frame stands, and tabletop displays",
    tags: ["Portable", "Trade Show Ready", "Includes Case"],
  },
  {
    slug: "fleet-compliance-id",
    label: "Fleet Compliance & ID",
    description: "TSSA, CVOR, DOT numbers and fleet identification decals",
    tags: ["TSSA Certified", "Outdoor Rated", "Cut Vinyl"],
  },
  {
    slug: "vehicle-branding-advertising",
    label: "Vehicle Branding & Advertising",
    description: "Custom wraps, door lettering, and promotional graphics",
    tags: ["Full Color", "UV Laminated", "Removable"],
  },
  {
    slug: "safety-warning-decals",
    label: "Safety & Warning Decals",
    description: "Reflective safety markings, hazard labels, and compliance decals",
    tags: ["Reflective", "High-Vis", "GHS Compliant"],
  },
  {
    slug: "facility-asset-labels",
    label: "Facility & Asset Labels",
    description: "Floor graphics, wayfinding, asset tags, and window films",
    tags: ["Anti-Slip", "QR/Barcode", "Frosted Film"],
  },
];

const FEATURED_SLUGS = [
  "retractable-banner-stand-premium",
  "x-banner-stand-standard",
  "x-banner-stand-large",
  "tabletop-banner-a4",
  "tabletop-banner-a3",
  "deluxe-tabletop-retractable-a3",
];

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
}

export default async function HomePage() {
  const [products, featuredProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.product.findMany({
      where: { slug: { in: FEATURED_SLUGS }, isActive: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const sortedFeatured = FEATURED_SLUGS
    .map((slug) => featuredProducts.find((p) => p.slug === slug))
    .filter(Boolean);

  const deliveryDate = getDeliveryDate();

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Hero */}
      <div className="bg-black text-white pt-16 pb-14 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
            Toronto&apos;s #1 Fleet &amp; Commercial Printing
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            PRINT. <span className="text-gray-500">SHIP.</span> DONE.
          </h1>
          <p className="text-gray-400 max-w-xl text-lg">
            The easiest way to order custom stickers, decals, signs &amp; display stands in the GTA.
            Industrial quality, factory direct pricing.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href="/shop"
              className="inline-block bg-white text-black px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-colors"
            >
              Browse All Products
            </Link>
            <a
              href="#quote"
              className="inline-block border border-white/30 text-white px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-colors"
            >
              Get Instant Quote
            </a>
          </div>
          <p className="text-xs text-gray-500">
            Order now for delivery by <span className="text-gray-300 font-bold">{deliveryDate}</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Featured Display Solutions */}
        <div className="-mt-8">
          <FeaturedBanner products={sortedFeatured} />
        </div>

        {/* Trust Signals */}
        <TrustSignals />

        {/* Category sections */}
        {CATEGORIES.map((cat) => {
          const catProducts = products.filter((p) => p.category === cat.slug);
          if (catProducts.length === 0) return null;

          return (
            <section key={cat.slug}>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">{cat.label}</h2>
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {catProducts.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{cat.description}</p>
                </div>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest whitespace-nowrap self-start sm:self-auto"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {cat.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {catProducts.slice(0, 4).map((product, idx) => (
                  <ProductCard key={product.id} product={product} isPopular={idx === 0} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Quote Calculator */}
        <QuoteCalculator />

        {/* Bundles */}
        <BundlesSection />
      </div>
    </div>
  );
}

function ProductCard({ product, isPopular }) {
  const img = product.images?.[0]?.url;
  const unit = product.pricingUnit === "per_sqft" ? "/sqft" : "";
  const madeToOrder = product.pricingUnit === "per_sqft" || product.type === "sign";

  return (
    <Link
      href={`/shop/${product.category}/${product.slug}`}
      className="group bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {isPopular && (
          <span className="bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
            Popular
          </span>
        )}
      </div>

      <div className="relative space-y-3">
        <div className="aspect-square bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-[1.03] transition-transform duration-500">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover rounded-xl md:rounded-2xl" />
          ) : (
            <span className="text-3xl md:text-4xl opacity-20">
              {product.type === "sign" ? "🪧" : product.type === "label" ? "🏷️" : "✨"}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-xs md:text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[10px] md:text-[11px] text-gray-400 line-clamp-2">{product.description}</p>
          )}
        </div>
      </div>

      <div className="relative mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
        <div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">From</span>
          <span className="text-sm font-black">
            {cad(product.basePrice)}
            {unit && <span className="text-[10px] text-gray-400 font-normal">{unit}</span>}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] text-gray-400">
            {madeToOrder ? "Made to Order" : "In Stock"}
          </span>
          <span className="bg-gray-100 text-gray-500 text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
