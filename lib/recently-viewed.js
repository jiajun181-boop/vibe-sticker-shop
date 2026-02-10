import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 12;

export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      viewed: [],
      addViewed: (product) => {
        const { slug, category, name, image, basePrice } = product;
        if (!slug) return;
        set((state) => {
          const filtered = state.viewed.filter((p) => p.slug !== slug);
          return {
            viewed: [{ slug, category, name, image, basePrice, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS),
          };
        });
      },
    }),
    { name: "vibe-recently-viewed" }
  )
);
