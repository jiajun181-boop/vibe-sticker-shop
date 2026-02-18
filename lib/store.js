// lib/store.js — Canonical cart store
import { create } from "zustand";
import { persist } from "zustand/middleware";

const HST_RATE = 0.13;
const FREE_SHIPPING_THRESHOLD = 15000; // $150 in cents

// Debounced server sync for abandoned cart recovery (only for logged-in users)
let _syncTimer = null;
function debouncedCartSync(cart) {
  if (typeof window === "undefined") return;
  // Skip sync for guests — the endpoint requires auth and would 401
  if (!document.cookie.includes("session=")) return;
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart }),
    }).catch(() => {}); // Silent fail — non-critical
  }, 30000); // 30s debounce
}

const SHIPPING_OPTIONS = [
  { id: "pickup", label: "Pickup", sublabel: "123 Main St, Toronto", price: 0 },
  { id: "local", label: "Local Delivery", sublabel: "Within GTA", price: 1500 },
  { id: "shipping", label: "Canada-wide Shipping", sublabel: "Standard", price: 2000 },
];

export { SHIPPING_OPTIONS, FREE_SHIPPING_THRESHOLD };

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isOpen: false,
      shipping: "pickup",
      toast: null, // { message, type, action? }
      _lastRemoved: null, // for undo

      // --- Cart open/close ---
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // --- Toast ---
      showToast: (message, type = "success", action = null) => {
        const toastId = Date.now();
        set({ toast: { message, type, action, id: toastId } });
        const duration = type === "error" ? 5000 : type === "remove" ? 4000 : 3000;
        setTimeout(() => {
          const current = get().toast;
          if (current && current.id === toastId) {
            set({ toast: null });
          }
        }, duration);
      },
      dismissToast: () => set({ toast: null }),

      // --- Shipping ---
      setShipping: (id) => set({ shipping: id }),

      // --- Add item ---
      addItem: (item) => {
        const { cart } = get();
        const forceNewLine = item?.forceNewLine === true;
        const cleanedItem = forceNewLine ? { ...item, forceNewLine: undefined } : item;
        const key = (a, b) =>
          a.id === b.id && JSON.stringify(a.options) === JSON.stringify(b.options);

        const existing = forceNewLine ? null : cart.find((c) => key(c, cleanedItem));
        if (existing && !forceNewLine) {
          set({
            cart: cart.map((c) =>
              key(c, cleanedItem) ? { ...c, quantity: c.quantity + cleanedItem.quantity } : c
            ),
          });
        } else {
          const _cartId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                  const r = (Math.random() * 16) | 0;
                  return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
                });
          set({ cart: [...cart, { ...cleanedItem, _cartId }] });
        }

        get().showToast(`${cleanedItem.quantity} x ${cleanedItem.name} added`, "success", { label: "View Cart", fn: "openCart" });
        debouncedCartSync(get().cart);
      },

      // --- Remove item (with undo support) ---
      removeItem: (_cartId) => {
        const { cart } = get();
        const removed = cart.find((c) => c._cartId === _cartId);
        set({
          cart: cart.filter((c) => c._cartId !== _cartId),
          _lastRemoved: removed,
        });
        if (removed) {
          get().showToast(`${removed.name} removed`, "remove", { label: "Undo", fn: "undoRemove" });
          debouncedCartSync(get().cart);
        }
      },

      // --- Undo remove ---
      undoRemove: () => {
        const { _lastRemoved, cart } = get();
        if (_lastRemoved) {
          set({ cart: [...cart, _lastRemoved], _lastRemoved: null, toast: null });
        }
      },

      // --- Update quantity ---
      updateQuantity: (_cartId, qty) =>
        set((s) => ({
          cart: s.cart.map((c) =>
            c._cartId === _cartId ? { ...c, quantity: Math.min(999, Math.max(1, qty)) } : c
          ),
        })),

      // --- Clear cart ---
      clearCart: () => set({ cart: [], _lastRemoved: null }),

      // --- Computed ---
      getSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getTax: () => Math.round(get().getSubtotal() * HST_RATE),
      getShippingCost: () => {
        const { shipping } = get();
        const opt = SHIPPING_OPTIONS.find((o) => o.id === shipping);
        if (!opt) return 0;
        // Free shipping on orders over threshold (only for Canada-wide)
        if (opt.id === "shipping" && get().getSubtotal() >= FREE_SHIPPING_THRESHOLD) return 0;
        return opt.price;
      },
      getTotal: () => get().getSubtotal() + get().getTax() + get().getShippingCost(),
      getCartCount: () => get().cart.reduce((n, c) => n + c.quantity, 0),
    }),
    {
      name: "vibe-cart-storage",
      partialize: (state) => ({
        cart: state.cart,
        shipping: state.shipping,
      }),
    }
  )
);
