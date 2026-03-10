"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function RecoverCartPage() {
  const { token } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [status, setStatus] = useState("loading"); // loading | recovered | error
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/cart/recover/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data.cart) ? data.cart : [];
        if (items.length === 0) {
          setStatus("error");
          return;
        }

        // Restore cart items
        clearCart();
        for (const item of items) {
          addItem({ ...item, forceNewLine: true });
        }

        setStatus("recovered");
        openCart();

        // Redirect to shop after a brief delay
        setTimeout(() => router.push("/shop"), 2000);
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <p className="text-gray-600">{t("cart.recovering")}</p>
          </>
        )}
        {status === "recovered" && (
          <>
            <div className="mb-4 text-4xl">&#10004;</div>
            <h1 className="mb-2 text-xl font-semibold">{t("cart.restored")}</h1>
            <p className="text-gray-600">{t("cart.restoredDesc")}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-4 text-4xl">&#128532;</div>
            <h1 className="mb-2 text-xl font-semibold">{t("cart.notFound")}</h1>
            <p className="mb-4 text-gray-600">{t("cart.notFoundDesc")}</p>
            <a href="/shop" className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-[#fff] hover:bg-gray-800">
              {t("cart.browseShop")}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
