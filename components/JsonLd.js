const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

// Category slug → display name mapping for breadcrumbs
const CATEGORY_DISPLAY_NAMES = {
  "marketing-prints": "Marketing Prints",
  "business-cards": "Business Cards",
  stamps: "Self-Inking Stamps",
  "rigid-signs": "Signs & Boards",
  "banners-displays": "Banners & Displays",
  "display-stands": "Display Stands",
  "large-format-graphics": "Large Format Graphics",
  "vehicle-branding-advertising": "Vehicle Branding",
  "fleet-compliance-id": "Fleet Compliance",
  "stickers-labels": "Stickers & Labels",
  "safety-warning-decals": "Safety & Warning",
  "facility-asset-labels": "Facility & Asset Labels",
  "retail-promo": "Retail Promo",
  packaging: "Packaging Inserts",
};

export function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "La Lunar Printing Inc.",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-lunarprint.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-647-783-4728",
      contactType: "customer service",
      areaServed: "CA",
      availableLanguage: ["English", "Chinese"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "La Lunar Printing Inc.",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ProductSchema({ product }) {
  const image = product.images?.[0]?.url || `${SITE_URL}/og-image.png`;
  const url = `${SITE_URL}/shop/${product.category}/${product.slug}`;

  // Use best available price: displayFromPrice > minPrice > basePrice
  const bestPriceCents = product.displayFromPrice || product.minPrice || product.basePrice || 0;
  const bestPrice = (bestPriceCents / 100).toFixed(2);
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const availability = product.isActive
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  // Build offers — use AggregateOffer when tiered pricing exists to show volume range
  const preset = product.pricingPreset;
  const tiers = preset?.config?.tiers;
  let offers;

  if (Array.isArray(tiers) && tiers.length >= 2 && preset.model === "QTY_TIERED") {
    const sortedTiers = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
    const highPrice = Number(sortedTiers[0].unitPrice || 0);
    const lowPrice = Number(sortedTiers[sortedTiers.length - 1].unitPrice || 0);
    if (highPrice > 0 && lowPrice > 0 && highPrice > lowPrice) {
      offers = {
        "@type": "AggregateOffer",
        priceCurrency: "CAD",
        lowPrice: lowPrice.toFixed(2),
        highPrice: highPrice.toFixed(2),
        offerCount: String(sortedTiers.length),
        availability,
        url,
      };
    }
  }

  if (!offers) {
    offers = {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: bestPrice,
      availability,
      url,
      priceValidUntil: validUntil,
    };
  }

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Custom ${product.name}`,
    image,
    url,
    brand: { "@type": "Brand", name: "La Lunar Printing Inc." },
    offers,
    ...(product.pricingUnit === "per_sqft" ? {
      additionalProperty: {
        "@type": "PropertyValue",
        name: "Pricing Unit",
        value: "per square foot",
      },
    } : {}),
    // Only include aggregateRating if product has real review data
    ...(product.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: String(product.ratingValue),
        reviewCount: String(product.reviewCount),
      },
    } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbSchema({ category, productName }) {
  const categoryName = CATEGORY_DISPLAY_NAMES[category] || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 2, name: categoryName, item: `${SITE_URL}/shop/${category}` },
      { "@type": "ListItem", position: 3, name: productName },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function CollectionPageSchema({ name, description, url, products }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/shop/${p.category}/${p.slug}`,
        name: p.name,
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbSchemaFromItems({ items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FAQSchema({ items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
