# LunarPrint 系统化建设路线图 v1

Created: 2026-03-07

---

## 1. 当前已有能力

| 能力 | 状态 | 文件 |
|------|------|------|
| 共享配置器组件 | ✅ 完备 | StepCard, OptionCard, OptionGrid, QuantityScroller |
| 定价引擎 (template) | ✅ 6 模板运行中 | lib/pricing/templates.js, template-resolver.js |
| 定价引擎 (preset) | ✅ 名片专用 | PricingPreset model, DB-based tiers |
| 购物车 + Stripe 结账 | ✅ | lib/store.js, useConfiguratorCart |
| 手机底栏 CTA | ✅ | MobileBottomBar.js |
| 桌面定价侧栏 | ✅ | PricingSidebar.js (含 DeliveryEstimate) |
| 交期预估 | ✅ | DeliveryEstimate.js (品类生产天数 + 运输) |
| 邮件报价 | ✅ | EmailQuotePopover.js |
| 文件上传 + DPI 检查 | ✅ | ArtworkUpload.js |
| FAQ 系统 | ✅ 部分 | configurator-faqs.js (非所有产品有) |
| SEO/Schema | ✅ | sitemap, robots, OG, Product/Breadcrumb schema |
| i18n 双语 | ✅ | en/zh JSON + useTranslation |
| 10 种配置器 | ✅ | configurator-router.js 分发 |

## 2. 缺口

| 缺口 | 影响 | 修复方式 |
|------|------|---------|
| Posters 无 FAQ | 转化率 | 代码: configurator-faqs.js |
| Flyers/Postcards FAQ 太少 (各 3 条) | 转化率 | 代码: 补到 5-6 条 |
| Artwork 步骤是折叠式(需点击展开) | 手机体验 | 代码: 改为 alwaysOpen |
| 28 个产品缺真实照片 | 信任感 | Jay 提供照片 |
| 分类页封面图是渐变色 | 品牌感 | Jay 提供设计/照片 |
| 无案例展示 / recent projects | 社会证明 | Jay 提供项目照片 |
| Proof 审批流只有说明页，无实际系统 | 生产闭环 | Phase 3 开发 |

## 3. 三套系统分析

### A. 标准印刷系统

**产品**: business cards (9), flyers, postcards, posters, notepads + brochures, menus, letterheads, envelopes, etc.

**已有**:
- BusinessCardConfigurator — 专用，成熟
- MarketingPrintOrderClient — 共享，55 种产品类型配置
- 步骤已 compact+alwaysOpen (Size/Qty/Paper/Sides/Finishing/Extras)
- PricingPreset (名片) + paper_print template (其余)

**缺口**:
- Artwork 步骤需点击展开 → 改 alwaysOpen
- Posters 无 FAQ
- Flyers/Postcards FAQ 太少
- 无 "常见用途" 提示卡片

### B. 个性化/上传型系统

**产品**: stamps (3 preset + generic), die-cut stickers, kiss-cut stickers, roll labels, sticker sheets

**已有**:
- StampOrderClient — 专用，有 preset 机制
- Sticker configurators — 独立组件
- Roll labels configurator
- Halftone upload (stamps)

**缺口**:
- Proof/contour 预览流程不存在
- 上传 → 确认 → 下单 → 后台 闭环不完整
- Stamps 商品化刚开始 (step 1.1 done)

### C. 大幅/标牌系统

**产品**: banners, signs, canvas, vehicle, surface graphics

**已有**:
- 各自独立 OrderClient
- 尺寸逻辑 (in/sqft pricing)
- 配件系统 (grommets, stands, etc.)

**缺口**:
- in/cm 切换不统一
- 材料说明不够清楚 (对客户)
- 大幅公式验证不足

## 4. 复用层

| 层 | 组件 | 复用范围 |
|----|------|---------|
| UI 基础 | StepCard, OptionCard, OptionGrid, QuantityScroller | 全部配置器 |
| 定价展示 | PricingSidebar, MobileBottomBar | 全部配置器 |
| 定价引擎 | useConfiguratorPrice + /api/pricing/calculate | 全部产品 |
| 购物车 | useConfiguratorCart + store.js | 全站 |
| 交期 | DeliveryEstimate | 全部配置器 |
| FAQ | FaqAccordion + configurator-faqs.js | 全部配置器 |
| 文件上传 | ArtworkUpload + StampHalftoneUpload | 需上传的产品 |
| Hero | ConfigHero | 全部配置器 |
| Gallery | ConfigProductGallery | 全部配置器 |

## 5. 高 ROI 优先级

| 优先级 | 页面/系统 | ROI 原因 |
|--------|----------|---------|
| P1 | Flyers/Postcards 配置器 | 广告投放后最高流量产品 |
| P1 | Business Cards 配置器 | 已有 9 个页面，流量已在 |
| P1 | Posters 配置器 | 自定义尺寸 = 高客单价 |
| P2 | Stamps 商品化 | 差异化产品，竞争少 |
| P2 | Stickers proof 闭环 | 复购率最高的品类 |
| P3 | Banners/Signs 统一 | 大客户/B2B 渠道 |
| P3 | Vehicle wraps | 高客单价但低频 |

## 6. 代码修 vs Jay 提供

### 代码修 (Claude Code)
1. Artwork 步骤改 alwaysOpen (MarketingPrintOrderClient)
2. Posters FAQ 补充
3. Flyers/Postcards FAQ 扩充
4. Stamps 商品化后续
5. Proof 预览系统开发

### Jay 提供
1. 28 个产品的真实产品照片
2. 分类页封面设计/照片
3. 案例展示项目照片
4. Vercel CRON_SECRET 环境变量
5. 运行 seed scripts (sample packs)
6. 确认 Vercel Git 连接修复

## 7. 未来 3 个月执行顺序

### Month 1 — 标准印刷收口 + 印章商品化

**Milestone 1: 标准印刷系统收口** (本周)
- [x] 路线图 v1
- [ ] Artwork 步骤 alwaysOpen
- [ ] Posters FAQ (5 条)
- [ ] Flyers FAQ 扩充 (3→6 条)
- [ ] Postcards FAQ 扩充 (3→6 条)
- [ ] Build 验证

**Milestone 2: 印章产品线商品化** (下周)
- [ ] Stamps 入口页多宫格展示
- [ ] 四宫格用途卡片
- [ ] 主题商品页完善
- [ ] 上传优先流程测试

### Month 2 — 贴纸/Proof 闭环

**Milestone 3: 贴纸生产闭环**
- [ ] Contour/proof 预览组件
- [ ] 上传 → 确认 → 下单流程
- [ ] 后台订单视图增强

**Milestone 4: 信任感提升**
- [ ] 产品真实照片替换 (需 Jay 提供)
- [ ] 案例展示页面 (需 Jay 提供)
- [ ] 分类页封面升级 (需 Jay 提供)

### Month 3 — 大幅/标牌统一 + 运营工具

**Milestone 5: 大幅系统统一**
- [ ] in/cm 切换标准化
- [ ] 材料说明卡片
- [ ] 定价公式验证

**Milestone 6: 运营工具**
- [ ] 后台订单管理增强
- [ ] 弃购邮件优化
- [ ] Analytics 仪表板
