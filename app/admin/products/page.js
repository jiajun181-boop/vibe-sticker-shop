"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ProductForm from "./product-form";
import { createProduct, toggleProductStatus, deleteProduct } from "./actions";
import { SUB_PRODUCT_CONFIG } from "@/lib/subProductConfig";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );
const SUBSERIES_TAG_PREFIX = "subseries:";

function titleizeSlug(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getTaggedSubseries(tags) {
  if (!Array.isArray(tags)) return null;
  const tag = tags.find(
    (t) => typeof t === "string" && t.startsWith(SUBSERIES_TAG_PREFIX)
  );
  return tag ? tag.slice(SUBSERIES_TAG_PREFIX.length) : null;
}

function buildNextSubseriesTags(tags, targetSubseriesSlug) {
  const cleaned = Array.isArray(tags)
    ? tags.filter(
        (t) => !(typeof t === "string" && t.startsWith(SUBSERIES_TAG_PREFIX))
      )
    : [];
  if (targetSubseriesSlug && targetSubseriesSlug !== "uncategorized") {
    cleaned.push(`${SUBSERIES_TAG_PREFIX}${targetSubseriesSlug}`);
  }
  return cleaned;
}

function buildCategoryTree(products) {
  const parentEntries = Object.entries(SUB_PRODUCT_CONFIG);
  const byCategoryParents = new Map();

  for (const [parentSlug, cfg] of parentEntries) {
    if (!byCategoryParents.has(cfg.category)) byCategoryParents.set(cfg.category, []);
    byCategoryParents.get(cfg.category).push({ parentSlug, dbSlugs: cfg.dbSlugs });
  }

  const byCategory = new Map();
  for (const p of products) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category).push(p);
  }

  const tree = [];
  for (const [category, items] of Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const parents = byCategoryParents.get(category) || [];
    const claimed = new Set();
    const subseriesMap = new Map();
    const parentOrder = [];

    for (const parent of parents.sort((a, b) => a.parentSlug.localeCompare(b.parentSlug))) {
      parentOrder.push(parent.parentSlug);
      subseriesMap.set(parent.parentSlug, {
        slug: parent.parentSlug,
        title: titleizeSlug(parent.parentSlug),
        products: [],
      });
    }

    // 1) Manual tagged placement has priority
    for (const p of items) {
      const tagged = getTaggedSubseries(p.tags);
      if (!tagged || tagged === "uncategorized") continue;
      if (!subseriesMap.has(tagged)) {
        subseriesMap.set(tagged, {
          slug: tagged,
          title: titleizeSlug(tagged),
          products: [],
        });
      }
      subseriesMap.get(tagged).products.push(p);
      claimed.add(p.slug);
    }

    // 2) Default SUB_PRODUCT_CONFIG placement for unclaimed products
    for (const parent of parents.sort((a, b) => a.parentSlug.localeCompare(b.parentSlug))) {
      const children = items.filter((p) => parent.dbSlugs.includes(p.slug));
      if (!children.length) continue;
      for (const c of children) {
        if (claimed.has(c.slug)) continue;
        subseriesMap.get(parent.parentSlug).products.push(c);
        claimed.add(c.slug);
      }
    }

    const subseries = [];
    for (const slug of parentOrder) {
      const group = subseriesMap.get(slug);
      if (!group || !group.products.length) continue;
      subseries.push({
        ...group,
        products: group.products.sort((a, b) => a.slug.localeCompare(b.slug)),
      });
    }

    // 3) Dynamic groups created by manual tags not defined in SUB_PRODUCT_CONFIG
    const dynamicGroups = Array.from(subseriesMap.values())
      .filter((g) => !parentOrder.includes(g.slug) && g.products.length)
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((g) => ({
        ...g,
        products: g.products.sort((a, b) => a.slug.localeCompare(b.slug)),
      }));
    subseries.push(...dynamicGroups);

    const orphans = items.filter((p) => !claimed.has(p.slug)).sort((a, b) => a.slug.localeCompare(b.slug));
    if (orphans.length) {
      subseries.push({
        slug: "uncategorized",
        title: "Uncategorized",
        products: orphans,
      });
    }

    tree.push({
      category,
      title: titleizeSlug(category),
      count: items.length,
      subseries,
    });
  }

  return tree;
}

export default function ProductsPage({ embedded = false, basePath = "/admin/products" } = {}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      }
    >
      <ProductsContent embedded={embedded} basePath={basePath} />
    </Suspense>
  );
}

function ProductsContent({ embedded = false, basePath = "/admin/products" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  );
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [draggingProductId, setDraggingProductId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [moving, setMoving] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubseries, setBulkSubseries] = useState("uncategorized");
  const [lastMove, setLastMove] = useState(null);

  const page = parseInt(searchParams.get("page") || "1");

  const tree = useMemo(() => buildCategoryTree(catalogProducts), [catalogProducts]);
  const categoryOptions = useMemo(() => {
    const dynamic = Array.from(new Set(catalogProducts.map((p) => p.category))).sort((a, b) =>
      a.localeCompare(b)
    );
    return [{ value: "all", label: "All" }, ...dynamic.map((c) => ({ value: c, label: titleizeSlug(c) }))];
  }, [catalogProducts]);
  const bulkCategoryOptions = useMemo(
    () => tree.map((c) => ({ value: c.category, label: c.title })),
    [tree]
  );
  const bulkSubseriesOptions = useMemo(() => {
    const selectedCategory = tree.find((c) => c.category === bulkCategory);
    if (!selectedCategory) return [{ value: "uncategorized", label: "Uncategorized" }];
    return selectedCategory.subseries.map((s) => ({ value: s.slug, label: s.title }));
  }, [tree, bulkCategory]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setCatalogLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (search) params.set("search", search);

    const catalogParams = new URLSearchParams(params);
    catalogParams.set("page", "1");
    catalogParams.set("limit", "1000");

    try {
      const [res, catalogRes] = await Promise.all([
        fetch(`/api/admin/products?${params}`),
        fetch(`/api/admin/products?${catalogParams}`),
      ]);
      const [data, catalogData] = await Promise.all([res.json(), catalogRes.json()]);
      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setCatalogProducts(catalogData.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
      setCatalogLoading(false);
    }
  }, [page, categoryFilter, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!bulkCategory && bulkCategoryOptions.length > 0) {
      setBulkCategory(bulkCategoryOptions[0].value);
    }
  }, [bulkCategory, bulkCategoryOptions]);

  useEffect(() => {
    if (!bulkSubseriesOptions.length) return;
    const exists = bulkSubseriesOptions.some((opt) => opt.value === bulkSubseries);
    if (!exists) {
      setBulkSubseries(bulkSubseriesOptions[0].value);
    }
  }, [bulkSubseries, bulkSubseriesOptions]);

  useEffect(() => {
    setSelectedProductIds([]);
  }, [categoryFilter, search]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${basePath}?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  async function patchProductClassification(productId, category, tags) {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        tags,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Move failed");
    }
  }

  async function patchProductMove(product, targetCategory, targetSubseriesSlug) {
    const currentTagged = getTaggedSubseries(product.tags);
    const currentGroup = currentTagged || "uncategorized";
    if (product.category === targetCategory && currentGroup === targetSubseriesSlug) {
      return false;
    }
    const nextTags = buildNextSubseriesTags(product.tags, targetSubseriesSlug);
    await patchProductClassification(product.id, targetCategory, nextTags);
    return true;
  }

  function toggleSubseriesSelection(category, subseriesSlug, shouldSelect) {
    const cat = tree.find((c) => c.category === category);
    if (!cat) return;
    const group = cat.subseries.find((s) => s.slug === subseriesSlug);
    if (!group) return;
    const ids = group.products.map((p) => p.id);
    setSelectedProductIds((prev) => {
      const set = new Set(prev);
      if (shouldSelect) ids.forEach((id) => set.add(id));
      else ids.forEach((id) => set.delete(id));
      return Array.from(set);
    });
  }

  function toggleCategorySelection(category, shouldSelect) {
    const cat = tree.find((c) => c.category === category);
    if (!cat) return;
    const ids = cat.subseries.flatMap((s) => s.products.map((p) => p.id));
    setSelectedProductIds((prev) => {
      const set = new Set(prev);
      if (shouldSelect) ids.forEach((id) => set.add(id));
      else ids.forEach((id) => set.delete(id));
      return Array.from(set);
    });
  }

  async function handleDropToSubseries(productId, targetCategory, targetSubseriesSlug) {
    if (!productId || moving) return;
    const product = catalogProducts.find((p) => p.id === productId);
    if (!product) return;

    setMoving(true);
    try {
      const moved = await patchProductMove(product, targetCategory, targetSubseriesSlug);
      if (moved) {
        setLastMove({
          entries: [
            {
              id: product.id,
              name: product.name,
              fromCategory: product.category,
              fromTags: Array.isArray(product.tags) ? [...product.tags] : [],
            },
          ],
        });
        showMsg(`Moved "${product.name}" to ${titleizeSlug(targetSubseriesSlug)}.`);
        fetchProducts();
      }
    } catch (err) {
      showMsg(err.message || "Move failed", true);
    } finally {
      setMoving(false);
      setDraggingProductId(null);
      setDropTarget(null);
    }
  }

  async function handleBulkMove() {
    if (!bulkCategory || selectedProductIds.length === 0 || moving) return;
    const selectedProducts = catalogProducts.filter((p) =>
      selectedProductIds.includes(p.id)
    );
    if (!selectedProducts.length) return;

    setMoving(true);
    try {
      let movedCount = 0;
      const movedEntries = [];
      for (const product of selectedProducts) {
        const moved = await patchProductMove(product, bulkCategory, bulkSubseries);
        if (moved) {
          movedCount += 1;
          movedEntries.push({
            id: product.id,
            name: product.name,
            fromCategory: product.category,
            fromTags: Array.isArray(product.tags) ? [...product.tags] : [],
          });
        }
      }
      if (movedEntries.length > 0) {
        setLastMove({ entries: movedEntries });
      }
      showMsg(
        movedCount > 0
          ? `Moved ${movedCount} products to ${titleizeSlug(bulkSubseries)}.`
          : "Selected products are already in the target subseries."
      );
      setSelectedProductIds([]);
      fetchProducts();
    } catch (err) {
      showMsg(err.message || "Bulk move failed", true);
    } finally {
      setMoving(false);
      setDraggingProductId(null);
      setDropTarget(null);
    }
  }

  async function handleUndoLastMove() {
    if (!lastMove?.entries?.length || moving) return;
    setMoving(true);
    try {
      for (const entry of lastMove.entries) {
        await patchProductClassification(entry.id, entry.fromCategory, entry.fromTags);
      }
      showMsg(`Undid last move (${lastMove.entries.length} products).`);
      setLastMove(null);
      setSelectedProductIds([]);
      fetchProducts();
    } catch (err) {
      showMsg(err.message || "Undo failed", true);
    } finally {
      setMoving(false);
      setDraggingProductId(null);
      setDropTarget(null);
    }
  }

  async function handleCreate(formData) {
    const result = await createProduct(formData);
    if (result?.error) return result;
    setShowForm(false);
    showMsg("Product created!");
    fetchProducts();
    return result;
  }

  async function handleToggle(id, currentlyActive) {
    const result = await toggleProductStatus(id);
    if (result?.error) showMsg(result.error, true);
    else {
      showMsg(currentlyActive ? "Product deactivated" : "Product activated");
      fetchProducts();
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const result = await deleteProduct(product.id);
    if (result?.error) showMsg(result.error, true);
    else {
      showMsg("Product deleted");
      fetchProducts();
    }
  }

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            + Add Product
          </button>
        </div>
      )}
      {embedded && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            + Add Product
          </button>
        </div>
      )}

      {/* Toast */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {categoryOptions.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setCategoryFilter(c.value);
                updateParams({
                  category: c.value === "all" ? null : c.value,
                  page: "1",
                });
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === c.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category -> Subseries -> Products */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Category &rarr; Subseries &rarr; Products
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Current filter view: {catalogProducts.length} products
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Drag a product card into another subseries to reclassify it.
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Shopify-style: select multiple cards then bulk move.
          </p>
        </div>
        <div className="border-b border-gray-100 bg-white px-4 py-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-medium text-gray-700">
              Selected: <span className="font-semibold">{selectedProductIds.length}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-900"
              >
                {bulkCategoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={bulkSubseries}
                onChange={(e) => setBulkSubseries(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-900"
              >
                {bulkSubseriesOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkMove}
                disabled={moving || selectedProductIds.length === 0}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {moving ? "Moving..." : "Move Selected"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                disabled={selectedProductIds.length === 0}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={handleUndoLastMove}
                disabled={moving || !lastMove?.entries?.length}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Undo Last Move
              </button>
            </div>
          </div>
          {lastMove?.entries?.length ? (
            <p className="mt-2 text-[11px] text-gray-500">
              Last move: {lastMove.entries.length} products
            </p>
          ) : null}
        </div>
        {catalogLoading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading catalog map...</div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No products in current filter.</div>
        ) : (
          <div className="max-h-[560px] overflow-auto p-4">
            <div className="space-y-4">
              {tree.map((cat) => (
                <details key={cat.category} className="rounded-lg border border-gray-200 bg-white" open>
                  <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {cat.title} ({cat.count})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCategorySelection(cat.category, true);
                          }}
                          className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCategorySelection(cat.category, false);
                          }}
                          className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </summary>
                  <div className="border-t border-gray-100 px-3 py-2">
                    <div className="space-y-3">
                      {cat.subseries.map((group) => (
                        <div
                          key={`${cat.category}-${group.slug}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggingProductId) return;
                            setDropTarget(`${cat.category}:${group.slug}`);
                          }}
                          onDragLeave={() => {
                            setDropTarget((prev) =>
                              prev === `${cat.category}:${group.slug}` ? null : prev
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const productId =
                              e.dataTransfer.getData("text/product-id") || draggingProductId;
                            handleDropToSubseries(productId, cat.category, group.slug);
                          }}
                          className={`rounded-md border p-2 transition-colors ${
                            dropTarget === `${cat.category}:${group.slug}`
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-100 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                              {group.title} ({group.products.length})
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSubseriesSelection(cat.category, group.slug, true)
                                }
                                className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100"
                              >
                                Select
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSubseriesSelection(cat.category, group.slug, false)
                                }
                                className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                            {group.products.map((p) => (
                              <div
                                key={p.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggingProductId(p.id);
                                  e.dataTransfer.setData("text/product-id", p.id);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => {
                                  setDraggingProductId(null);
                                  setDropTarget(null);
                                }}
                                className={`rounded border bg-white px-2 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:text-gray-900 ${
                                  draggingProductId === p.id
                                    ? "cursor-grabbing border-blue-300 opacity-60"
                                    : "cursor-grab border-gray-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <label className="flex min-w-0 items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedProductIds.includes(p.id)}
                                      onChange={(e) => {
                                        setSelectedProductIds((prev) => {
                                          if (e.target.checked) return [...prev, p.id];
                                          return prev.filter((id) => id !== p.id);
                                        });
                                      }}
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                    />
                                    <span className="min-w-0">
                                      <span className="block truncate font-medium">{p.name}</span>
                                      <span className="block truncate font-mono text-[10px] text-gray-500">{p.slug}</span>
                                    </span>
                                  </label>
                                  <Link
                                    href={`/admin/products/${p.id}`}
                                    className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-800"
                                  >
                                    Edit
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            Loading...
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>No products found</p>
            {categoryFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  updateParams({ category: null, page: "1" });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const imgUrl = product.images?.[0]?.url;
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-300 text-sm">
                              ?
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="font-mono text-xs text-gray-400">
                            {product.slug}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            {formatCad(product.basePrice)}
                          </span>
                          <span className="ml-1 text-xs text-gray-400">
                            /{product.pricingUnit === "per_sqft" ? "sqft" : "pc"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggle(product.id, product.isActive)
                            }
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 lg:hidden">
              {products.map((product) => {
                const imgUrl = product.images?.[0]?.url;
                return (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                        ?
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCad(product.basePrice)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
