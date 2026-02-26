import { Suspense } from "react";
import { getBusinessCardConfig } from "@/lib/business-card-configs";
import BusinessCardConfigurator from "@/components/business-card/BusinessCardConfigurator";

const config = getBusinessCardConfig("business-cards-gold-foil");

export function generateMetadata() {
  return {
    title: config.seo.title,
    description: config.seo.description,
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      url: config.seo.canonical,
    },
    alternates: { canonical: `https://www.lunarprint.ca${config.seo.canonical}` },
  };
}

export default function BusinessCardsGoldFoilPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <BusinessCardConfigurator config={config} />
    </Suspense>
  );
}
