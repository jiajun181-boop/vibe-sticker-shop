# LunarPrint 定价数据审计报告

**日期**: 2026-02-21
**状态**: 只读审计，未修改任何数据

---

## 总览

| 指标 | 数量 | 状态 |
|------|------|------|
| 数据库材料 | 40 (32真实 + 8占位符) | ⚠️ 需清理 |
| 数据库产品 | 453 (217活跃 / 236停用) | ⚠️ 严重冗余 |
| 定价预设 | 329 | ⚠️ 大量遗留 |
| 硬件/配件 | 26 | ✅ |
| 前端产品页 | ~60个URL路由 | ✅ |
| 构建状态 | 208页，成功 | ✅ |

### 🔴 致命问题
1. **453个产品中0个设置了 `displayFromPrice`** — 分类页无法显示"起步价"
2. **18个活跃产品没有定价预设** — 后台无法计算价格
3. **8个活跃产品 basePrice=$0** — 完全没有价格
4. **8个 "New Material" 占位符** — 空材料记录污染数据库

---

## 1. 后台数据库完整导出

### 1A. 材料表 (Material) — 40条记录

#### 有效材料 (32条)

| # | 类型 | 名称 | 卷规格 | 宽度 | 卷成本 | $/sqft | 覆膜 |
|---|------|------|--------|------|--------|--------|------|
| 1 | Adhesive Vinyl | Regular White Vinyl (Orajet 3164) | 54"×150' 4mil Gloss Perm | 53" | $213.06 | $0.32 | Gloss/Matte |
| 2 | Adhesive Vinyl | Blockout Vinyl (Permanent) | 54"×150' 4mil Perm | 54" | $129.00 | $0.19 | Gloss/Matte |
| 3 | Adhesive Vinyl | Blockout Vinyl (Removable) | 54"×150' 4mil Rem | 54" | $152.84 | $0.23 | Gloss/Matte |
| 4 | Adhesive Vinyl | Perforated Vinyl (Removable) | 54"×150' 6mil Rem PSA | 54" | $285.72 | $0.42 | Gloss/Matte |
| 5 | Adhesive Vinyl | Removable White Vinyl | 54"×150' 3.2mil Rem | 54" | $201.49 | $0.30 | Gloss/Matte |
| 6 | Adhesive Vinyl | Reflective Vinyl | 1.24m×45.7m | 49" | $243.86 | $0.40 | Gloss/Matte |
| 7 | Adhesive Vinyl | Clear Vinyl | 54"×150' 3mil Rem | 54" | $286.96 | $0.43 | Gloss/Matte |
| 8 | Adhesive Vinyl | Translucent Vinyl (Removable) | 54"×150' Semi-Gloss Rem | 54" | $381.92 | $0.57 | Gloss/Matte |
| 9 | Adhesive Vinyl | Frosted Vinyl (Etch Glass) | 60"×100' 3mil Perm | 60" | $519.06 | $0.69 | Gloss/Matte |
| 10 | Adhesive Vinyl | Floor Graphics (3M IJ40 + 8509) | 3M combo (quoted) | - | $0 | $0 | Anti-Slip |
| 11 | Adhesive Vinyl | Car Wrap Vinyl (3M IJ180) | 3M (quoted) | - | $0 | $0 | 3M matched |
| 12 | Adhesive Vinyl | Concrete/Brick (3M IJ8624) | 3M (quoted) | - | $0 | $0 | 3M matched |
| 13 | Non-Adhesive | Poster Paper (Matte/Gloss 220gsm) | 54"×100' | 54" | $154.04 | $0.34 | Gloss/Matte |
| 14 | Non-Adhesive | Canvas | 54"×82' 22mil | 54" | $207.22 | $0.56 | Gloss/Matte |
| 15 | Non-Adhesive | Backlit Film | 54"×100' 8.4mil | 54" | $550.75 | $1.22 | Gloss/Matte |
| 16 | Non-Adhesive | White Static Cling | 54"×150' 7mil | 54" | $295.51 | $0.44 | Gloss/Matte |
| 17 | Non-Adhesive | Clear Static Cling | 54"×150' 7mil | 54" | $285.36 | $0.42 | Gloss/Matte |
| 18 | Non-Adhesive | Clear Film | 54"×100' 5mil | 54" | $407.25 | $0.91 | Gloss/Matte |
| 19 | Non-Adhesive | Frosted Static | 1.52m×50m | 59.84" | $333.98 | $0.41 | Gloss/Matte |
| 20-23 | Banner | 13oz Frontlit Vinyl Banner | 54"/63"/98"/126"×164' | 各宽 | $738-$1722 | $0.15-$0.17 | - |
| 24-25 | Banner | 8oz Mesh Vinyl Banner | 54"/126"×164' | 各宽 | $738-$1722 | $0.22-$0.23 | - |
| 26-27 | Banner | PET Grey Back (Roll-up) 10oz FR | 36"/54"×164' | 各宽 | $492-$738 | $0.25-$0.28 | - |
| 28-32 | Banner | PET Double-Sided 15oz/18oz FR | 36"/54"/38"/126"×164' | 各宽 | $492-$1722 | $0.39 | - |

#### ⚠️ 占位符记录 (8条) — 需删除
| # | 名称 | 说明 |
|---|------|------|
| 33-40 | "New Material" ×8 | 所有字段为空/零，通过后台管理面板创建但未填写 |

#### 📝 需要 Jay 确认的3M材料成本
| 材料 | 当前状态 | 需要 |
|------|----------|------|
| Floor Graphics (3M IJ40 + 8509) | rollCost=$0, sqft=$0 | ❓ Jay提供3M报价 |
| Car Wrap Vinyl (3M IJ180) | rollCost=$0, sqft=$0 | ❓ Jay提供3M报价 |
| Concrete/Brick (3M IJ8624) | rollCost=$0, sqft=$0 | ❓ Jay提供3M报价 |

---

### 1B. 硬件/配件表 (HardwareItem) — 26条记录

| 分类 | 名称 | 价格 | 单位 |
|------|------|------|------|
| **Sign Accessory** | H-Stakes | $1.50 | per_unit |
| | Wire Stakes | $1.00 | per_unit |
| | A-Frame Stand (included) | $0.75 | included |
| | Easel Back | $0.75 | per_unit |
| | Standoff Mounts | $4.00 | per_unit |
| | Wall Spacers | $2.00 | per_unit |
| | Drilled Holes (included) | $0.00 | included |
| | Post-Mount Holes (included) | $0.00 | included |
| | Metal Frame | $12.00 | per_unit |
| | Rider Sign Clips | $1.50 | per_unit |
| | A-Frame Metal Frame Upgrade | $20.00 | per_unit |
| | A-Frame Aluminum Insert | $5.00 | per_unit |
| | A-Frame PVC Insert | $3.00 | per_unit |
| **Finishing** | Heat-Welded Hems | $0.00 | included |
| | Grommets every 2ft | $0.00 | included |
| | Pole Pockets | $0.50 | per_unit |
| | Wind Slits | $0.25 | per_unit |
| **Banner Stand** | Retractable — Standard | $0.35 | per_unit |
| | Retractable — Premium | $30.00 | per_unit |
| | Retractable — Fabric Upgrade | $5.00 | per_unit |
| | Retractable — Padded Case | $5.00 | per_unit |
| | X-Banner — Base | $0.00 | per_unit |
| | X-Banner — Premium | $8.00 | per_unit |
| | X-Banner — Fabric Upgrade | $3.00 | per_unit |
| | Tabletop — Base | $0.00 | per_unit |
| | Tabletop — Premium | $10.00 | per_unit |

#### ⚠️ 需要 Jay 确认的价格
| 项目 | 后台价格 | 问题 |
|------|----------|------|
| A-Frame Stand | $0.75 | 之前讨论过是 $50 — 这是配件加价还是总价？ |
| Retractable Stand — Standard | $0.35 | 看起来太低，是加价还是有误？ |

---

### 1C. 产品表 (Product) — 453条记录

| 分类 | 活跃 | 停用 | 合计 |
|------|------|------|------|
| banners-displays | 14 | 62 | 76 |
| canvas-prints | 12 | 1 | 13 |
| custom-stickers | 0 | 1 | 1 |
| marketing-business-print | 64 | 66 | 130 |
| signs-rigid-boards | 12 | 65 | 77 |
| stickers-labels-decals | 60 | 5 | 65 |
| vehicle-graphics-fleet | 46 | 1 | 47 |
| windows-walls-floors | 9 | 35 | 44 |
| **总计** | **217** | **236** | **453** |

> ⚠️ 236个停用产品占据数据库空间，大部分是早期迁移遗留的重复条目。建议批量清理。

---

### 1D. 定价预设 (PricingPreset) — 329条记录

| 模型 | 活跃 | 用途 |
|------|------|------|
| QTY_TIERED | 大部分 | 按数量阶梯定价 (stickers, signs, stamps) |
| QTY_OPTIONS | 若干 | 按选项组合定价 (business cards, canvas, booklets) |
| AREA_TIERED | 若干 | 按面积阶梯定价 (banners, large format) |
| COST_PLUS | 1 | 成本加成 (window/wall/floor — 共享 `window_film_costplus`) |

> ⚠️ 大量 `auto_base_*` 前缀的预设是自动生成的，多数未绑定产品且 `active=false`。建议清理。

---

## 2. 前端产品完整列表

### 2A. 带内联配置器的产品（可直接报价+加购物车）

| 产品 | URL | 材料 | 定价方式 | 配置器 |
|------|-----|------|----------|--------|
| Die-Cut Stickers | /order/die-cut | white_vinyl, clear, frosted, reflective 等11种 | 客户端 `sticker-pricing.js` | ✅ InlineConfigurator |
| Kiss-Cut Stickers | /order/kiss-cut | 同上 | 同上 | ✅ InlineConfigurator |
| Sticker Sheets | /order/sticker-sheets | paper_gloss, paper_matte 等 | 客户端 sheet pricing | ✅ SheetsConfigurator |
| Roll Labels | /order/roll-labels | BOPP, kraft, clear | 报价表单 | ✅ RollLabelsQuoteForm |
| Vinyl Lettering | /order/vinyl-lettering | outdoor, indoor, reflective | 客户端 | ✅ InlineConfigurator |
| Yard Signs | /order/yard-signs | 4mm/6mm Coroplast | 客户端 `sign-pricing.js` | ✅ SignInlineConfigurator |
| Real Estate Signs | /order/real-estate-sign | Coroplast, Aluminum | 同上 | ✅ SignInlineConfigurator |
| Election Signs | /order/election-signs | 4mm Coroplast | 同上 | ✅ SignInlineConfigurator |
| Open House Signs | /order/open-house-signs | 4mm Coroplast | 同上 | ✅ SignInlineConfigurator |
| Directional Signs | /order/directional-signs | 4mm Coroplast | 同上 | ✅ SignInlineConfigurator |
| PVC Board Signs | /order/pvc-board-signs | 3mm/6mm PVC | 同上 | ✅ SignInlineConfigurator |
| All 9 WWF Products | /order/window-films 等 | 18种材料 | API COST_PLUS | ✅ WwfInlineConfigurator |

### 2B. 订单式配置器的产品（通过 /order/ 路由）

| 产品类别 | URL | 定价方式 | 配置器 |
|----------|-----|----------|--------|
| Booklets (3种装订) | /order/booklets | API `/api/quote` | BookletOrderClient |
| NCR Forms (2/3/4联) | /order/ncr | API `/api/quote` | NcrOrderClient |
| Banners (6种) | /order/vinyl-banners 等 | API `/api/quote` | BannerOrderClient |
| Canvas (5+种) | /order/canvas-prints | API `/api/quote` | CanvasOrderClient |
| Vehicle (6种) | /order/vehicle-wraps 等 | API `/api/quote` | VehicleOrderClient |
| Marketing Print (20+种) | /order/business-cards 等 | API `/api/quote` | MarketingPrintOrderClient |

---

## 3. 交叉对比结果

### 3A. 后台材料 → 前端产品 映射

| 后台材料 | 前端对应产品 | 状态 | 建议 |
|----------|-------------|------|------|
| Regular White Vinyl (Orajet 3164) | Die-Cut/Kiss-Cut Stickers, Opaque Window Graphics | ✅ 有 | - |
| Blockout Vinyl (Permanent) | Blockout Vinyl (WWF) | ✅ 有 | - |
| Blockout Vinyl (Removable) | Blockout Vinyl (WWF) | ✅ 有 | 前端合并为一个产品 |
| Perforated Vinyl (Removable) | One-Way Vision Film | ✅ 有 | - |
| Removable White Vinyl | Wall Graphics, Wall Decals | ✅ 有 | - |
| Reflective Vinyl | Reflective Stickers, Safety Signs | ✅ 有 | - |
| Clear Vinyl | Clear Stickers, Window Graphics | ✅ 有 | - |
| Translucent Vinyl (Removable) | Transparent Color Film (WWF) | ✅ 有 | - |
| Frosted Vinyl (Etch Glass) | Frosted Window Film | ✅ 有 | - |
| Floor Graphics (3M IJ40 + 8509) | Floor Graphics (WWF) | ⚠️ 成本$0 | 需要3M报价 |
| Car Wrap Vinyl (3M IJ180) | Vehicle Wraps | ⚠️ 成本$0 | 需要3M报价 |
| Concrete/Brick (3M IJ8624) | ❌ 无前端产品 | ❌ 无产品 | 见建议 |
| Poster Paper (220gsm) | Posters | ✅ 有 | - |
| Canvas | Canvas Prints | ✅ 有 | - |
| Backlit Film | Backlit Poster (marketing) | ⚠️ 弱关联 | 前端有产品但未使用此材料定价 |
| White Static Cling | Static Cling (WWF) | ✅ 有 | - |
| Clear Static Cling | Static Cling (WWF) | ✅ 有 | - |
| Clear Film | ❌ 无前端产品 | ❌ 无产品 | 见建议 |
| Frosted Static | Static Cling (WWF) 的子选项 | ✅ 有 | - |
| 13oz Frontlit Banner (4种卷宽) | Vinyl Banners | ✅ 有 | - |
| 8oz Mesh Banner (2种卷宽) | Mesh Banners | ✅ 有 | - |
| PET Grey Back 10oz FR | Roll-Up Banners | ✅ 有 | - |
| PET Double-Sided 15oz/18oz | Double-Sided Banners | ✅ 有 | - |

#### 后台有材料但前端无产品 — 建议

| 材料 | 建议产品名 | 分类 | URL | 目标客户 | 是否值得做 |
|------|-----------|------|-----|----------|-----------|
| Concrete/Brick (3M IJ8624) | Concrete & Brick Graphics | windows-walls-floors | /order/concrete-graphics | 商业地产、建筑工地 | ⚠️ 小众市场，可作为"报价产品" |
| Clear Film (54"×100') | Clear Window Film | windows-walls-floors | /order/clear-window-film | 商铺橱窗保护 | ⚠️ 需确认使用场景 |
| Backlit Film | Backlit Display Prints | banners-displays | /order/backlit-prints | 灯箱广告 | ✅ 有市场需求 |

### 3B. 前端产品 → 后台材料 映射

| 前端产品 | 后台材料 | 成本$/sqft | 状态 |
|----------|---------|-----------|------|
| Die-Cut Stickers (White Vinyl) | Regular White Vinyl (Orajet 3164) | $0.32 | ✅ |
| Die-Cut Stickers (Clear) | Clear Vinyl | $0.43 | ✅ |
| Die-Cut Stickers (Frosted) | Frosted Vinyl (Etch Glass) | $0.69 | ✅ |
| Die-Cut Stickers (Reflective) | Reflective Vinyl | $0.40 | ✅ |
| Die-Cut Stickers (Matte) | Regular White Vinyl + Matte Lam | $0.32 + lam | ✅ |
| **Holographic Stickers** | ❌ 无后台材料 | ??? | 🔴 需要材料成本 |
| **Foil Stickers** | ❌ 无后台材料 | ??? | 🔴 需要材料成本 |
| **Kraft Paper Labels** | ❌ 无后台材料 | ??? | 🔴 需要材料成本 |
| **Paper Gloss/Matte/Soft Touch** | ❌ 仅有 Poster Paper | ??? | 🔴 贴纸用纸 ≠ 海报纸 |
| Vinyl Banners (13oz) | 13oz Frontlit Vinyl Banner | $0.15-$0.17 | ✅ |
| Mesh Banners (8oz) | 8oz Mesh Vinyl Banner | $0.22-$0.23 | ✅ |
| Roll-Up Banners | PET Grey Back 10oz FR | $0.25-$0.28 | ✅ |
| Canvas Prints | Canvas (22mil) | $0.56 | ✅ |
| Posters | Poster Paper (220gsm) | $0.34 | ✅ |
| One-Way Vision | Perforated Vinyl | $0.42 | ✅ |
| Frosted Window Film | Frosted Vinyl (Etch Glass) | $0.69 | ✅ |
| Static Cling | Clear/White/Frosted Static | $0.41-$0.44 | ✅ |
| Wall Graphics | Removable White Vinyl | $0.30 | ✅ |
| Floor Graphics | 3M IJ40 + 8509 | ⚠️ $0 | 🔴 需3M报价 |
| **Coroplast Signs** | ❌ 无后台材料 | ??? | 🟡 板材非卷材，需不同计价模式 |
| **PVC/Sintra Signs** | ❌ 无后台材料 | ??? | 🟡 同上 |
| **Foam Board** | ❌ 无后台材料 | ??? | 🟡 同上 |
| **Aluminum Signs** | ❌ 无后台材料 | ??? | 🟡 同上 |
| **Acrylic Signs** | ❌ 无后台材料 | ??? | 🟡 同上 |
| **Business Cards (8种纸)** | ❌ 无后台材料 | ??? | 🟡 外发/成品采购 |
| **NCR Forms** | ❌ 无后台材料 | ??? | 🟡 外发 |
| **Booklets** | ❌ 无后台材料 | ??? | 🟡 外发 |

### 3C. 价格一致性检查

#### 贴纸定价（客户端 vs 后台）

| 材料 | 前端乘数(sticker-pricing.js) | 后台材料成本 | 一致性 |
|------|----------------------------|-------------|--------|
| white_vinyl | 1.00 (基准) | $0.32/sqft | 前端不直接用后台成本，独立体系 |
| matte_vinyl | 1.00 | $0.32 + matte lam | ✅ 合理 |
| clear_vinyl | 1.11 (+11%) | $0.43/sqft (+34% vs white) | ⚠️ 后台成本差34%，前端只加11% |
| frosted_vinyl | 1.32 (+32%) | $0.69/sqft (+116% vs white) | ⚠️ 后台成本差116%，前端只加32% |
| reflective_3m | 1.12 (+12%) | $0.40/sqft (+25% vs white) | ⚠️ 后台成本差25%，前端只加12% |
| static_cling | 1.08 (+8%) | $0.42-$0.44/sqft (+31-38%) | ⚠️ 后台成本差31%，前端只加8% |

> **⚠️ 重大发现**: 贴纸配置器的材料加价百分比与后台实际材料成本差异不一致。前端 `MATERIAL_MULTIPLIER` 是硬编码的估算值，不是基于后台真实成本计算的。
>
> **影响**: frosted_vinyl 成本是 white 的2.16倍，但前端只收1.32倍的价格 — **可能亏钱**。

#### WWF定价（COST_PLUS模型）

WWF产品使用 `window_film_costplus` 共享预设，材料成本来自后台，定价公式：
```
price = roundTo99((material + ink + (labor+cutting)×qtyEff) × (1+waste) × markup + fileFee)
```
**✅ 这类产品的定价与后台材料成本保持一致。**

#### Signs定价（客户端硬编码）

Signs配置器使用 `sign-pricing.js` 中的硬编码参考价，不读取后台数据。
| 材料 | 前端参考价 | 后台材料数据 |
|------|-----------|-------------|
| 4mm Coroplast | 基准 ($28 ref) | ❌ 后台无板材成本 |
| 6mm Coroplast | ×1.25 | ❌ 后台无 |
| 3mm PVC | ×1.40 | ❌ 后台无 |
| 6mm PVC | ×1.75 | ❌ 后台无 |
| Aluminum .040 | ×2.50 | ❌ 后台无 |
| Aluminum .063 | ×3.00 | ❌ 后台无 |

> **⚠️ Signs的材料成本完全硬编码在前端，后台没有对应的板材(sheet)成本数据。**

---

## 4. 缺失数据清单

### 4A. 后台需要补录的材料

#### 贴纸专用材料（前端有，后台无）
| 材料 | 用于 | 需要的数据 |
|------|------|-----------|
| Holographic Vinyl | 全息贴纸 | 卷规格、成本$/sqft |
| Foil Vinyl (Gold/Silver) | 箔膜贴纸 | 卷规格、成本$/sqft |
| Kraft Paper (label grade) | 牛皮纸标签 | 卷规格、成本$/sqft |
| Paper Gloss (sticker grade) | 光面纸贴纸 | 张规格、成本$/sheet |
| Paper Matte (sticker grade) | 哑面纸贴纸 | 张规格、成本$/sheet |
| Paper Soft Touch | 软触感纸贴纸 | 张规格、成本$/sheet |
| BOPP White (label grade) | 防水白标签 | 卷规格、成本$/sqft |
| BOPP Clear (label grade) | 防水透明标签 | 卷规格、成本$/sqft |
| Silver Metallic (label) | 金属银标签 | 卷规格、成本$/sqft |

#### 板材/硬质材料（Signs类）
| 材料 | 用于 | 需要的数据 |
|------|------|-----------|
| Coroplast 4mm (4×8 sheet) | Yard Signs, Election Signs | 张价格 |
| Coroplast 6mm (4×8 sheet) | Heavy-duty signs | 张价格 |
| PVC/Sintra 3mm (4×8 sheet) | Indoor signs | 张价格 |
| PVC/Sintra 6mm (4×8 sheet) | Durable signs | 张价格 |
| Aluminum .040 (4×8 sheet) | 铝板标牌 | 张价格 |
| Aluminum .063 (4×8 sheet) | 厚铝板标牌 | 张价格 |
| ACM/Dibond (4×8 sheet) | 铝塑板 | 张价格 |
| Foam Board 3/16" (4×8 sheet) | 泡沫板 | 张价格 |
| Foam Board 1/2" (4×8 sheet) | 厚泡沫板 | 张价格 |
| Gatorboard (4×8 sheet) | 高强度泡沫板 | 张价格 |
| Acrylic Clear 3mm | 亚克力标牌 | 张价格 |
| Acrylic Frosted 3mm | 磨砂亚克力 | 张价格 |
| Magnetic Vinyl 30mil | 磁性车贴 | 卷规格、$/sqft |

### 4B. 后台需要补录的加工选项

#### Vinyl裁切相关
| 加工 | 后台状态 | 需要 |
|------|----------|------|
| Transfer Tape / Application Tape | ❌ 无 | $/sqft 材料成本 |
| 排废人工 (weeding) | ❌ 无 | $/sqft 或 $/hour |
| Cut Vinyl Lettering 裁字 | ❌ 无 | 工艺成本（不印刷，只切字） |

#### 纸质加工
| 加工 | 后台状态 | 需要 |
|------|----------|------|
| 覆膜 — 光膜 (Gloss Lamination) | ❌ 无 | $/sqft |
| 覆膜 — 哑膜 (Matte Lamination) | ❌ 无 | $/sqft |
| UV局部上光 (Spot UV) | ❌ 无 | $/sqft 或 $/张 |
| 烫金/烫银 (Hot Foil) | ❌ 无 | $/sqft 或 $/张 + 版费 |
| 压纹/击凸 (Embossing) | ❌ 无 | $/张 + 版费 |
| 模切 (Die Cut) | ❌ 无 | 版费 + $/张 |
| 折页 (Folding) | ❌ 无 | $/折 |
| 压线/折痕 (Scoring) | ❌ 无 | $/线 |
| 钻孔/打孔 (Hole Punch) | ❌ 无 | $/孔 |
| 圆角 (Rounded Corners) | ❌ 无 | $/角 或 免费？ |

#### 书籍装订
| 装订方式 | 后台状态 | 需要 |
|----------|----------|------|
| 骑马钉 (Saddle Stitch) | ❌ 无专项 | $/本（基于页数） |
| 胶装 (Perfect Binding) | ❌ 无专项 | $/本 |
| 线圈装 (Wire-O / Coil) | ❌ 无专项 | $/本 |
| 精装 (Hardcover) | ❌ 无 | $/本 |
| 活页装 | ❌ 无 | $/本 |

> 注：当前 booklets 使用 `QTY_OPTIONS` 预设，成本硬编码在预设配置中，不是从独立的加工成本表计算的。

#### Banner加工
| 加工 | 后台状态 | 价格 |
|------|----------|------|
| Heat-Welded Hems | ✅ HardwareItem | $0.00 (included) |
| Grommets every 2ft | ✅ HardwareItem | $0.00 (included) |
| Pole Pockets | ✅ HardwareItem | $0.50/unit |
| Wind Slits | ✅ HardwareItem | $0.25/unit |

#### 标签特殊加工
| 加工 | 后台状态 | 需要 |
|------|----------|------|
| 防水覆膜 | ❓ 含在BOPP材料价里？ | Jay确认 |
| 防油覆膜 | ❌ 无 | $/sqft |
| 耐高温标签 | ❌ 无 | 材料差价 |
| 冷冻标签 (Freezer) | ✅ 有产品但无专用材料 | Jay确认用什么材料 |
| 可移除胶 | ✅ Removable White Vinyl | $0.30/sqft |

#### Signs加工
| 加工 | 后台状态 | 价格 | 问题 |
|------|----------|------|------|
| H-Stakes | ✅ HardwareItem | $1.50 | 前端 sign-order-config 也定义了$1.50 ✅ |
| Wire Stakes | ✅ HardwareItem | $1.00 | 前端 $1.00 ✅ |
| A-Frame Stand | ✅ HardwareItem | $0.75 | ⚠️ $0.75 是加价还是总价？前端产品 $149 |
| Standoff Mounts | ✅ HardwareItem | $4.00 | ✅ |
| 板材切割异形 | ❌ 无 | 版费 + 加工费 |
| 双面印刷 | 前端hardcode ×1.5 | N/A | ❌ 后台无记录 |

### 4C. Marketing & Business Print 加工

当前状态：大部分产品使用 `QTY_OPTIONS` 或 `QTY_TIERED` 预设定价，成本结构嵌入在预设 JSON 配置中，不是从材料表+加工表计算的。

| 产品 | 纸张 | 加工 | 定价来源 | 问题 |
|------|------|------|----------|------|
| Business Cards (8种) | 14pt-32pt | 各种涂层 | `business_cards_premium` 预设 | ✅ 预设有详细选项 |
| Flyers | 未指定 | - | `batch1_flyers_standard` 预设 | ⚠️ 纸张成本不明 |
| Postcards | 14pt card | - | `batch1_postcards_standard` 预设 | ⚠️ 纸张成本不明 |
| Booklets | 未指定 | 骑马钉/胶装/线圈 | `cmln5cud7` 预设 | ⚠️ 装订成本嵌入 |
| NCR Forms | NCR paper | 2/3/4联 | 各自预设 | ⚠️ NCR纸成本不明 |
| Brochures | 未指定 | 折页 | 各自预设 | ⚠️ 折页成本不明 |
| Posters (4种) | Poster Paper/Adhesive/Backlit | - | 各自预设 | ⚠️ 只有poster paper有后台成本 |

> **问题**: 这些产品是自己印还是外发？如果外发，成本结构完全不同——应该按供应商报价 + 利润率来定。

---

## 5. 建议新增产品

基于后台有材料但前端无对应产品：

| 材料 | 建议产品名 | 分类 | URL | 优先级 | 理由 |
|------|-----------|------|-----|--------|------|
| Backlit Film | Lightbox Prints / 灯箱片 | banners-displays | /order/backlit-prints | 🟡 中 | 商业客户需求，材料已有成本数据 |
| Clear Film | Clear Window Film | windows-walls-floors | /order/clear-film | 🔵 低 | 小众需求，需确认使用场景 |
| Concrete/Brick (3M) | Outdoor Surface Graphics | windows-walls-floors | /order/surface-graphics | 🔵 低 | 特殊工程项目，按报价处理 |

---

## 6. 需要 Jay 确认的问题

### 🔴 紧急（影响定价准确性）

1. **贴纸材料加价百分比是否正确？**
   - frosted_vinyl 后台成本是 white 的2.16倍，但前端只收1.32倍
   - clear_vinyl 后台成本差34%，前端只加11%
   - 是否需要按实际成本调整乘数？

2. **3M材料成本**（Floor Graphics, Car Wrap, Concrete/Brick）
   - 后台记录全是 $0
   - 需要3M的实际报价才能设定正确价格

3. **A-Frame Stand 价格**
   - HardwareItem 记录 $0.75
   - 前端产品页 basePrice=$149
   - 哪个是对的？$0.75 是每个配件加价？总价$149对吗？

4. **Retractable Stand Standard 价格 $0.35**
   - 看起来太低，应该是 $35？

### 🟡 重要（影响利润率）

5. **Marketing Print 是自己印还是外发？**
   - Business Cards, Flyers, Postcards, Booklets, NCR 等
   - 如果外发，需要供应商报价来设定利润
   - 如果自印，需要纸张+油墨+加工各环节成本

6. **板材(sheet)成本**
   - Coroplast 4mm/6mm
   - PVC/Sintra 3mm/6mm
   - Aluminum .040/.063
   - Foam Board 3/16"/1/2"
   - 目前 Signs 定价完全硬编码，不基于实际成本

7. **Holographic / Foil / Kraft 材料成本**
   - 前端有这些贴纸产品但后台没有材料数据
   - 需要卷规格和成本

### 🔵 建议（提升运营效率）

8. **是否清理236个停用产品和大量遗留预设？**
   - 减少数据库负担，降低混淆

9. **是否需要给所有453个产品设置 `displayFromPrice`？**
   - 目前全部为空，分类页无法显示起步价
   - 需要逐一计算或批量设定

10. **标签特殊加工（防水/防油/耐高温/冷冻）是包含在材料价里还是额外收费？**

---

## 7. 行动优先级

| 优先级 | 行动 | 影响 |
|--------|------|------|
| P0 | 修复18个无定价预设的活跃产品 | 这些产品无法正确报价 |
| P0 | 修复8个 basePrice=$0 的活跃产品 | 白送 |
| P1 | 补齐贴纸材料加价百分比 | 可能在亏钱卖 frosted/clear |
| P1 | 录入3M材料成本 | Floor/Vehicle 产品无法成本核算 |
| P1 | 录入板材成本 | Signs 产品无法成本核算 |
| P2 | 设定 displayFromPrice | 分类页用户体验 |
| P2 | 补录加工选项到后台 | 精细化成本管控 |
| P3 | 清理停用产品和遗留预设 | 数据库卫生 |
| P3 | 补录贴纸专用材料 | holographic/foil/kraft |

---

*报告结束。所有数据原样导出，未做任何修改。等待 Jay 确认后再执行修复。*
