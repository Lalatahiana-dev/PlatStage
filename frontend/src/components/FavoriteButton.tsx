"use client";

import { useState } from "react";
import { useFavoritesStore } from "@/store/favorites.store";

interface FavoriteButtonProps {
  id_student: number;
  id_offer: number;
  size?: "sm" | "md";
  className?: string;
}

export default function FavoriteButton({
  id_student,
  id_offer,
  size = "sm",
  className = "",
}: FavoriteButtonProps) {
  const isFav = useFavoritesStore((s) => s.favoriteIds.has(id_offer));
  const toggle = useFavoritesStore((s) => s.toggle);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await toggle(id_student, id_offer);
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconClass = size === "sm" ? "text-base" : "text-lg";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClass} rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
        isFav
          ? "text-red-500 hover:bg-red-50"
          : "text-gray-300 hover:text-red-400 hover:bg-red-50"
      } ${className}`}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {loading ? (
        <i className={`ti ti-loader-2 ${iconClass} animate-spin`}></i>
      ) : isFav ? (
        <i className={`ti ti-heart-filled ${iconClass}`}></i>
      ) : (
        <i className={`ti ti-heart ${iconClass}`}></i>
      )}
    </button>
  );
}
