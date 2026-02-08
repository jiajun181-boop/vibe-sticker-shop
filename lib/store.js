// lib/store.js — Canonical cart store
import { create } from "zustand";
import { persist } from "zustand/middleware";

const HST_RATE = 0.13;

const SHIPPING_OPTIONS = [
  { id: "pickup", label: "Pickup", sublabel: "123 Main St, Toronto", price: 0 },
  { id: "local", label: "Local Delivery", sublabel: "Within GTA", price: 1500 },
  { id: "shipping", label: "Canada-wide Shipping", sublabel: "Standard", price: 2000 },
];

export { SHIPPING_OPTIONS };

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isOpen: false,
      shipping: "pickup", // default shipping method
      toast: null, // { message, type }

      // --- Cart open/close ---
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // --- Toast ---
      showToast: (message, type = "success") => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3000);
      },

      // --- Shipping ---
      setShipping: (id) => set({ shipping: id }),

      // --- Add item ---
      addItem: (item) => {
        const { cart } = get();
        const key = (a, b) =>
          a.id === b.id && JSON.stringify(a.options) === JSON.stringify(b.options);

        const existing = cart.find((c) => key(c, item));
        if (existing) {
          set({
            cart: cart.map((c) =>
              key(c, item) ? { ...c, quantity: c.quantity + item.quantity } : c
            ),
          });
        } else {
          set({ cart: [...cart, { ...item, _cartId: crypto.randomUUID() }] });
        }

        get().showToast(
          `${item.quantity} x ${item.name} added to cart`
        );
      },

      // --- Remove item ---
      removeItem: (_cartId) =>
        set((s) => ({ cart: s.cart.filter((c) => c._cartId !== _cartId) })),

      // --- Update quantity ---
      updateQuantity: (_cartId, qty) =>
        set((s) => ({
          cart: s.cart.map((c) =>
            c._cartId === _cartId ? { ...c, quantity: Math.max(1, qty) } : c
          ),
        })),

      // --- Clear cart ---
      clearCart: () => set({ cart: [] }),

      // --- Computed ---
      getSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getTax: () => Math.round(get().getSubtotal() * HST_RATE),
      getShippingCost: () => {
        const opt = SHIPPING_OPTIONS.find((o) => o.id === get().shipping);
        return opt ? opt.price : 0;
      },
      getTotal: () => get().getSubtotal() + get().getTax() + get().getShippingCost(),
      getCartCount: () => get().cart.reduce((n, c) => n + c.quantity, 0),
    }),
    { name: "vibe-cart-storage" }
  )
);
