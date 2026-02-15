import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 50;

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (product) => {
        const { slug, category, name, image, basePrice } = product;
        if (!slug) return;
        set((state) => {
          if (state.favorites.some((f) => f.slug === slug)) return state;
          return {
            favorites: [{ slug, category, name, image, basePrice, addedAt: Date.now() }, ...state.favorites].slice(0, MAX_ITEMS),
          };
        });
      },

      removeFavorite: (slug) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.slug !== slug),
        }));
      },

      isFavorite: (slug) => {
        return get().favorites.some((f) => f.slug === slug);
      },

      toggleFavorite: (product) => {
        const { slug } = product;
        if (!slug) return;
        if (get().isFavorite(slug)) {
          get().removeFavorite(slug);
          return false;
        } else {
          get().addFavorite(product);
          return true;
        }
      },

      clearAll: () => set({ favorites: [] }),
    }),
    { name: "vibe-favorites" }
  )
);
