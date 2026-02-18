const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export const metadata = {
  title: "Wholesale & Partnership | La Lunar Printing Inc.",
  description:
    "Partner with La Lunar Printing for volume pricing, blind shipping, priority production, and dedicated account management. Serving sign shops, fleet operators, and resellers across Canada.",
  alternates: { canonical: `${SITE_URL}/wholesale` },
  openGraph: {
    title: "Wholesale & Partnership | La Lunar Printing Inc.",
    description:
      "Volume pricing, blind shipping, and dedicated service for B2B partners across Canada.",
    url: `${SITE_URL}/wholesale`,
    type: "website",
  },
};

export default function WholesaleLayout({ children }) {
  return children;
}
