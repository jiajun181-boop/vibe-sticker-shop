/**
 * Cross-category product association rules for "Frequently Bought Together"
 * and cart upsell recommendations.
 *
 * Structure: { [categorySlug]: [{ slug, reason_en, reason_zh }] }
 * - slug: target product slug to recommend
 * - reason_en/reason_zh: short explanation shown to user
 *
 * Also used by CartUpsell to suggest complementary products.
 */

export const CATEGORY_ASSOCIATIONS = {
  "marketing-business-print": [
    { slug: "envelopes", reason_en: "Complete your brand kit", reason_zh: "配齐品牌套装" },
    { slug: "letterhead", reason_en: "Match your business cards", reason_zh: "搭配名片使用" },
    { slug: "presentation-folders", reason_en: "Professional presentation", reason_zh: "专业展示" },
  ],
  "stickers-labels-decals": [
    { slug: "roll-labels", reason_en: "Great for packaging", reason_zh: "适合产品包装" },
    { slug: "postcards", reason_en: "Include in every order", reason_zh: "每单附赠好选择" },
  ],
  "banners-displays": [
    { slug: "retractable-banner-stands", reason_en: "Display your banner", reason_zh: "展示您的横幅" },
    { slug: "yard-signs", reason_en: "Outdoor signage too?", reason_zh: "户外标牌也需要？" },
  ],
  "signs-rigid-boards": [
    { slug: "vinyl-banners", reason_en: "Add a banner too", reason_zh: "也加一面横幅？" },
    { slug: "die-cut-stickers", reason_en: "Custom stickers to match", reason_zh: "搭配定制贴纸" },
  ],
  "canvas-prints": [
    { slug: "foam-board-signs", reason_en: "Add signage", reason_zh: "配合标牌展示" },
  ],
  "vehicle-graphics-fleet": [
    { slug: "die-cut-stickers", reason_en: "Bumper stickers too?", reason_zh: "也做汽车贴纸？" },
    { slug: "reflective-safety-decals", reason_en: "Safety compliance", reason_zh: "安全合规标识" },
  ],
  "vehicle-branding-advertising": [
    { slug: "die-cut-stickers", reason_en: "Bumper stickers too?", reason_zh: "也做汽车贴纸？" },
    { slug: "reflective-safety-decals", reason_en: "Safety compliance", reason_zh: "安全合规标识" },
  ],
};

/**
 * Product-level overrides (slug → recommendations).
 * These take priority over category associations.
 */
export const PRODUCT_ASSOCIATIONS = {
  "standard-business-cards": [
    { slug: "envelopes", reason_en: "Complete your brand kit", reason_zh: "配齐品牌套装" },
    { slug: "letterhead", reason_en: "Matching letterhead", reason_zh: "搭配信头纸" },
    { slug: "postcards", reason_en: "Direct mail campaign", reason_zh: "直邮营销活动" },
  ],
  "die-cut-stickers": [
    { slug: "kiss-cut-stickers", reason_en: "Try kiss-cut too", reason_zh: "也试试半刀贴纸" },
    { slug: "sticker-sheets", reason_en: "Sheet format option", reason_zh: "贴纸页格式" },
    { slug: "roll-labels", reason_en: "For product packaging", reason_zh: "用于产品包装" },
  ],
  "kiss-cut-stickers": [
    { slug: "die-cut-stickers", reason_en: "Try die-cut too", reason_zh: "也试试模切贴纸" },
    { slug: "sticker-sheets", reason_en: "Sheet format option", reason_zh: "贴纸页格式" },
  ],
  "vinyl-banners": [
    { slug: "retractable-banner-stands", reason_en: "Need a stand?", reason_zh: "需要展架吗？" },
    { slug: "mesh-banners", reason_en: "For windy areas", reason_zh: "适合通风区域" },
  ],
  "yard-signs": [
    { slug: "h-stakes", reason_en: "Wire stakes included?", reason_zh: "含支架吗？" },
    { slug: "foam-board-signs", reason_en: "Indoor option", reason_zh: "室内展示选择" },
  ],
};

/**
 * Get recommended products for a given product slug and category.
 * Returns an array of { slug, reason_en, reason_zh }.
 */
export function getAssociationsFor(productSlug, categorySlug) {
  // Product-level takes priority
  if (PRODUCT_ASSOCIATIONS[productSlug]) {
    return PRODUCT_ASSOCIATIONS[productSlug];
  }
  // Fall back to category-level
  return CATEGORY_ASSOCIATIONS[categorySlug] || [];
}
