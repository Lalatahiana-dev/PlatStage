import { create } from "zustand";
import api from "@/lib/axios";

interface FavoritesState {
  favoriteIds: Set<number>;
  loaded: boolean;
  toggle: (id_student: number, id_offer: number) => Promise<boolean>;
  load: (id_student: number) => Promise<void>;
  has: (id_offer: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set(),
  loaded: false,

  load: async (id_student: number) => {
    try {
      const res = await api.get(`/favorites/student/${id_student}/ids`);
      set({ favoriteIds: new Set(res.data), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggle: async (id_student: number, id_offer: number) => {
    const { favoriteIds } = get();
    const isFav = favoriteIds.has(id_offer);

    if (isFav) {
      const res = await api.get(`/favorites/student/${id_student}`);
      const fav = res.data.find(
        (f: { offer: { id_offer: number } }) => f.offer.id_offer === id_offer,
      );
      if (fav) {
        await api.delete(`/favorites/${fav.id_favorite}`);
      }
      set((s) => {
        const next = new Set(s.favoriteIds);
        next.delete(id_offer);
        return { favoriteIds: next };
      });
      return false;
    } else {
      await api.post("/favorites", { id_student, id_offer });
      set((s) => {
        const next = new Set(s.favoriteIds);
        next.add(id_offer);
        return { favoriteIds: next };
      });
      return true;
    }
  },

  has: (id_offer: number) => get().favoriteIds.has(id_offer),
}));
