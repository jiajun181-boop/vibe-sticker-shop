"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

const BAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-indigo-500",
  "bg-teal-500", "bg-pink-500", "bg-lime-500",
];

function formatCategoryName(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function CatalogPage({ embedded = false } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    if (embedded) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "catalog");
    router.replace(`/admin/catalog-ops?${params.toString()}`);
  }, [embedded, router, searchParams]);

  useEffect(() => {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = useCallback(async (config) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveMsg("success");
      const fresh = await fetch("/api/admin/catalog").then((r) => r.json());
      setData(fresh);
    } catch {
      setSaveMsg("failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        {t("admin.catalog.loading")}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        {t("admin.catalog.loadFailed")}
      </div>
    );
  }

  const { categories, mergeEdges, totals, catalogConfig } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">{t("admin.nav.catalogSettings")}</h1>

      {/* Summary Cards */}
      <SummaryCards totals={totals} t={t} />

      {/* Category Distribution */}
      <CategoryBarChart categories={categories} t={t} />

      {/* Merge Flow Diagram */}
      <MergeFlowDiagram mergeEdges={mergeEdges} categories={categories} t={t} />

      {/* Catalog Settings */}
      {catalogConfig && (
        <CatalogSettings
          catalogConfig={catalogConfig}
          allCategories={categories.map((c) => c.name)}
          onSave={handleSaveSettings}
          saving={saving}
          saveMsg={saveMsg}
          t={t}
        />
      )}

    </div>
  );
}

/* ── Summary Cards ── */
function SummaryCards({ totals, t }) {
  const cards = [
    { label: t("admin.catalog.totalProducts"), value: totals.total, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    { label: t("admin.catalog.active"), value: totals.active, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    { label: t("admin.catalog.inactive"), value: totals.inactive, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
    { label: t("admin.catalog.categories"), value: totals.categories, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${c.text}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Category Bar Chart ── */
function CategoryBarChart({ categories, t }) {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">{t("admin.catalog.distribution")}</h2>
      <div className="space-y-2.5">
        {categories.map((cat, i) => {
          const pct = (cat.count / maxCount) * 100;
          return (
            <div key={cat.name} className="flex items-center gap-3">
              <div className="w-44 shrink-0 truncate text-xs font-medium text-gray-700">
                {formatCategoryName(cat.name)}
              </div>
              <div className="flex-1 rounded-full bg-gray-100">
                <div
                  className={`${BAR_COLORS[i % BAR_COLORS.length]} h-6 rounded-full transition-all`}
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
              <div className="w-8 text-right text-xs font-bold text-gray-900">{cat.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Catalog Settings Editor ── */
function CatalogSettings({ catalogConfig, allCategories, onSave, saving, saveMsg, t }) {
  const [homepageCategories, setHomepageCategories] = useState(catalogConfig.homepageCategories || []);
  const [maxPerCategory, setMaxPerCategory] = useState(catalogConfig.maxPerCategory || 4);
  const [hiddenCategories, setHiddenCategories] = useState(new Set(catalogConfig.hiddenCategories || []));
  const [categoryMeta, setCategoryMeta] = useState(catalogConfig.categoryMeta || {});

  // Categories available to add to homepage (not already in list)
  const availableForHomepage = allCategories.filter((c) => !homepageCategories.includes(c));

  function moveUp(i) {
    if (i === 0) return;
    const arr = [...homepageCategories];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    setHomepageCategories(arr);
  }
  function moveDown(i) {
    if (i >= homepageCategories.length - 1) return;
    const arr = [...homepageCategories];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    setHomepageCategories(arr);
  }
  function removeFromHomepage(i) {
    setHomepageCategories((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addToHomepage(slug) {
    if (slug && !homepageCategories.includes(slug)) {
      setHomepageCategories((prev) => [...prev, slug]);
    }
  }

  function toggleHidden(slug) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function updateMeta(slug, field, value) {
    setCategoryMeta((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [field]: value },
    }));
  }

  function handleSave() {
    onSave({
      homepageCategories,
      maxPerCategory,
      hiddenCategories: Array.from(hiddenCategories),
      categoryMeta,
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{t("admin.catalog.settingsTitle")}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t("admin.catalog.settingsDesc")}</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-xs font-medium ${saveMsg === "success" ? "text-green-600" : "text-red-500"}`}>
              {saveMsg === "success" ? t("admin.catalog.saveSuccess") : t("admin.catalog.saveFailed")}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
          >
            {saving ? t("admin.catalog.saving") : t("admin.catalog.save")}
          </button>
        </div>
      </div>

      {/* Homepage Categories Order */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("admin.catalog.homepageCategories")}</label>
        <p className="text-xs text-gray-400 mb-2">{t("admin.catalog.homepageCategoriesDesc")}</p>
        <div className="space-y-1.5">
          {homepageCategories.map((slug, i) => (
            <div key={slug} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-800">{formatCategoryName(slug)}</span>
              <button onClick={() => moveUp(i)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Move up">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              </button>
              <button onClick={() => moveDown(i)} disabled={i >= homepageCategories.length - 1} className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Move down">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
              <button onClick={() => removeFromHomepage(i)} className="rounded p-1 text-red-400 hover:text-red-600" title="Remove">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
          ))}
        </div>
        {availableForHomepage.length > 0 && (
          <select
            className="mt-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500"
            value=""
            onChange={(e) => addToHomepage(e.target.value)}
          >
            <option value="">{t("admin.catalog.addCategory")}</option>
            {availableForHomepage.map((slug) => (
              <option key={slug} value={slug}>{formatCategoryName(slug)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Max Per Category */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("admin.catalog.maxPerCategory")}</label>
        <p className="text-xs text-gray-400 mb-2">{t("admin.catalog.maxPerCategoryDesc")}</p>
        <input
          type="number"
          min={1}
          max={12}
          value={maxPerCategory}
          onChange={(e) => setMaxPerCategory(Math.max(1, Math.min(12, Number(e.target.value) || 4)))}
          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900"
        />
      </div>

      {/* Hidden Categories */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("admin.catalog.hiddenCategories")}</label>
        <p className="text-xs text-gray-400 mb-2">{t("admin.catalog.hiddenCategoriesDesc")}</p>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories.map((slug) => (
            <label key={slug} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={hiddenCategories.has(slug)}
                onChange={() => toggleHidden(slug)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900"
              />
              <span className="text-sm text-gray-700">{formatCategoryName(slug)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Meta */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("admin.catalog.displayNames")}</label>
        <p className="text-xs text-gray-400 mb-2">{t("admin.catalog.displayNamesDesc")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{t("admin.catalog.slug")}</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{t("admin.catalog.title_col")}</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 w-20">{t("admin.catalog.icon_col")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allCategories.map((slug) => {
                const meta = categoryMeta[slug] || {};
                return (
                  <tr key={slug} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{slug}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={meta.title || ""}
                        onChange={(e) => updateMeta(slug, "title", e.target.value)}
                        placeholder={formatCategoryName(slug)}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 placeholder-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={meta.icon || ""}
                        onChange={(e) => updateMeta(slug, "icon", e.target.value)}
                        placeholder="🧩"
                        className="w-16 rounded border border-gray-200 px-2 py-1 text-center text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Merge Flow Diagram (SVG) ── */
function MergeFlowDiagram({ mergeEdges, categories, t }) {
  if (!mergeEdges || mergeEdges.length === 0) return null;

  const leftNodes = mergeEdges.map((e) => e.from);
  const rightNodes = [...new Set(mergeEdges.map((e) => e.to))];

  const countMap = {};
  for (const c of categories) countMap[c.name] = c.count;

  const svgWidth = 820;
  const nodeHeight = 34;
  const nodeGap = 14;
  const leftNodeW = 190;
  const rightNodeW = 210;
  const leftX = 10;
  const rightX = svgWidth - rightNodeW - 30;
  const svgHeight = Math.max(leftNodes.length, rightNodes.length) * (nodeHeight + nodeGap) + 20;

  function yPos(index, total) {
    if (total <= 1) return svgHeight / 2 - nodeHeight / 2;
    const totalH = total * nodeHeight + (total - 1) * nodeGap;
    const startY = (svgHeight - totalH) / 2;
    return startY + index * (nodeHeight + nodeGap);
  }

  const midX = svgWidth / 2;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">{t("admin.catalog.mergeFlow")}</h2>
      <p className="mb-3 text-xs text-gray-500">{t("admin.catalog.mergeFlowDesc")}</p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ minWidth: "600px" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Curves */}
          {mergeEdges.map((edge) => {
            const li = leftNodes.indexOf(edge.from);
            const ri = rightNodes.indexOf(edge.to);
            const y1 = yPos(li, leftNodes.length) + nodeHeight / 2;
            const y2 = yPos(ri, rightNodes.length) + nodeHeight / 2;
            const x1 = leftX + leftNodeW;
            const x2 = rightX;
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeOpacity={0.6}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Left nodes (old categories) */}
          {leftNodes.map((name, i) => {
            const y = yPos(i, leftNodes.length);
            return (
              <g key={name}>
                <rect x={leftX} y={y} width={leftNodeW} height={nodeHeight} rx={6} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} />
                <text x={leftX + leftNodeW / 2} y={y + nodeHeight / 2 + 4} textAnchor="middle" fontSize={11} fill="#92400e">
                  {formatCategoryName(name)}
                </text>
              </g>
            );
          })}

          {/* Right nodes (current categories) */}
          {rightNodes.map((name, i) => {
            const y = yPos(i, rightNodes.length);
            const count = countMap[name] || 0;
            return (
              <g key={name}>
                <rect x={rightX} y={y} width={rightNodeW} height={nodeHeight} rx={6} fill="#dbeafe" stroke="#3b82f6" strokeWidth={1} />
                <text x={rightX + rightNodeW / 2} y={y + nodeHeight / 2 + 4} textAnchor="middle" fontSize={11} fill="#1e40af">
                  {formatCategoryName(name)}
                </text>
                {/* Count badge */}
                <circle cx={rightX + rightNodeW + 18} cy={y + nodeHeight / 2} r={13} fill="#3b82f6" />
                <text x={rightX + rightNodeW + 18} y={y + nodeHeight / 2 + 4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
