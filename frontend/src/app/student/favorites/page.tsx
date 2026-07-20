"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useFavoritesStore } from "@/store/favorites.store";
import api from "@/lib/axios";
import type { Favorite } from "@/types";

export default function StudentFavoritesPage() {
  const { user } = useAuthStore();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Favorite | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const loadFavorites = useFavoritesStore((s) => s.load);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);

  useEffect(() => {
    if (!user) return;
    const fetchStudentId = async () => {
      try {
        const res = await api.get(`/students/user/${user.userId}`);
        setStudentId(res.data.id_student);
      } catch {
        console.error("Erreur fetch student profile");
      }
    };
    fetchStudentId();
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    const fetchFavorites = async () => {
      try {
        const res = await api.get(`/favorites/student/${studentId}`);
        setFavorites(res.data);
      } catch {
        console.error("Erreur fetch favorites");
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
    loadFavorites(studentId);
  }, [studentId, loadFavorites]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = async (fav: Favorite) => {
    setConfirmRemove(null);
    setRemoving(fav.id_favorite);
    try {
      await api.delete(`/favorites/${fav.id_favorite}`);
      setFavorites((prev) => prev.filter((f) => f.id_favorite !== fav.id_favorite));
      if (studentId) {
        const next = new Set(favoriteIds);
        next.delete(fav.offer.id_offer);
        useFavoritesStore.setState({ favoriteIds: next });
      }
      showToast("success", `"${fav.offer.title}" retiré des favoris.`);
    } catch {
      showToast("error", "Erreur lors de la suppression.");
    } finally {
      setRemoving(null);
    }
  };

  const openOffers = () => {
    window.location.href = "/student/offers";
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-alert-circle"}`}></i>
          {toast.msg}
        </div>
      )}

      {confirmRemove && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ti ti-heart-off text-xl text-red-500"></i>
            </div>
            <h3 className="text-base font-semibold text-gray-800 text-center mb-2">
              Retirer des favoris ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              &laquo;&nbsp;{confirmRemove.offer.title}&nbsp;&raquo; sera retiré de vos favoris.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRemove(confirmRemove)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
          Mes favoris
        </h1>
        <p className="text-sm text-gray-500">
          Retrouvez les offres que vous avez sauvegardées.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <i className="ti ti-loader-2 animate-spin"></i>
          Chargement...
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="ti ti-heart text-3xl text-gray-300"></i>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Aucun favori pour le moment
          </p>
          <p className="text-xs text-gray-400 mb-5">
            Parcourez les offres et sauvegardez celles qui vous intéressent.
          </p>
          <button
            onClick={openOffers}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
          >
            <i className="ti ti-search"></i>
            Explorer les offres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.id_favorite}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {fav.offer.company.company_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {fav.offer.title}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {fav.offer.company.company_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmRemove(fav)}
                  disabled={removing === fav.id_favorite}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                  title="Retirer des favoris"
                >
                  {removing === fav.id_favorite ? (
                    <i className="ti ti-loader-2 animate-spin"></i>
                  ) : (
                    <i className="ti ti-heart-filled"></i>
                  )}
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
