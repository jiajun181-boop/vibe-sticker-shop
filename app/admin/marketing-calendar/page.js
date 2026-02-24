"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const HOLIDAYS = [
  // January
  { month: 1, day: 1, nameEn: "New Year's Day", nameZh: "新年", products: ["banners", "stickers", "posters"], stockWeeks: 3, adWeeks: 2 },
  { month: 2, day: null, nameEn: "Family Day", nameZh: "家庭日", note: "3rd Monday of February", getDate: (y) => nthWeekday(y, 2, 1, 3), products: ["signs", "banners"], stockWeeks: 3, adWeeks: 2 },
  // February
  { month: 2, day: 14, nameEn: "Valentine's Day", nameZh: "情人节", products: ["stickers", "cards", "posters", "packaging"], stockWeeks: 4, adWeeks: 3 },
  { month: 2, day: null, nameEn: "Chinese New Year", nameZh: "春节", note: "Lunar calendar, late Jan – mid Feb", getDate: () => null, products: ["banners", "stickers", "posters", "window-films"], stockWeeks: 4, adWeeks: 3 },
  // March
  { month: 3, day: 17, nameEn: "St. Patrick's Day", nameZh: "圣帕特里克节", products: ["stickers", "banners", "posters"], stockWeeks: 3, adWeeks: 2 },
  { month: 3, day: 8, nameEn: "International Women's Day", nameZh: "国际妇女节", products: ["cards", "posters", "stickers"], stockWeeks: 3, adWeeks: 2 },
  // April
  { month: 4, day: null, nameEn: "Easter", nameZh: "复活节", note: "Varies, typically April", getDate: (y) => easterDate(y), products: ["stickers", "banners", "packaging", "signs"], stockWeeks: 4, adWeeks: 3 },
  { month: 4, day: 22, nameEn: "Earth Day", nameZh: "地球日", products: ["stickers", "signs", "banners"], stockWeeks: 3, adWeeks: 2 },
  // May
  { month: 5, day: null, nameEn: "Mother's Day", nameZh: "母亲节", note: "2nd Sunday of May", getDate: (y) => nthWeekday(y, 5, 0, 2), products: ["cards", "canvas", "stickers", "packaging"], stockWeeks: 4, adWeeks: 3 },
  { month: 5, day: null, nameEn: "Victoria Day", nameZh: "维多利亚日", note: "Monday before May 25", getDate: (y) => victoriaDay(y), products: ["banners", "signs", "flags"], stockWeeks: 3, adWeeks: 2 },
  // June
  { month: 6, day: null, nameEn: "Father's Day", nameZh: "父亲节", note: "3rd Sunday of June", getDate: (y) => nthWeekday(y, 6, 0, 3), products: ["cards", "canvas", "stickers"], stockWeeks: 4, adWeeks: 3 },
  { month: 6, day: 1, nameEn: "Pride Month", nameZh: "骄傲月", note: "All of June", products: ["stickers", "banners", "signs", "flags"], stockWeeks: 4, adWeeks: 3 },
  { month: 6, day: 21, nameEn: "National Indigenous Peoples Day", nameZh: "全国原住民日", products: ["banners", "signs", "stickers"], stockWeeks: 3, adWeeks: 2 },
  // July
  { month: 7, day: 1, nameEn: "Canada Day", nameZh: "国庆节", products: ["banners", "flags", "stickers", "signs", "vehicle-decals"], stockWeeks: 4, adWeeks: 3 },
  // August
  { month: 8, day: null, nameEn: "Civic Holiday", nameZh: "公民假日", note: "1st Monday of August", getDate: (y) => nthWeekday(y, 8, 1, 1), products: ["banners", "signs"], stockWeeks: 3, adWeeks: 2 },
  { month: 8, day: 15, nameEn: "Back to School Season", nameZh: "返校季", note: "Mid-August start", products: ["stickers", "labels", "banners", "signs"], stockWeeks: 4, adWeeks: 3 },
  // September
  { month: 9, day: null, nameEn: "Labour Day", nameZh: "劳动节", note: "1st Monday of September", getDate: (y) => nthWeekday(y, 9, 1, 1), products: ["banners", "signs"], stockWeeks: 3, adWeeks: 2 },
  { month: 9, day: null, nameEn: "Mid-Autumn Festival", nameZh: "中秋节", note: "Lunar calendar, Sep/Oct", getDate: () => null, products: ["stickers", "packaging", "cards"], stockWeeks: 3, adWeeks: 2 },
  // October
  { month: 10, day: null, nameEn: "Thanksgiving", nameZh: "感恩节", note: "2nd Monday of October", getDate: (y) => nthWeekday(y, 10, 1, 2), products: ["banners", "stickers", "cards", "posters"], stockWeeks: 4, adWeeks: 3 },
  { month: 10, day: 31, nameEn: "Halloween", nameZh: "万圣节", products: ["stickers", "banners", "signs", "window-films", "packaging"], stockWeeks: 4, adWeeks: 3 },
  // November
  { month: 11, day: 11, nameEn: "Remembrance Day", nameZh: "阵亡将士纪念日", products: ["stickers", "signs", "banners"], stockWeeks: 3, adWeeks: 2 },
  { month: 11, day: null, nameEn: "Black Friday", nameZh: "黑色星期五", note: "4th Friday of November", getDate: (y) => blackFriday(y), products: ["banners", "signs", "stickers", "posters", "window-films"], stockWeeks: 4, adWeeks: 3 },
  { month: 11, day: null, nameEn: "Small Business Saturday", nameZh: "小企业星期六", note: "Day after Black Friday", getDate: (y) => { const bf = blackFriday(y); return bf ? new Date(bf.getTime() + 86400000) : null; }, products: ["stickers", "signs", "banners", "cards"], stockWeeks: 3, adWeeks: 2 },
  // December
  { month: 12, day: 25, nameEn: "Christmas", nameZh: "圣诞节", products: ["stickers", "cards", "banners", "signs", "packaging", "canvas", "window-films"], stockWeeks: 4, adWeeks: 3 },
  { month: 12, day: 26, nameEn: "Boxing Day", nameZh: "节礼日", products: ["banners", "signs", "stickers", "posters"], stockWeeks: 3, adWeeks: 2 },
  { month: 12, day: null, nameEn: "Hanukkah", nameZh: "光明节", note: "Varies, Nov/Dec", getDate: () => null, products: ["stickers", "cards", "banners"], stockWeeks: 3, adWeeks: 2 },
];

// Date helpers
function nthWeekday(year, month, dayOfWeek, nth) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  for (let i = 1; i <= 31; i++) {
    d.setDate(i);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === dayOfWeek) {
      count++;
      if (count === nth) return new Date(d);
    }
  }
  return null;
}

function victoriaDay(year) {
  // Monday before May 25
  for (let d = 24; d >= 18; d--) {
    const dt = new Date(year, 4, d);
    if (dt.getDay() === 1) return dt;
  }
  return new Date(year, 4, 24);
}

function blackFriday(year) {
  // 4th Thursday of November + 1
  const thurs = nthWeekday(year, 11, 4, 4);
  return thurs ? new Date(thurs.getTime() + 86400000) : null;
}

function easterDate(year) {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const PRODUCT_LABELS = {
  banners: "Banners / 横幅",
  stickers: "Stickers / 贴纸",
  signs: "Signs / 标牌",
  canvas: "Canvas / 帆布画",
  cards: "Cards / 卡片",
  posters: "Posters / 海报",
  packaging: "Packaging / 包装",
  flags: "Flags / 旗帜",
  labels: "Labels / 标签",
  "window-films": "Window Films / 窗贴",
  "vehicle-decals": "Vehicle Decals / 车贴",
};

const PRODUCT_COLORS = {
  banners: "bg-blue-100 text-blue-700",
  stickers: "bg-emerald-100 text-emerald-700",
  signs: "bg-amber-100 text-amber-700",
  canvas: "bg-purple-100 text-purple-700",
  cards: "bg-pink-100 text-pink-700",
  posters: "bg-indigo-100 text-indigo-700",
  packaging: "bg-orange-100 text-orange-700",
  flags: "bg-red-100 text-red-700",
  labels: "bg-teal-100 text-teal-700",
  "window-films": "bg-cyan-100 text-cyan-700",
  "vehicle-decals": "bg-slate-100 text-slate-700",
};

const MONTHS = [
  "January / 一月", "February / 二月", "March / 三月", "April / 四月",
  "May / 五月", "June / 六月", "July / 七月", "August / 八月",
  "September / 九月", "October / 十月", "November / 十一月", "December / 十二月",
];

function getHolidayDate(h, year) {
  if (h.day) return new Date(year, h.month - 1, h.day);
  if (h.getDate) return h.getDate(year);
  return null;
}

function formatDate(d) {
  if (!d) return "Varies";
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function daysBetween(a, b) {
  return Math.ceil((b - a) / 86400000);
}

export default function MarketingCalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [expanded, setExpanded] = useState(new Set());
  const [statusMap, setStatusMap] = useState({});

  const toggle = (key) => {
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const setStatus = (key, status) => {
    setStatusMap((prev) => ({ ...prev, [key]: status }));
  };

  const enriched = useMemo(() => {
    return HOLIDAYS.map((h, idx) => {
      const key = `${h.month}-${idx}`;
      const date = getHolidayDate(h, year);
      const daysUntil = date ? daysBetween(now, date) : null;
      const stockDate = date ? new Date(date.getTime() - h.stockWeeks * 7 * 86400000) : null;
      const adDate = date ? new Date(date.getTime() - h.adWeeks * 7 * 86400000) : null;
      const isPast = date ? date < now : h.month < currentMonth;
      const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;
      return { ...h, key, date, daysUntil, stockDate, adDate, isPast, isUpcoming };
    });
  }, [year, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const upcoming = enriched.filter((h) => h.isUpcoming);
  const byMonth = useMemo(() => {
    const map = {};
    for (const h of enriched) {
      if (!map[h.month]) map[h.month] = [];
      map[h.month].push(h);
    }
    return map;
  }, [enriched]);

  const STATUS_OPTIONS = [
    { value: "preparing", label: "Preparing / 准备中", cls: "bg-amber-100 text-amber-800 border-amber-300" },
    { value: "stocked", label: "Stocked / 已备货", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { value: "live", label: "Ads Live / 已上线", cls: "bg-blue-100 text-blue-800 border-blue-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Calendar / 营销日历</h1>
          <p className="mt-1 text-sm text-gray-500">
            Canadian marketing holidays with prep timelines and product recommendations.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{year}</span>
      </div>

      {/* Upcoming holidays alert */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Upcoming in 30 days / 30天内即将到来
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((h) => (
              <div key={h.key} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-900">
                  {h.daysUntil}d
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{h.nameEn}</p>
                  <p className="text-xs text-gray-500">{h.nameZh} &middot; {formatDate(h.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline by month */}
      <div className="space-y-6">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const holidays = byMonth[m] || [];
          if (holidays.length === 0) return null;
          const isCurrent = m === currentMonth;
          const isPastMonth = m < currentMonth;

          return (
            <div
              key={m}
              id={`month-${m}`}
              className={`rounded-xl border-2 transition-colors ${
                isCurrent
                  ? "border-blue-400 bg-blue-50/50 shadow-md"
                  : isPastMonth
                    ? "border-gray-200 bg-gray-50/50"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                  isCurrent ? "bg-blue-500 text-white" : isPastMonth ? "bg-gray-300 text-gray-600" : "bg-gray-200 text-gray-700"
                }`}>
                  {m}
                </span>
                <h3 className={`text-base font-semibold ${isPastMonth ? "text-gray-400" : "text-gray-900"}`}>
                  {MONTHS[m - 1]}
                </h3>
                {isCurrent && (
                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Current
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{holidays.length} holidays</span>
              </div>

              <div className="divide-y divide-gray-100">
                {holidays.map((h) => {
                  const isOpen = expanded.has(h.key);
                  const status = statusMap[h.key];

                  return (
                    <div key={h.key} className={h.isPast ? "opacity-50" : ""}>
                      <button
                        type="button"
                        onClick={() => toggle(h.key)}
                        className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{h.nameEn}</span>
                            <span className="text-xs text-gray-400">{h.nameZh}</span>
                            {h.isUpcoming && !h.isPast && (
                              <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                {h.daysUntil}d away
                              </span>
                            )}
                            {status && (
                              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_OPTIONS.find((s) => s.value === status)?.cls || ""}`}>
                                {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatDate(h.date)}
                            {h.note ? ` — ${h.note}` : ""}
                          </p>
                        </div>
                        <div className="hidden flex-wrap gap-1 sm:flex">
                          {h.products.slice(0, 3).map((p) => (
                            <span key={p} className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${PRODUCT_COLORS[p] || "bg-gray-100 text-gray-600"}`}>
                              {p}
                            </span>
                          ))}
                          {h.products.length > 3 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
                              +{h.products.length - 3}
                            </span>
                          )}
                        </div>
                        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Date */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Holiday Date / 节日日期</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(h.date)}</p>
                              {h.note && <p className="text-xs text-gray-400">{h.note}</p>}
                            </div>
                            {/* Stock reminder */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stock By / 备货截止</p>
                              <p className="mt-1 text-sm font-semibold text-amber-700">
                                {h.stockDate ? formatDate(h.stockDate) : "—"}
                              </p>
                              <p className="text-xs text-gray-400">{h.stockWeeks} weeks before / {h.stockWeeks}周前</p>
                            </div>
                            {/* Ad launch */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start Ads / 开始广告</p>
                              <p className="mt-1 text-sm font-semibold text-blue-700">
                                {h.adDate ? formatDate(h.adDate) : "—"}
                              </p>
                              <p className="text-xs text-gray-400">{h.adWeeks} weeks before / {h.adWeeks}周前</p>
                            </div>
                            {/* Status */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status / 状态</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {STATUS_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(h.key, status === opt.value ? null : opt.value)}
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
                                      status === opt.value ? opt.cls : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Recommended products */}
                          <div className="mt-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recommended Products / 推荐产品</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {h.products.map((p) => (
                                <span
                                  key={p}
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRODUCT_COLORS[p] || "bg-gray-100 text-gray-600"}`}
                                >
                                  {PRODUCT_LABELS[p] || p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick month navigation */}
      <div className="sticky bottom-4 flex justify-center">
        <div className="flex gap-1 rounded-full border border-gray-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <a
              key={m}
              href={`#month-${m}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                m === currentMonth
                  ? "bg-blue-500 text-white"
                  : m < currentMonth
                    ? "text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {m}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
