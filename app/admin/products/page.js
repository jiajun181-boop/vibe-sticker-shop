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
const PLACEMENT_TAG_PREFIX = "placement:";
const CATEGORY_ORDER = [
  "marketing-prints",
  "retail-promo",
  "packaging",
  "banners-displays",
  "display-stands",
  "rigid-signs",
  "large-format-graphics",
  "vehicle-branding-advertising",
  "window-glass-films",
  "stickers-labels",
  "safety-warning-decals",
  "facility-asset-labels",
  "fleet-compliance-id",
];

function titleizeSlug(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getTaggedSubseriesList(tags) {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .filter((t) => typeof t === "string" && t.startsWith(SUBSERIES_TAG_PREFIX))
        .map((t) => t.slice(SUBSERIES_TAG_PREFIX.length))
        .filter(Boolean)
    )
  );
}

function getPlacementSubseriesList(tags, category) {
  if (!Array.isArray(tags) || !category) return [];
  return Array.from(
    new Set(
      tags
        .filter((t) => typeof t === "string" && t.startsWith(PLACEMENT_TAG_PREFIX))
        .map((t) => t.slice(PLACEMENT_TAG_PREFIX.length))
        .map((value) => {
          const idx = value.indexOf(":");
          if (idx < 0) return null;
          return { category: value.slice(0, idx), subseries: value.slice(idx + 1) };
        })
        .filter(Boolean)
        .filter((p) => p.category === category)
        .map((p) => p.subseries)
        .filter(Boolean)
    )
  );
}

function hasUncategorizedGroup(categoryNode) {
  return categoryNode.subseries.some((s) => s.slug === "uncategorized" && s.products.length > 0);
}

function buildMoveSubseriesTags(tags, targetSubseriesSlug) {
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

function buildCopySubseriesTags(tags, targetSubseriesSlug) {
  const cleaned = Array.isArray(tags)
    ? tags.filter((t) => !(typeof t === "string" && t === `${SUBSERIES_TAG_PREFIX}${targetSubseriesSlug}`))
    : [];
  if (targetSubseriesSlug && targetSubseriesSlug !== "uncategorized") {
    cleaned.push(`${SUBSERIES_TAG_PREFIX}${targetSubseriesSlug}`);
  }
  return cleaned;
}

function buildCopyPlacementTags(tags, targetCategory, targetSubseriesSlug) {
  if (!targetCategory || !targetSubseriesSlug || targetSubseriesSlug === "uncategorized") {
    return Array.isArray(tags) ? [...tags] : [];
  }
  const exact = `${PLACEMENT_TAG_PREFIX}${targetCategory}:${targetSubseriesSlug}`;
  const cleaned = Array.isArray(tags)
    ? tags.filter((t) => !(typeof t === "string" && t === exact))
    : [];
  cleaned.push(exact);
  return cleaned;
}

function suggestSubseriesForProduct(product) {
  if (!product?.category || !product?.slug) return null;
  const byCategory = Object.entries(SUB_PRODUCT_CONFIG).filter(([, cfg]) => cfg.category === product.category);
  const slug = String(product.slug).toLowerCase();

  for (const [parentSlug, cfg] of byCategory) {
    if (Array.isArray(cfg.dbSlugs) && cfg.dbSlugs.includes(product.slug)) return parentSlug;
  }
  for (const [parentSlug, cfg] of byCategory) {
    if (cfg.slugPrefix && slug.startsWith(String(cfg.slugPrefix).toLowerCase())) return parentSlug;
  }
  for (const [parentSlug] of byCategory) {
    if (slug.includes(parentSlug.replace(/-/g, "")) || slug.includes(parentSlug)) return parentSlug;
  }
  return null;
}

function buildCategoryTree(products) {
  const parentEntries = Object.entries(SUB_PRODUCT_CONFIG);
  const byCategoryParents = new Map();

  for (const [parentSlug, cfg] of parentEntries) {
    if (!byCategoryParents.has(cfg.category)) byCategoryParents.set(cfg.category, []);
    byCategoryParents.get(cfg.category).push({ parentSlug, dbSlugs: cfg.dbSlugs });
  }

  const byCategory = new Map();
  const allCategories = new Set(products.map((p) => p.category));
  for (const p of products) {
    if (Array.isArray(p.tags)) {
      for (const tag of p.tags) {
        if (typeof tag !== "string" || !tag.startsWith(PLACEMENT_TAG_PREFIX)) continue;
        const raw = tag.slice(PLACEMENT_TAG_PREFIX.length);
        const idx = raw.indexOf(":");
        if (idx < 0) continue;
        const placementCategory = raw.slice(0, idx);
        if (placementCategory) allCategories.add(placementCategory);
      }
    }
  }
  for (const category of allCategories) {
    const categoryItems = products.filter((p) => {
      if (p.category === category) return true;
      return getPlacementSubseriesList(p.tags, category).length > 0;
    });
    if (categoryItems.length) byCategory.set(category, categoryItems);
  }

  const orderIndex = new Map(CATEGORY_ORDER.map((slug, idx) => [slug, idx]));
  const tree = [];
  for (const [category, items] of Array.from(byCategory.entries()).sort((a, b) => {
    const ai = orderIndex.has(a[0]) ? orderIndex.get(a[0]) : Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.has(b[0]) ? orderIndex.get(b[0]) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a[0].localeCompare(b[0]);
  })) {
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

    // 1) Manual tagged placement has priority and can place one product in multiple subseries
    for (const p of items) {
      const placementTagged = getPlacementSubseriesList(p.tags, category).filter(
        (tagged) => tagged !== "uncategorized"
      );
      const canonicalTagged =
        p.category === category
          ? getTaggedSubseriesList(p.tags).filter((tagged) => tagged !== "uncategorized")
          : [];
      const taggedList = placementTagged.length ? placementTagged : canonicalTagged;
      if (!taggedList.length) continue;
      for (const tagged of taggedList) {
        if (!subseriesMap.has(tagged)) {
          subseriesMap.set(tagged, {
            slug: tagged,
            title: titleizeSlug(tagged),
            products: [],
          });
        }
        const group = subseriesMap.get(tagged);
        if (!group.products.some((existing) => existing.id === p.id)) {
          group.products.push(p);
        }
      }
      claimed.add(p.id);
    }

    // 2) Default SUB_PRODUCT_CONFIG placement for unclaimed products
    for (const parent of parents.sort((a, b) => a.parentSlug.localeCompare(b.parentSlug))) {
      const children = items.filter((p) => parent.dbSlugs.includes(p.slug));
      if (!children.length) continue;
      for (const c of children) {
        if (claimed.has(c.id)) continue;
        subseriesMap.get(parent.parentSlug).products.push(c);
        claimed.add(c.id);
      }
    }

    const subseries = [];
    for (const slug of parentOrder) {
      const group = subseriesMap.get(slug);
      if (!group || !group.products.length) continue;
      subseries.push({
        ...group,
        products: group.products.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
      });
    }

    // 3) Dynamic groups created by manual tags not defined in SUB_PRODUCT_CONFIG
    const dynamicGroups = Array.from(subseriesMap.values())
      .filter((g) => !parentOrder.includes(g.slug) && g.products.length)
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((g) => ({
        ...g,
        products: g.products.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
      }));
    subseries.push(...dynamicGroups);

    const orphans = items.filter((p) => !claimed.has(p.id)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
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
  const [copiedProductIds, setCopiedProductIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubseries, setBulkSubseries] = useState("uncategorized");
  const [lastMove, setLastMove] = useState(null);
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");

  const tree = useMemo(() => buildCategoryTree(catalogProducts), [catalogProducts]);
  const categoryOptions = useMemo(() => {
    const dynamic = Array.from(new Set(catalogProducts.map((p) => p.category)));
    const known = CATEGORY_ORDER.filter((c) => dynamic.includes(c));
    const unknown = dynamic.filter((c) => !CATEGORY_ORDER.includes(c)).sort((a, b) => a.localeCompare(b));
    const ordered = [...known, ...unknown];
    return [{ value: "all", label: "All" }, ...ordered.map((c) => ({ value: c, label: titleizeSlug(c) }))];
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
  const uncategorizedEntries = useMemo(() => {
    return tree.flatMap((cat) => {
      const group = cat.subseries.find((s) => s.slug === "uncategorized");
      if (!group || !group.products.length) return [];
      return group.products.map((p) => ({ ...p, categoryTitle: cat.title, categorySlug: cat.category }));
    });
  }, [tree]);
  const uncategorizedSuggestions = useMemo(() => {
    return uncategorizedEntries
      .map((p) => ({ product: p, suggested: suggestSubseriesForProduct(p) }))
      .filter((x) => x.suggested);
  }, [uncategorizedEntries]);
  const visibleTree = useMemo(() => {
    if (!showOnlyUncategorized) return tree;
    return tree
      .filter((cat) => hasUncategorizedGroup(cat))
      .map((cat) => ({
        ...cat,
        subseries: cat.subseries.filter((s) => s.slug === "uncategorized"),
      }));
  }, [tree, showOnlyUncategorized]);

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

  async function patchProductClassification(productId, { category, tags }) {
    const payload = { tags };
    if (category) payload.category = category;
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Move failed");
    }
  }

  async function patchProductSortOrder(productId, sortOrder) {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Sort update failed");
    }
  }

  async function patchProductMove(product, targetCategory, targetSubseriesSlug) {
    const currentTagged = getTaggedSubseriesList(product.tags);
    const isSameCategory = product.category === targetCategory;
    const isSamePlacement =
      isSameCategory &&
      ((targetSubseriesSlug === "uncategorized" && currentTagged.length === 0) ||
        (currentTagged.length === 1 && currentTagged[0] === targetSubseriesSlug));
    if (isSamePlacement) {
      return false;
    }
    const nextTags = buildMoveSubseriesTags(product.tags, targetSubseriesSlug);
    await patchProductClassification(product.id, { category: targetCategory, tags: nextTags });
    return true;
  }

  async function patchProductCopy(product, targetCategory, targetSubseriesSlug) {
    if (targetSubseriesSlug === "uncategorized") return false;
    let nextTags = [];
    if (product.category === targetCategory) {
      const currentTagged = getTaggedSubseriesList(product.tags);
      if (currentTagged.includes(targetSubseriesSlug)) return false;
      nextTags = buildCopySubseriesTags(product.tags, targetSubseriesSlug);
    } else {
      const placementTagged = getPlacementSubseriesList(product.tags, targetCategory);
      if (placementTagged.includes(targetSubseriesSlug)) return false;
      nextTags = buildCopyPlacementTags(product.tags, targetCategory, targetSubseriesSlug);
    }
    await patchProductClassification(product.id, { tags: nextTags });
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

  function selectAllUncategorized() {
    const ids = uncategorizedEntries.map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])));
  }

  async function handleAutoAssignUncategorized() {
    if (moving || uncategorizedSuggestions.length === 0) return;
    const selectedSet = new Set(selectedProductIds);
    const rows = selectedSet.size
      ? uncategorizedSuggestions.filter((x) => selectedSet.has(x.product.id))
      : uncategorizedSuggestions;
    if (!rows.length) return;

    setMoving(true);
    try {
      const movedEntries = [];
      for (const row of rows) {
        const moved = await patchProductMove(row.product, row.product.category, row.suggested);
        if (moved) {
          movedEntries.push({
            id: row.product.id,
            name: row.product.name,
            fromCategory: row.product.category,
            fromTags: Array.isArray(row.product.tags) ? [...row.product.tags] : [],
          });
        }
      }
      if (movedEntries.length > 0) {
        setLastMove({ entries: movedEntries });
      }
      showMsg(
        movedEntries.length
          ? `Auto-assigned ${movedEntries.length} products by slug rules.`
          : "No matching suggestion to apply."
      );
      setSelectedProductIds([]);
      fetchProducts();
    } catch (err) {
      showMsg(err.message || "Auto-assign failed", true);
    } finally {
      setMoving(false);
      setDraggingProductId(null);
      setDropTarget(null);
    }
  }

  async function handleDropToSubseries(productId, targetCategory, targetSubseriesSlug, options = {}) {
    if (!productId || moving) return;
    const isCopy = Boolean(options.isCopy);
    const product = catalogProducts.find((p) => p.id === productId);
    if (!product) return;

    setMoving(true);
    try {
      const changed = isCopy
        ? await patchProductCopy(product, targetCategory, targetSubseriesSlug)
        : await patchProductMove(product, targetCategory, targetSubseriesSlug);
      if (changed) {
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
        showMsg(
          isCopy
            ? `Copied "${product.name}" to ${titleizeSlug(targetSubseriesSlug)}.`
            : `Moved "${product.name}" to ${titleizeSlug(targetSubseriesSlug)}.`
        );
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

  async function handleReorderWithinSubseries(sourceProductId, targetProductId, groupProducts) {
    if (!sourceProductId || !targetProductId || sourceProductId === targetProductId || moving) return;
    const ordered = [...groupProducts].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    );
    const sourceIndex = ordered.findIndex((p) => p.id === sourceProductId);
    const targetIndex = ordered.findIndex((p) => p.id === targetProductId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

    const [movedItem] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, movedItem);

    setMoving(true);
    try {
      for (let i = 0; i < ordered.length; i += 1) {
        const nextSort = (i + 1) * 10;
        if ((ordered[i].sortOrder ?? 0) === nextSort) continue;
        await patchProductSortOrder(ordered[i].id, nextSort);
      }
      showMsg(`Reordered "${movedItem.name}".`);
      fetchProducts();
    } catch (err) {
      showMsg(err.message || "Reorder failed", true);
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

  function handleCopySelected() {
    if (!selectedProductIds.length) return;
    setCopiedProductIds(selectedProductIds);
    showMsg(`Copied ${selectedProductIds.length} products.`);
  }

  async function handlePasteCopied() {
    if (!bulkCategory || !copiedProductIds.length || moving) return;
    const copiedProducts = catalogProducts.filter((p) => copiedProductIds.includes(p.id));
    if (!copiedProducts.length) return;

    setMoving(true);
    try {
      let copiedCount = 0;
      const copiedEntries = [];
      for (const product of copiedProducts) {
        const copied = await patchProductCopy(product, bulkCategory, bulkSubseries);
        if (copied) {
          copiedCount += 1;
          copiedEntries.push({
            id: product.id,
            name: product.name,
            fromCategory: product.category,
            fromTags: Array.isArray(product.tags) ? [...product.tags] : [],
          });
        }
      }
      if (copiedEntries.length > 0) {
        setLastMove({ entries: copiedEntries });
      }
      showMsg(
        copiedCount > 0
          ? `Pasted ${copiedCount} products into ${titleizeSlug(bulkSubseries)}.`
          : "Copied products are already in the target subseries."
      );
      fetchProducts();
    } catch (err) {
      showMsg(err.message || "Paste failed", true);
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
        await patchProductClassification(entry.id, { category: entry.fromCategory, tags: entry.fromTags });
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
      {lastMove?.entries?.length ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <span>Last change: {lastMove.entries.length} products moved.</span>
          <button
            type="button"
            onClick={handleUndoLastMove}
            disabled={moving}
            className="rounded-md border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
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
          <button
            type="button"
            onClick={() => setShowOnlyUncategorized((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showOnlyUncategorized
                ? "bg-amber-100 text-amber-800"
                : "bg-white text-amber-700 hover:bg-amber-50"
            }`}
          >
            Uncategorized ({uncategorizedEntries.length})
          </button>
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
            Hold Ctrl/Command while dragging to copy into another subseries.
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Shopify-style: select multiple cards then bulk move.
          </p>
          {uncategorizedEntries.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium text-amber-800">
                {uncategorizedEntries.length} products are uncategorized.
              </p>
              <button
                type="button"
                onClick={selectAllUncategorized}
                className="rounded border border-amber-300 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              >
                Select All Uncategorized
              </button>
              <button
                type="button"
                onClick={() => setShowOnlyUncategorized((v) => !v)}
                className="rounded border border-amber-300 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              >
                {showOnlyUncategorized ? "Show All Categories" : "Only Uncategorized"}
              </button>
              <button
                type="button"
                onClick={handleAutoAssignUncategorized}
                disabled={moving || uncategorizedSuggestions.length === 0}
                className="rounded border border-amber-300 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                Auto Assign ({uncategorizedSuggestions.length})
              </button>
            </div>
          )}
        </div>
        <div className="border-b border-gray-100 bg-white px-4 py-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-medium text-gray-700">
              Selected: <span className="font-semibold">{selectedProductIds.length}</span>
              {copiedProductIds.length ? (
                <span className="ml-2 text-gray-500">
                  | Clipboard: <span className="font-semibold">{copiedProductIds.length}</span>
                </span>
              ) : null}
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
                onClick={handleCopySelected}
                disabled={moving || selectedProductIds.length === 0}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Copy Selected
              </button>
              <button
                type="button"
                onClick={handlePasteCopied}
                disabled={moving || copiedProductIds.length === 0}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Paste to Target
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
            <p className="mt-2 text-[11px] text-gray-500">Undo is available above.</p>
          ) : null}
        </div>
        {catalogLoading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading catalog map...</div>
        ) : visibleTree.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No products in current filter.</div>
        ) : (
          <div className="max-h-[560px] overflow-auto p-4">
            <div className="space-y-4">
              {visibleTree.map((cat) => (
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
                            handleDropToSubseries(productId, cat.category, group.slug, {
                              isCopy: e.ctrlKey || e.metaKey,
                            });
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
                                  e.dataTransfer.effectAllowed = "copyMove";
                                }}
                                onDragEnd={() => {
                                  setDraggingProductId(null);
                                  setDropTarget(null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!draggingProductId || draggingProductId === p.id) return;
                                  setDropTarget(`card:${p.id}`);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const sourceId =
                                    e.dataTransfer.getData("text/product-id") || draggingProductId;
                                  const isInGroup = group.products.some((gp) => gp.id === sourceId);
                                  const isCopy = e.ctrlKey || e.metaKey;
                                  if (isInGroup) {
                                    handleReorderWithinSubseries(
                                      sourceId,
                                      p.id,
                                      group.products
                                    );
                                  } else {
                                    handleDropToSubseries(sourceId, cat.category, group.slug, {
                                      isCopy,
                                    });
                                  }
                                }}
                                className={`rounded border bg-white px-2 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:text-gray-900 ${
                                  dropTarget === `card:${p.id}`
                                    ? "border-blue-400 bg-blue-50"
                                    : draggingProductId === p.id
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
