import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerT, getServerLocale } from "@/lib/i18n/server";
import { OrganizationSchema, WebSiteSchema } from "@/components/JsonLd";
import DualEntryHero from "@/components/home/DualEntryHero";
import GoogleReviews from "@/components/home/GoogleReviews";
import HomeScrollWrapper from "@/components/home/HomeScrollWrapper";
import WelcomeBanner from "@/components/home/WelcomeBanner";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import { formatCad } from "@/lib/product-helpers";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";
const BRAND = "La Lunar Printing Inc.";

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
        id: true,
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

  // Batch-fetch Asset system images (UploadThing uploads) for all featured products
  const productIds = featuredProducts.map((p) => p.id);
  const assetLinks = productIds.length > 0
    ? await prisma.assetLink.findMany({
        where: {
          entityType: "product",
          entityId: { in: productIds },
          asset: { status: "published" },
        },
        include: { asset: { select: { originalUrl: true } } },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  // Build map: productId → first asset URL
  const assetUrlMap = {};
  for (const link of assetLinks) {
    if (!assetUrlMap[link.entityId] && link.asset?.originalUrl) {
      assetUrlMap[link.entityId] = link.asset.originalUrl;
    }
  }

  const featured = featuredProducts.map((p) => {
    // Prepend asset URL if available so getProductImage finds it
    const assetUrl = assetUrlMap[p.id];
    const productWithAsset = assetUrl
      ? { ...p, images: [{ url: assetUrl, alt: p.name }, ...(p.images || [])] }
      : p;
    return {
      ...p,
      fromPrice: p.displayFromPrice || p.minPrice || p.basePrice || 0,
      href: `/shop/${p.category}/${p.slug}`,
      image: getProductImage(productWithAsset, p.category),
    };
  });

  return (
    <HomeScrollWrapper>
      <div className="min-h-screen relative">
        <OrganizationSchema />
        <WebSiteSchema />

        {/* 0. Welcome banner for first-time visitors */}
        <WelcomeBanner />

        {/* 1. Hero */}
        <DualEntryHero totalCount={totalCount} />

        {/* 1a. Trust bar — free shipping + guarantee + turnaround */}
        <div className="bg-[var(--color-gray-50)] border-b border-gray-200">
          <div className="mx-auto max-w-[1600px] flex items-center justify-center gap-6 md:gap-10 px-4 py-2.5 text-[11px] sm:text-xs font-medium text-[var(--color-gray-600)] overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M3.375 14.25h3v3.75M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v10.875M18.75 14.25h-5.625" /></svg>
              {t("home.trustFreeShipping")}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <svg className="h-4 w-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              {t("home.trustGuarantee")}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t("home.trustTurnaround")}
            </span>
          </div>
        </div>

        {/* 1b. Quick category strip — "What do you sell?" in 5 seconds */}
        <div className="bg-white border-b border-gray-100 py-4 overflow-x-auto scrollbar-hide">
          <div className="mx-auto flex items-center justify-start md:justify-center gap-3 px-4 sm:px-6 min-w-max md:min-w-0">
            {CATEGORY_CARDS.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.href}
                className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-center transition-colors hover:bg-gray-50 shrink-0"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${cat.gradient} text-white text-lg`}>
                  {(isZh ? cat.titleZh : cat.title).charAt(0)}
                </span>
                <span className="text-[11px] font-medium text-gray-600 leading-tight max-w-[72px]">
                  {isZh ? cat.titleZh.split(" & ")[0].split("、")[0] : cat.title.split(" & ")[0].split(",")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>

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

        {/* 4a. Shop by Use Case — help customers who don't know which product */}
        <section className="py-16 md:py-20 bg-white animate-on-scroll">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
            <h2 className="heading-2 text-center mb-3">
              {t("home.useCaseTitle")}
            </h2>
            <p className="text-center text-sm text-[var(--color-gray-500)] mb-10">
              {t("home.useCaseSubtitle")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605", titleKey: "home.useCase1Title", descKey: "home.useCase1Desc", href: "/shop/banners-displays" },
                { icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z", titleKey: "home.useCase2Title", descKey: "home.useCase2Desc", href: "/shop/stickers-labels-decals" },
                { icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42", titleKey: "home.useCase3Title", descKey: "home.useCase3Desc", href: "/shop/stickers-labels-decals" },
                { icon: "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z", titleKey: "home.useCase4Title", descKey: "home.useCase4Desc", href: "/shop/marketing-business-print" },
                { icon: "M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z", titleKey: "home.useCase5Title", descKey: "home.useCase5Desc", href: "/shop/windows-walls-floors" },
                { icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M3.375 14.25h3v3.75M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v10.875M18.75 14.25h-5.625", titleKey: "home.useCase6Title", descKey: "home.useCase6Desc", href: "/shop/vehicle-graphics-fleet" },
              ].map((uc, i) => (
                <Link
                  key={i}
                  href={uc.href}
                  className="group flex flex-col items-center text-center rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-50)] mb-3">
                    <svg className="h-6 w-6 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={uc.icon} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">{t(uc.titleKey)}</h3>
                  <p className="mt-1 text-xs text-[var(--color-gray-500)] leading-relaxed">{t(uc.descKey)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 4b. How It Works — reduce ordering pressure (audit #4, #15) */}
        <section className="py-16 md:py-20 bg-white animate-on-scroll">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
            <h2 className="heading-2 text-center mb-3">
              {t("home.howItWorksTitle")}
            </h2>
            <p className="text-center text-sm text-[var(--color-gray-500)] mb-10">
              {t("home.howItWorksSubtitle")}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z", title: t("home.step1Title"), desc: t("home.step1Desc") },
                { step: "2", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z", title: t("home.step2Title"), desc: t("home.step2Desc") },
                { step: "3", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5", title: t("home.step3Title"), desc: t("home.step3Desc") },
                { step: "4", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12", title: t("home.step4Title"), desc: t("home.step4Desc") },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-gray-100)]">
                    <svg className="h-6 w-6 text-[var(--color-gray-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-[#fff]">{s.step}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-[var(--color-gray-900)]">{s.title}</h3>
                  <p className="mt-1 text-xs text-[var(--color-gray-500)] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                  {t("home.yearsInBusiness")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-gray-500)]">
                  {t("home.yearsInBusinessDesc")}
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
