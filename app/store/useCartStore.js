import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (item) => {
        set((state) => {
          // 逻辑：同规格、同文件、同材质就合并数量
          const sameKey = (x) =>
            x.productId === item.productId &&
            x.width === item.width &&
            x.height === item.height &&
            x.material === item.material &&
            x.finish === item.finish &&
            x.fileKey === item.fileKey; // 确保文件也一样

          const existing = state.items.find(sameKey);

          if (existing) {
            return {
              items: state.items.map((x) =>
                x.id === existing.id 
                  ? { ...x, cartQuantity: (x.cartQuantity || 1) + 1 } 
                  : x
              ),
              isOpen: true,
            };
          }

          // 生成唯一ID
          const cartId =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${item.productId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

          const newItem = { ...item, id: cartId, cartQuantity: 1 };
          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (cartId) =>
        set((state) => ({
          items: state.items.filter((x) => x.id !== cartId),
        })),

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        const { items } = get();
        return items.reduce((t, x) => t + x.price * (x.cartQuantity || 1), 0);
      },

      getCartCount: () => {
        const { items } = get();
        return items.reduce((n, x) => n + (x.cartQuantity || 1), 0);
      },
    }),
    {
      name: "vibe-cart-storage",
      storage: createJSONStorage(() => {
        // 避免 SSR 报错的稳健写法
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        return undefined; 
      }),
      skipHydration: false, // 你的建议：自动恢复数据
    }
  )
);