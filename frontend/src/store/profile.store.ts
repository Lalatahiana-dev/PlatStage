import { create } from "zustand";

export const useProfileStore = create<{
  avatarVersion: number;
  bumpAvatar: () => void;
}>((set) => ({
  avatarVersion: 0,
  bumpAvatar: () => set((s) => ({ avatarVersion: s.avatarVersion + 1 })),
}));
