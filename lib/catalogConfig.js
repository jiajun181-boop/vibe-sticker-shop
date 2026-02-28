import { prisma } from "@/lib/prisma";

/**
 * Default catalog display configuration.
 * Used as fallback when no "catalog.config" setting exists in DB.
 */
const DEFAULTS = {
  departments: [
    { key: "marketing-business-print", categories: ["marketing-business-print"] },
    { key: "stickers-labels-decals", categories: ["stickers-labels-decals"] },
    { key: "signs-rigid-boards", categories: ["signs-rigid-boards"] },
    { key: "banners-displays", categories: ["banners-displays"] },
    { key: "canvas-prints", categories: ["canvas-prints"] },
    { key: "windows-walls-floors", categories: ["windows-walls-floors"] },
    { key: "vehicle-graphics-fleet", categories: ["vehicle-graphics-fleet"] },
  ],

  homepageCategories: [
    "marketing-business-print",
    "stickers-labels-decals",
    "signs-rigid-boards",
    "banners-displays",
    "canvas-prints",
    "windows-walls-floors",
    "vehicle-graphics-fleet",
  ],

  maxPerCategory: 6,
  hiddenCategories: [],

  categoryMeta: {
    "marketing-business-print": {
      title: "Marketing & Business Print",
      titleZh: "营销 & 商务印刷",
      icon: "\uD83D\uDDA8\uFE0F",
      subGroups: [
        { slug: "flyers", title: "Flyers", titleZh: "传单", href: "/shop/marketing-business-print/flyers" },
        { slug: "brochures", title: "Brochures", titleZh: "折页", href: "/shop/marketing-business-print/brochures" },
        { slug: "door-hangers", title: "Door Hangers", titleZh: "门挂", href: "/shop/marketing-business-print/door-hangers" },
        { slug: "greeting-invitation-cards", title: "Greeting & Invitation Cards", titleZh: "贺卡 & 请柬", href: "/shop/marketing-business-print/greeting-invitation-cards" },
        { slug: "tickets-coupons", title: "Tickets, Coupons & Loyalty", titleZh: "门票、优惠券 & 会员卡", href: "/shop/marketing-business-print/tickets-coupons" },
        { slug: "menus", title: "Menus", titleZh: "菜单", href: "/shop/marketing-business-print/menus" },
        { slug: "posters", title: "Posters", titleZh: "海报", href: "/shop/marketing-business-print/posters" },
        { slug: "postcards", title: "Postcards", titleZh: "明信片", href: "/shop/marketing-business-print/postcards" },
        { slug: "rack-cards", title: "Rack Cards", titleZh: "展架卡片", href: "/shop/marketing-business-print/rack-cards" },
        { slug: "booklets", title: "Booklets", titleZh: "小册子", href: "/shop/marketing-business-print/booklets" },
        { slug: "bookmarks", title: "Bookmarks", titleZh: "书签", href: "/shop/marketing-business-print/bookmarks" },
        { slug: "calendars", title: "Calendars", titleZh: "日历", href: "/shop/marketing-business-print/calendars" },
        { slug: "business-cards", title: "Business Cards", titleZh: "名片", href: "/shop/marketing-business-print/business-cards" },
        { slug: "stamps", title: "Stamps", titleZh: "印章", href: "/shop/marketing-business-print/stamps" },
        { slug: "letterhead", title: "Letterhead", titleZh: "信纸", href: "/shop/marketing-business-print/letterhead" },
        { slug: "envelopes", title: "Envelopes", titleZh: "信封", href: "/shop/marketing-business-print/envelopes" },
        { slug: "notepads", title: "Notepads", titleZh: "便签本", href: "/shop/marketing-business-print/notepads" },
        { slug: "ncr-forms", title: "NCR Forms", titleZh: "无碳复写表格", href: "/shop/marketing-business-print/ncr-forms" },
        { slug: "document-printing", title: "Document Printing", titleZh: "文件印刷", href: "/shop/marketing-business-print/document-printing" },
        { slug: "certificates", title: "Certificates", titleZh: "证书", href: "/shop/marketing-business-print/certificates" },
        { slug: "shelf-displays", title: "Shelf Displays", titleZh: "货架展示", href: "/shop/marketing-business-print/shelf-displays" },
        { slug: "table-tents", title: "Table Tents", titleZh: "桌面三角架", href: "/shop/marketing-business-print/table-tents" },
        { slug: "tags", title: "Hang Tags", titleZh: "吊牌", href: "/shop/marketing-business-print/tags" },
        { slug: "loyalty-cards", title: "Loyalty Cards", titleZh: "会员卡", href: "/shop/marketing-business-print/loyalty-cards" },
        { slug: "inserts-packaging", title: "Product Inserts", titleZh: "包装内页", href: "/shop/marketing-business-print/inserts-packaging" },
        { slug: "presentation-folders", title: "Presentation Folders", titleZh: "文件夹", href: "/shop/marketing-business-print/presentation-folders" },
      ],
    },
    "stickers-labels-decals": {
      title: "Custom Stickers & Labels",
      titleZh: "定制贴纸 & 标签",
      icon: "\uD83C\uDFF7\uFE0F",
      subGroups: [
        { slug: "die-cut-stickers", title: "Die-Cut Stickers", titleZh: "异形模切贴纸", href: "/shop/stickers-labels-decals/die-cut-stickers" },
        { slug: "kiss-cut-stickers", title: "Kiss-Cut Stickers", titleZh: "半刀模切贴纸", href: "/shop/stickers-labels-decals/kiss-cut-stickers" },
        { slug: "sticker-sheets", title: "Sticker Sheets", titleZh: "贴纸页", href: "/shop/stickers-labels-decals/sticker-sheets" },
        { slug: "roll-labels", title: "Roll Labels", titleZh: "卷筒标签", href: "/shop/stickers-labels-decals/roll-labels" },
        { slug: "vinyl-lettering", title: "Vinyl Lettering & Decals", titleZh: "乙烯基字母贴", href: "/shop/stickers-labels-decals/vinyl-lettering" },
      ],
    },
    "signs-rigid-boards": {
      title: "Signs & Display Boards",
      titleZh: "标牌 & 展示板",
      icon: "\uD83E\uDEA7",
      subGroups: [
        { slug: "yard-sign", title: "Yard & Lawn Signs", titleZh: "庭院标牌", href: "/shop/signs-rigid-boards/yard-sign" },
        { slug: "real-estate-sign", title: "Real Estate Signs", titleZh: "房产标牌", href: "/shop/signs-rigid-boards/real-estate-sign" },
        { slug: "election-signs", title: "Election & Campaign Signs", titleZh: "竞选标牌", href: "/shop/signs-rigid-boards/election-signs" },
        { slug: "open-house-signs", title: "Open House Signs", titleZh: "开放参观标牌", href: "/shop/signs-rigid-boards/open-house-signs" },
        { slug: "directional-signs", title: "Directional Signs", titleZh: "指示标牌", href: "/shop/signs-rigid-boards/directional-signs" },
        { slug: "pvc-board-signs", title: "PVC Board Signs", titleZh: "PVC板标牌", href: "/shop/signs-rigid-boards/pvc-board-signs" },
        { slug: "selfie-frame-board", title: "Event & Photo Boards", titleZh: "活动 & 拍照板", href: "/shop/signs-rigid-boards/selfie-frame-board" },
        { slug: "welcome-sign-board", title: "Event Signs", titleZh: "活动标牌", href: "/shop/signs-rigid-boards/welcome-sign-board" },
        { slug: "tri-fold-presentation-board", title: "Presentation Boards", titleZh: "展示板", href: "/shop/signs-rigid-boards/tri-fold-presentation-board" },
        { slug: "a-frame-sign-stand", title: "A-Frame Signs", titleZh: "A型标牌", href: "/shop/signs-rigid-boards/a-frame-sign-stand" },
        { slug: "h-stakes", title: "H-Wire Stakes", titleZh: "H型支架", href: "/shop/signs-rigid-boards/h-stakes" },
        { slug: "real-estate-frame", title: "Real Estate Frames", titleZh: "房产边框", href: "/shop/signs-rigid-boards/real-estate-frame" },
      ],
    },
    "banners-displays": {
      title: "Banners & Displays",
      titleZh: "横幅 & 展架",
      icon: "\uD83C\uDFF3\uFE0F",
      subGroups: [
        { slug: "vinyl-banners", title: "Vinyl Banners", titleZh: "乙烯基横幅", href: "/order/vinyl-banners", description: "Durable 13oz–15oz vinyl for indoor/outdoor use", badges: ["Same Day Available"] },
        { slug: "mesh-banners", title: "Mesh Banners", titleZh: "网格横幅", href: "/order/mesh-banners", description: "Wind-resistant mesh for outdoor & fences", badges: ["Outdoor"] },
        { slug: "pole-banners", title: "Pole Banners", titleZh: "灯杆横幅", href: "/order/vinyl-banners", description: "Street-level pole-mounted banners" },
        { slug: "retractable-stands", title: "Retractable Stands", titleZh: "易拉宝", href: "/order/retractable-stands", description: "Roll-up banner stands for trade shows", badges: ["In Stock"] },
        { slug: "x-banner-stands", title: "X-Banner Stands", titleZh: "X展架", href: "/order/x-banner-stands", description: "Lightweight X-frame display stands", badges: ["In Stock"] },
        { slug: "tabletop-displays", title: "Tabletop Displays", titleZh: "桌面展示", href: "/shop/banners-displays/tabletop-displays", description: "Compact displays for counters & tables" },
        { slug: "backdrops-popups", title: "Backdrops & Pop-Ups", titleZh: "背景板 & 弹出展架", href: "/order/backdrops", description: "Step-and-repeat, tension fabric & media walls" },
        { slug: "flags-hardware", title: "Flags & Hardware", titleZh: "旗帜 & 配件", href: "/order/flags", description: "Feather flags, teardrop flags & bases" },
        { slug: "tents-outdoor", title: "Tents & Outdoor", titleZh: "帐篷 & 户外", href: "/shop/banners-displays/tents-outdoor", description: "Custom canopy tents & outdoor event displays" },
        { slug: "fabric-banners", title: "Fabric Banners", titleZh: "布质横幅", href: "/order/fabric-banners", description: "Premium dye-sublimation fabric banners" },
      ],
    },
    "canvas-prints": {
      title: "Canvas Prints",
      titleZh: "帆布画",
      icon: "\uD83D\uDDBC\uFE0F",
      subGroups: [
        { slug: "classic-canvas-prints", title: "Classic Canvas", titleZh: "经典帆布画", href: "/shop/canvas-prints/classic-canvas-prints" },
        { slug: "large-format-canvas", title: "Large Format", titleZh: "大幅面帆布画", href: "/shop/canvas-prints/large-format-canvas" },
        { slug: "canvas-collages", title: "Canvas Collages", titleZh: "拼贴帆布画", href: "/shop/canvas-prints/canvas-collages" },
        { slug: "triptych-canvas-split", title: "Triptych & Splits", titleZh: "三联 & 分割画", href: "/shop/canvas-prints/triptych-canvas-split" },
        { slug: "rolled-canvas-prints", title: "Rolled Canvas", titleZh: "卷轴帆布画", href: "/shop/canvas-prints/rolled-canvas-prints" },
      ],
    },
    "windows-walls-floors": {
      title: "Windows, Walls & Floors",
      titleZh: "窗户、墙面 & 地面",
      icon: "\uD83E\uDE9F",
      subGroups: [
        { slug: "one-way-vision", title: "One-Way Vision", titleZh: "单向透视膜", href: "/shop/windows-walls-floors/one-way-vision" },
        { slug: "frosted-window-film", title: "Frosted Window Film", titleZh: "磨砂窗膜", href: "/shop/windows-walls-floors/frosted-window-film" },
        { slug: "static-cling", title: "Static Cling", titleZh: "静电贴膜", href: "/shop/windows-walls-floors/static-cling" },
        { slug: "transparent-color-film", title: "Transparent Color Film", titleZh: "透明彩色膜", href: "/shop/windows-walls-floors/transparent-color-film" },
        { slug: "blockout-vinyl", title: "Blockout Vinyl", titleZh: "遮光乙烯基", href: "/shop/windows-walls-floors/blockout-vinyl" },
        { slug: "opaque-window-graphics", title: "Opaque Window Graphics", titleZh: "不透明窗贴", href: "/shop/windows-walls-floors/opaque-window-graphics" },
        { slug: "glass-waistline", title: "Glass Waistline", titleZh: "玻璃腰线", href: "/shop/windows-walls-floors/glass-waistline" },
        { slug: "wall-graphics", title: "Wall Graphics", titleZh: "墙面图案", href: "/shop/windows-walls-floors/wall-graphics" },
        { slug: "floor-graphics", title: "Floor Graphics", titleZh: "地面图案", href: "/shop/windows-walls-floors/floor-graphics" },
      ],
    },
    "vehicle-graphics-fleet": {
      title: "Vehicle Graphics & Fleet Branding",
      titleZh: "车身图案 & 车队品牌",
      icon: "\uD83D\uDE9A",
      subGroups: [
        { slug: "vehicle-wraps", title: "Vehicle Wraps", titleZh: "车身包覆", href: "/shop/vehicle-graphics-fleet/vehicle-wraps" },
        { slug: "door-panel-graphics", title: "Door & Panel", titleZh: "车门 & 车身板", href: "/shop/vehicle-graphics-fleet/door-panel-graphics" },
        { slug: "vehicle-decals", title: "Decals & Lettering", titleZh: "贴花 & 字母", href: "/shop/vehicle-graphics-fleet/vehicle-decals" },
        { slug: "magnetic-signs", title: "Magnetic Signs", titleZh: "磁性标牌", href: "/shop/vehicle-graphics-fleet/magnetic-signs" },
        { slug: "fleet-packages", title: "Fleet Packages", titleZh: "车队套餐", href: "/shop/vehicle-graphics-fleet/fleet-packages" },
        { slug: "dot-mc-numbers", title: "DOT & MC Numbers", titleZh: "DOT & MC号码", href: "/shop/vehicle-graphics-fleet/dot-mc-numbers" },
        { slug: "unit-weight-ids", title: "Unit & Weight IDs", titleZh: "单位 & 重量标识", href: "/shop/vehicle-graphics-fleet/unit-weight-ids" },
        { slug: "spec-labels", title: "Spec Labels", titleZh: "规格标签", href: "/shop/vehicle-graphics-fleet/spec-labels" },
        { slug: "inspection-compliance", title: "Inspection & Compliance", titleZh: "检验 & 合规", href: "/shop/vehicle-graphics-fleet/inspection-compliance" },
      ],
    },
  },

  departmentMeta: {
    "marketing-business-print": { title: "Marketing & Business Print", titleZh: "营销 & 商务印刷" },
    "stickers-labels-decals": { title: "Stickers & Labels", titleZh: "贴纸 & 标签" },
    "signs-rigid-boards": { title: "Signs & Display Boards", titleZh: "标牌 & 展示板" },
    "banners-displays": { title: "Banners & Displays", titleZh: "横幅 & 展架" },
    "canvas-prints": { title: "Canvas Prints", titleZh: "帆布画" },
    "windows-walls-floors": { title: "Windows, Walls & Floors", titleZh: "窗户、墙面 & 地面" },
    "vehicle-graphics-fleet": { title: "Vehicle Graphics & Fleet Branding", titleZh: "车身图案 & 车队品牌" },
  },
};

export { DEFAULTS as CATALOG_DEFAULTS };

export const ALL_CATEGORIES = DEFAULTS.homepageCategories;

export async function getCatalogConfig() {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "catalog.config" },
    });
    if (!row) return DEFAULTS;
    const saved = row.value;
    return {
      departments: saved.departments ?? DEFAULTS.departments,
      homepageCategories: saved.homepageCategories ?? DEFAULTS.homepageCategories,
      maxPerCategory: saved.maxPerCategory ?? DEFAULTS.maxPerCategory,
      hiddenCategories: saved.hiddenCategories ?? DEFAULTS.hiddenCategories,
      categoryMeta: saved.categoryMeta ?? DEFAULTS.categoryMeta,
      departmentMeta: saved.departmentMeta ?? DEFAULTS.departmentMeta,
    };
  } catch {
    return DEFAULTS;
  }
}
