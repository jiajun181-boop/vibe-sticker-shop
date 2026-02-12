import BrochureModelsClient from "./BrochureModelsClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  const url = `${SITE_URL}/shop/marketing-prints/brochures`;
  return {
    title: "Brochures & Folded - Vibe Sticker Shop",
    description:
      "Choose your brochure fold type: bi-fold, tri-fold, or z-fold. Then customize and order on dedicated product pages.",
    alternates: { canonical: url },
    openGraph: {
      title: "Brochures & Folded - Vibe Sticker Shop",
      description:
        "Start with fold type selection for a cleaner mobile ordering flow.",
      url,
      type: "website",
    },
  };
}

export default function BrochuresIndexPage() {
  return <BrochureModelsClient />;
}
