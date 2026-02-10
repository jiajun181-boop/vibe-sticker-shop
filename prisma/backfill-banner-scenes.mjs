import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const bannerConfigBySlug = {
  "vinyl-banner-13oz": {
    materials: ["13oz Vinyl", "Mesh Vinyl", "Blockout Vinyl"],
    addons: [
      { id: "hems_grommets", name: "Hems + Grommets", description: "Reinforced edges + metal grommets for outdoor hanging." },
      { id: "pole_pockets", name: "Pole Pockets", description: "Top and bottom pole pockets for frame or bracket mounting." },
      { id: "wind_slits", name: "Wind Slits", description: "Helps reduce wind load for exposed outdoor installs." },
    ],
    scenes: [
      {
        id: "storefront-promo",
        label: "Storefront Promotion",
        description: "High-impact street-facing promo banners with durable finishing.",
        defaultMaterial: "13oz Vinyl",
        defaultWidthIn: 72,
        defaultHeightIn: 36,
        defaultAddons: ["hems_grommets"],
      },
      {
        id: "trade-show-backdrop",
        label: "Trade Show Backdrop",
        description: "Cleaner indoor display for booths, stages, and media walls.",
        defaultMaterial: "Blockout Vinyl",
        defaultWidthIn: 120,
        defaultHeightIn: 96,
        defaultAddons: ["pole_pockets"],
      },
      {
        id: "outdoor-windy",
        label: "Outdoor Windy Area",
        description: "Fence/scaffold-friendly setup for sites with stronger wind.",
        defaultMaterial: "Mesh Vinyl",
        defaultWidthIn: 96,
        defaultHeightIn: 48,
        defaultAddons: ["hems_grommets", "wind_slits"],
      },
    ],
  },
  "mesh-banner": {
    materials: ["Mesh Vinyl", "13oz Vinyl"],
    addons: [
      { id: "hems_grommets", name: "Hems + Grommets", description: "Reinforced edges + metal grommets for outdoor hanging." },
      { id: "wind_slits", name: "Wind Slits", description: "Extra wind relief option for exposed install points." },
    ],
    scenes: [
      {
        id: "fence-signage",
        label: "Fence / Construction Signage",
        description: "Perforated mesh helps airflow while keeping the graphic visible.",
        defaultMaterial: "Mesh Vinyl",
        defaultWidthIn: 120,
        defaultHeightIn: 48,
        defaultAddons: ["hems_grommets"],
      },
      {
        id: "event-perimeter",
        label: "Event Perimeter Branding",
        description: "Branding around crowd barriers and event boundaries.",
        defaultMaterial: "Mesh Vinyl",
        defaultWidthIn: 96,
        defaultHeightIn: 36,
        defaultAddons: ["hems_grommets"],
      },
    ],
  },
};

async function main() {
  const slugs = Object.keys(bannerConfigBySlug);
  console.log(`Updating banner scene config for ${slugs.length} products...`);

  for (const slug of slugs) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        optionsConfig: true,
        pricingUnit: true,
        basePrice: true,
      },
    });

    if (!product) {
      console.log(`- skip ${slug}: not found`);
      continue;
    }

    const patch = bannerConfigBySlug[slug];
    const current = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};
    const nextOptionsConfig = {
      ...current,
      materials: patch.materials,
      addons: patch.addons,
      scenes: patch.scenes,
    };

    const data = {
      optionsConfig: nextOptionsConfig,
      pricingUnit: product.pricingUnit || "per_sqft",
      basePrice: product.basePrice && product.basePrice > 0 ? product.basePrice : 5000,
      minWidthIn: 12,
      minHeightIn: 12,
      maxWidthIn: 62,
      maxHeightIn: 240,
    };

    await prisma.product.update({
      where: { slug },
      data,
    });

    console.log(`- updated ${slug}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

