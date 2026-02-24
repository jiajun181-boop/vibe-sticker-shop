"use client";

import { usePathname } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

export default function HreflangTags() {
  const pathname = usePathname();
  // Don't render hreflang on /zh pages (they are noindexed)
  if (pathname.startsWith("/zh")) return null;

  // Strip /zh prefix if present to get the canonical path
  const cleanPath = pathname.replace(/^\/zh/, "") || "/";

  return (
    <>
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${cleanPath}`} />
      <link rel="alternate" hrefLang="zh" href={`${SITE_URL}/zh${cleanPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${cleanPath}`} />
    </>
  );
}
