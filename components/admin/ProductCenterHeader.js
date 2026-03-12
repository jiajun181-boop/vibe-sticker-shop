"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  PRODUCT_CENTER_VIEWS,
  buildProductCenterHref,
  getProductCenterView,
  getProductCenterDeep,
} from "@/lib/admin-centers";

/**
 * Canonical Product Center breadcrumb.
 *
 * - Peer views (activeView): single link back to root ("Products")
 * - Deep workspaces (deepId):  2-level breadcrumb ("Products / Media Library")
 * - Root page: omit entirely (pass neither prop)
 */
export function ProductCenterBreadcrumb({ deepId }) {
  const { t } = useTranslation();

  if (deepId) {
    const deep = getProductCenterDeep(deepId);
    if (deep) {
      const parent = getProductCenterView(deep.parentView);
      return (
        <div className="mb-1 flex items-center gap-1 text-[11px] text-[#666]">
          <Link
            href={buildProductCenterHref()}
            className="underline hover:text-black hover:no-underline"
          >
            {t("admin.productCenter.title")}
          </Link>
          <span>/</span>
          <Link
            href={parent.href}
            className="underline hover:text-black hover:no-underline"
          >
            {t(parent.labelKey)}
          </Link>
        </div>
      );
    }
  }

  return (
    <Link
      href={buildProductCenterHref()}
      className="mb-1 inline-block text-[11px] text-[#666] underline hover:text-black hover:no-underline"
    >
      {t("admin.productCenter.title")}
    </Link>
  );
}

/**
 * Canonical Product Center view strip.
 *
 * Renders the horizontal tab bar linking to all Product Center views.
 * The `activeView` prop controls which tab is highlighted.
 */
export function ProductCenterViewStrip({ activeView }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {PRODUCT_CENTER_VIEWS.map((view) => (
          <Link
            key={view.id}
            href={view.href}
            className={`rounded-[3px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
              view.id === activeView
                ? "border-black bg-black text-white"
                : "border-[#e0e0e0] bg-white text-[#666] hover:border-black hover:text-black"
            }`}
          >
            {t(view.labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );
}
