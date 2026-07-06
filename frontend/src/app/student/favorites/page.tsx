"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface Favorite {
  id_favorite: number;
  created_at: string;
  offer: {
    id_offer: number;
    title: string;
    location?: string;
    salary?: number;
    deadline?: string;
    status: string;
    company: {
      company_name: string;
      logo_url?: string;
      sector?: string;
    };
  };
}

export default function StudentFavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get("/favorites/student/2");
        setFavorites(res.data);
      } catch {
        console.error("Erreur fetch favorites");
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (id_favorite: number) => {
    setRemoving(id_favorite);
    try {
      await api.delete(`/favorites/${id_favorite}`);
      setFavorites((prev) => prev.filter((f) => f.id_favorite !== id_favorite));
    } catch {
      console.error("Erreur remove favorite");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Mes favoris
        </h1>
        <p className="text-sm text-gray-500">
          Retrouvez les offres que vous avez sauvegardées.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : favorites.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-heart text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">Aucun favori pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.id_favorite}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {fav.offer.company.company_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {fav.offer.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {fav.offer.company.company_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(fav.id_favorite)}
                  disabled={removing === fav.id_favorite}
                  className="text-red-400 hover:text-red-500 transition disabled:opacity-50"
                  title="Retirer des favoris"
                >
                  <i className="ti ti-heart-filled text-lg"></i>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {fav.offer.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    <i className="ti ti-map-pin text-xs"></i>
                    {fav.offer.location}
                  </span>
                )}
                {fav.offer.salary && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    <i className="ti ti-cash text-xs"></i>
                    {fav.offer.salary.toLocaleString()} Ar
                  </span>
                )}
                <span
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                    fav.offer.status === "PUBLISHED"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {fav.offer.status === "PUBLISHED"
                    ? "Publiée"
                    : fav.offer.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
