const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

export const metadata = {
  title: "Partner Program | La Lunar Printing Inc.",
  description:
    "Join the La Lunar Printing partner program. Earn commissions, get volume discounts, and grow your business with Canada's trusted custom print shop.",
  alternates: { canonical: `${SITE_URL}/partner` },
  openGraph: {
    title: "Partner Program | La Lunar Printing Inc.",
    description:
      "Earn commissions and volume discounts as a La Lunar Printing partner.",
    url: `${SITE_URL}/partner`,
    type: "website",
  },
};

export default function PartnerLayout({ children }) {
  return children;
}
