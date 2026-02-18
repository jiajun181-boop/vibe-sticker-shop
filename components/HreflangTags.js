const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export default function HreflangTags({ path = "" }) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return (
    <>
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${cleanPath}`} />
      <link rel="alternate" hrefLang="zh" href={`${SITE_URL}/zh${cleanPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${cleanPath}`} />
    </>
  );
}
