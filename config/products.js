export const PRODUCTS = [
  {
    category: "stickers",
    product: "die-cut",
    name: "Die-Cut Stickers",
    pricingModel: "area_tier",
    config: {
      minimumPrice: 30,
      fileFee: 2.0,
      areaUnit: "sq_in",
      tiers: [
        { upTo: 10, rate: 0.15 },
        { upTo: 50, rate: 0.12 },
        { upTo: 9999, rate: 0.10 }
      ]
    },
    options: {
      size: {
        type: "custom",
        min: [1, 1],
        max: [24, 24],
        maxRollWidthIn: 24,
        maxLengthIn: 48,
        allowRotate: true
      },
      addons: [
        { id: "uv", name: "UV Protect", price: 0.02, type: "per_area" }
      ]
    },
    fileRules: { allowedFormats: ["pdf", "png", "jpg"], minDPI: 300 }
  },
  {
    category: "signs",
    product: "coroplast",
    name: "Yard Signs",
    pricingModel: "fixed_size_tier",
    config: {
      minimumPrice: 15,
      sizes: [
        {
          label: "18x24",
          tiers: [{ qty: 10, price: 15 }, { qty: 25, price: 12 }]
        }
      ]
    },
    options: {
      size: { type: "preset" }
    }
  }
];