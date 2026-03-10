/**
 * Unified upsell / cross-sell recommendation rules.
 *
 * Single source of truth — used by both product-page RelatedProducts
 * and cart-drawer CartUpsell.
 *
 * Every entry: { slug, reason_en, reason_zh }
 */

// ── Product-level overrides (highest priority) ─────────────────────
export const PRODUCT_UPSELLS = {
  "standard-business-cards": [
    { slug: "postcards", reason_en: "Direct mail campaign", reason_zh: "直邮营销活动" },
    { slug: "flyers", reason_en: "Hand out at events", reason_zh: "活动派发传单" },
    { slug: "envelopes", reason_en: "Complete your brand kit", reason_zh: "配齐品牌套装" },
    { slug: "letterhead", reason_en: "Matching letterhead", reason_zh: "搭配信头纸" },
  ],
  "premium-business-cards": [
    { slug: "postcards", reason_en: "Direct mail campaign", reason_zh: "直邮营销活动" },
    { slug: "envelopes", reason_en: "Complete your brand kit", reason_zh: "配齐品牌套装" },
    { slug: "letterhead", reason_en: "Matching letterhead", reason_zh: "搭配信头纸" },
  ],
  "die-cut-stickers": [
    { slug: "roll-labels", reason_en: "For product packaging", reason_zh: "用于产品包装" },
    { slug: "sticker-sheets", reason_en: "Sheet format option", reason_zh: "贴纸页格式" },
    { slug: "kiss-cut-stickers", reason_en: "Try kiss-cut too", reason_zh: "也试试半刀贴纸" },
  ],
  "kiss-cut-stickers": [
    { slug: "die-cut-stickers", reason_en: "Try die-cut too", reason_zh: "也试试模切贴纸" },
    { slug: "sticker-sheets", reason_en: "Sheet format option", reason_zh: "贴纸页格式" },
    { slug: "roll-labels", reason_en: "For product packaging", reason_zh: "用于产品包装" },
  ],
  "vinyl-banners": [
    { slug: "retractable-banner-stands", reason_en: "Need a stand?", reason_zh: "需要展架吗？" },
    { slug: "mesh-banners", reason_en: "For windy areas", reason_zh: "适合通风区域" },
    { slug: "die-cut-stickers", reason_en: "Event stickers too?", reason_zh: "活动贴纸也来一些？" },
  ],
  "yard-signs": [
    { slug: "h-stakes", reason_en: "Wire stakes included?", reason_zh: "含支架吗？" },
    { slug: "vinyl-banners", reason_en: "Add a banner too", reason_zh: "也加一面横幅？" },
    { slug: "foam-board-signs", reason_en: "Indoor option", reason_zh: "室内展示选择" },
  ],
};

// ── Category-level fallbacks ────────────────────────────────────────
export const CATEGORY_UPSELLS = {
  "marketing-business-print": [
    { slug: "envelopes", reason_en: "Complete your brand kit", reason_zh: "配齐品牌套装" },
    { slug: "letterhead", reason_en: "Match your business cards", reason_zh: "搭配名片使用" },
    { slug: "postcards", reason_en: "Direct mail campaign", reason_zh: "直邮营销活动" },
    { slug: "presentation-folders", reason_en: "Professional presentation", reason_zh: "专业展示" },
  ],
  "stickers-labels-decals": [
    { slug: "roll-labels", reason_en: "Great for packaging", reason_zh: "适合产品包装" },
    { slug: "postcards", reason_en: "Include in every order", reason_zh: "每单附赠好选择" },
    { slug: "die-cut-stickers", reason_en: "Custom die-cut shapes", reason_zh: "定制模切形状" },
  ],
  "banners-displays": [
    { slug: "retractable-banner-stands", reason_en: "Display your banner", reason_zh: "展示您的横幅" },
    { slug: "vinyl-banners", reason_en: "Add a vinyl banner", reason_zh: "再加一面横幅" },
    { slug: "die-cut-stickers", reason_en: "Event stickers too?", reason_zh: "活动贴纸也来一些？" },
  ],
  "signs-rigid-boards": [
    { slug: "vinyl-banners", reason_en: "Add a banner too", reason_zh: "也加一面横幅？" },
    { slug: "die-cut-stickers", reason_en: "Custom stickers to match", reason_zh: "搭配定制贴纸" },
    { slug: "yard-signs", reason_en: "Outdoor signage too?", reason_zh: "户外标牌也需要？" },
  ],
  "canvas-prints": [
    { slug: "foam-board-signs", reason_en: "Add signage", reason_zh: "配合标牌展示" },
    { slug: "vinyl-banners", reason_en: "Event banner?", reason_zh: "活动横幅？" },
  ],
  "vehicle-graphics-fleet": [
    { slug: "die-cut-stickers", reason_en: "Bumper stickers too?", reason_zh: "也做汽车贴纸？" },
    { slug: "reflective-safety-decals", reason_en: "Safety compliance", reason_zh: "安全合规标识" },
  ],
  "vehicle-branding-advertising": [
    { slug: "die-cut-stickers", reason_en: "Bumper stickers too?", reason_zh: "也做汽车贴纸？" },
    { slug: "reflective-safety-decals", reason_en: "Safety compliance", reason_zh: "安全合规标识" },
  ],
  "windows-walls-floors": [
    { slug: "vinyl-banners", reason_en: "Add outdoor signage", reason_zh: "户外标识" },
    { slug: "die-cut-stickers", reason_en: "Custom stickers too?", reason_zh: "也做定制贴纸？" },
  ],
};

/**
 * Unified lookup: product-level first, then category fallback.
 * @param {string} productSlug
 * @param {string} categorySlug
 * @param {string[]} excludeSlugs - slugs already in cart
 * @param {number} limit - max results (default 3)
 * @returns {{ slug: string, reason_en: string, reason_zh: string }[]}
 */
export function getUpsellSuggestions(productSlug, categorySlug, excludeSlugs = [], limit = 3) {
  const exclude = new Set(excludeSlugs);
  const pool = PRODUCT_UPSELLS[productSlug] || CATEGORY_UPSELLS[categorySlug] || [];
  return pool.filter((r) => !exclude.has(r.slug)).slice(0, limit);
}
