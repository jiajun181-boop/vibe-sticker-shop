import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerT, getServerLocale } from "@/lib/i18n/server";
import { OrganizationSchema, WebSiteSchema } from "@/components/JsonLd";
import DualEntryHero from "@/components/home/DualEntryHero";
import GoogleReviews from "@/components/home/GoogleReviews";
import HomeScrollWrapper from "@/components/home/HomeScrollWrapper";
import { getProductImage, isSvgImage } from "@/lib/product-image";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";
const BRAND = "La Lunar Printing Inc.";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const CATEGORY_CARDS = [
  { slug: "marketing-business-print", title: "Marketing & Business Print", titleZh: "营销 & 商务印刷", desc: "Business cards, flyers, brochures & more", descZh: "名片、传单、折页等", gradient: "from-amber-400 to-orange-400", href: "/shop/marketing-business-print", icon: "/api/product-image/business-cards-classic?category=marketing-business-print&name=Business+Cards" },
  { slug: "stickers-labels-decals", title: "Stickers & Labels", titleZh: "贴纸 & 标签", desc: "Die-cut stickers, labels, decals & sheets", descZh: "异形贴纸、标签、贴花等", gradient: "from-violet-400 to-fuchsia-400", href: "/shop/stickers-labels-decals", icon: "/api/product-image/die-cut-stickers?category=stickers-labels-decals&name=Stickers" },
  { slug: "signs-rigid-boards", title: "Signs & Display Boards", titleZh: "标牌 & 展示板", desc: "Yard signs, foam boards, aluminum signs", descZh: "庭院标牌、泡沫板、铝板标牌", gradient: "from-emerald-400 to-teal-400", href: "/shop/signs-rigid-boards", icon: "/api/product-image/yard-sign?category=signs-rigid-boards&name=Signs" },
  { slug: "banners-displays", title: "Banners & Displays", titleZh: "横幅 & 展架", desc: "Vinyl banners, retractable stands, flags", descZh: "乙烯基横幅、易拉宝、旗帜", gradient: "from-rose-400 to-pink-400", href: "/shop/banners-displays", icon: "/api/product-image/vinyl-banners?category=banners-displays&name=Banners" },
  { slug: "canvas-prints", title: "Canvas Prints", titleZh: "帆布画", desc: "Gallery wraps, framed canvas, multi-panel", descZh: "画廊包边、框架帆布、多联画", gradient: "from-sky-400 to-blue-400", href: "/shop/canvas-prints", icon: "/api/product-image/canvas-standard?category=canvas-prints&name=Canvas" },
  { slug: "windows-walls-floors", title: "Windows, Walls & Floors", titleZh: "窗户、墙面 & 地面", desc: "Window films, wall graphics, floor decals", descZh: "窗膜、墙面图案、地面贴", gradient: "from-cyan-400 to-blue-400", href: "/shop/windows-walls-floors", icon: "/api/product-image/one-way-vision?category=windows-walls-floors&name=Window+Films" },
  { slug: "vehicle-graphics-fleet", title: "Vehicle Graphics & Fleet", titleZh: "车身图案 & 车队", desc: "Vehicle lettering, decals, fleet branding", descZh: "车身字母、贴花、车队品牌", gradient: "from-slate-400 to-indigo-400", href: "/shop/vehicle-graphics-fleet", icon: "/api/product-image/vehicle-wraps?category=vehicle-graphics-fleet&name=Vehicle+Wraps" },
];

const FEATURED_SLUGS = [
  "die-cut-stickers",
  "business-cards-classic",
  "flyers",
  "vinyl-banners",
  "yard-sign",
  "canvas-standard",
  "roll-up-banners",
  "custom-cut-vinyl-lettering-any-text",
];

export async function generateMetadata() {
  const title = "Custom Stickers, Labels & Signs";
  const description = "Toronto's trusted custom printing shop. Stickers, labels, banners, vehicle wraps, business cards & more. Fast turnaround, free shipping on orders $99+.";

  return {
    title,
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: "Custom Stickers, Labels & Signs",
      description: "Toronto's trusted custom printing shop. Stickers, labels, banners, vehicle wraps, business cards & more.",
      url: SITE_URL,
      siteName: BRAND,
      type: "website",
      images: [{ url: `${SITE_URL}/logo-social.png`, width: 1200, height: 630, alt: BRAND }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  const t = await getServerT();
  const locale = await getServerLocale();
  const isZh = locale === "zh";

  const [totalCount, featuredProducts] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, slug: { in: FEATURED_SLUGS } },
      select: {
        slug: true,
        name: true,
        category: true,
        displayFromPrice: true,
        minPrice: true,
        basePrice: true,
        images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
  ]);

  const featured = featuredProducts.map((p) => ({
    ...p,
    fromPrice: p.displayFromPrice || p.minPrice || p.basePrice || 0,
    href: `/shop/${p.category}/${p.slug}`,
    image: getProductImage(p, p.category),
  }));

  return (
    <HomeScrollWrapper>
      <div className="min-h-screen relative">
        <OrganizationSchema />
        <WebSiteSchema />

        {/* 1. Hero */}
        <DualEntryHero totalCount={totalCount} />

        {/* 2. Google Reviews — social proof right after hero */}
        <GoogleReviews />

        {/* 3. Shop by Category — 7 gradient cards */}
        <section className="py-16 md:py-20 bg-white animate-on-scroll">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
            <h2 className="heading-2 text-center mb-3">
              {t("home.shopByCategory")}
            </h2>
            <p className="text-center text-sm text-[var(--color-gray-500)] mb-10">
              {t("home.proSubtitle")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORY_CARDS.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl p-6 h-[160px] bg-gradient-to-br ${cat.gradient} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <h3 className="relative text-xl font-bold text-[#fff] leading-tight">
                    {isZh ? cat.titleZh : cat.title}
                  </h3>
                  <p className="relative mt-1 text-sm text-[#fff]/80 leading-snug">
                    {isZh ? cat.descZh : cat.desc}
                  </p>
                </Link>
              ))}
            </div>
            <div className="text-center pt-10">
              <Link
                href="/shop"
                className="btn-primary-pill btn-md inline-block"
              >
                {t("home.browseAll", { count: totalCount })}
              </Link>
            </div>
          </div>
        </section>

        {/* 4. Popular Products — auto-scrolling marquee */}
        {featured.length > 0 && (
          <section className="py-16 md:py-20 bg-[var(--color-gray-50)] animate-on-scroll overflow-hidden">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
              <h2 className="heading-2 text-center mb-3">
                {t("home.popularProducts")}
              </h2>
              <p className="text-center text-sm text-[var(--color-gray-500)] mb-10">
                {t("home.bestSellers")}
              </p>
            </div>
            {/* Mobile: swipeable horizontal scroll */}
            <div className="md:hidden overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 pb-4 -mx-4" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="flex gap-4">
                {featured.slice(0, 8).map((p) => (
                  <Link
                    key={p.slug}
                    href={p.href}
                    className="group w-[240px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="relative h-[160px] bg-[var(--color-gray-100)]">
                      <Image
                        src={p.image}
                        alt={p.images?.[0]?.alt || p.name}
                        fill
                        className="object-cover"
                        unoptimized={isSvgImage(p.image)}
                        sizes="240px"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-tight line-clamp-2">
                        {p.name}
                      </h3>
                      {p.fromPrice > 0 && (
                        <p className="mt-1 text-sm font-bold text-[var(--color-brand)]">
                          {t("home.from")} {formatCad(p.fromPrice)}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-[10px] font-semibold text-[#fff]">
                        {t("home.viewDetails")}
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            {/* Desktop: auto-scrolling marquee */}
            <div className="relative hidden md:block">
              <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
                {[...featured.slice(0, 8), ...featured.slice(0, 8)].map((p, i) => (
                  <Link
                    key={`${p.slug}-${i}`}
                    href={p.href}
                    className="group w-[260px] shrink-0 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-[180px] bg-[var(--color-gray-100)]">
                      <Image
                        src={p.image}
                        alt={p.images?.[0]?.alt || p.name}
                        fill
                        className="object-cover"
                        unoptimized={isSvgImage(p.image)}
                        sizes="260px"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-tight line-clamp-2">
                        {p.name}
                      </h3>
                      {p.fromPrice > 0 && (
                        <p className="mt-1 text-sm font-bold text-[var(--color-brand)]">
                          {t("home.from")} {formatCad(p.fromPrice)}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-[10px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
                        {t("home.viewDetails")}
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. Trust Signals */}
        <section className="py-16 md:py-20 bg-white animate-on-scroll">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center">
                <span className="text-3xl">&#x1F1E8;&#x1F1E6;</span>
                <h3 className="mt-3 text-base font-bold text-[var(--color-gray-900)]">
                  {t("home.madeInCanada")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-gray-500)]">
                  {t("home.madeInCanadaDesc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center">
                <span className="text-3xl">&#x26A1;</span>
                <h3 className="mt-3 text-base font-bold text-[var(--color-gray-900)]">
                  {t("home.fastTurnaround")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-gray-500)]">
                  {t("home.fastTurnaroundDesc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center">
                <span className="text-3xl">&#x1F4B0;</span>
                <h3 className="mt-3 text-base font-bold text-[var(--color-gray-900)]">
                  {t("home.factoryDirect")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-gray-500)]">
                  {t("home.factoryDirectDesc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center">
                <span className="text-3xl">&#x1F3C6;</span>
                <h3 className="mt-3 text-base font-bold text-[var(--color-gray-900)]">
                  {isZh ? "8年行业经验" : "8 Years in Business"}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-gray-500)]">
                  {isZh ? "自2018年起服务客户，值得信赖的印刷合作伙伴。" : "Trusted printing partner since 2018. Thousands of satisfied customers across Canada."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CTA */}
        <section className="bg-[var(--color-brand)] py-16 md:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#fff] tracking-tight">
              {t("home.ctaTitle")}
            </h2>
            <p className="mt-3 text-sm text-[#fff]/80">
              {t("home.ctaSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/quote"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand)] transition-colors hover:bg-gray-100"
              >
                {t("home.ctaQuote")}
              </Link>
              <Link
                href="/shop"
                className="rounded-full border-2 border-white px-6 py-3 text-sm font-semibold text-[#fff] transition-colors hover:bg-white/10"
              >
                {t("home.ctaBrowse")}
              </Link>
            </div>
          </div>
        </section>

      </div>
    </HomeScrollWrapper>
  );
}
