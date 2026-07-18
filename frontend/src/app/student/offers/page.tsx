"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";

interface Offer {
  id_offer: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: number;
  deadline?: string;
  status: string;
  company: {
    company_name: string;
    logo_url?: string;
    sector?: string;
  };
  categories: { category: { id_category: number; name: string } }[];
}

function OffersContent() {
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [applying, setApplying] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get("/offers");
        setOffers(res.data);
      } catch {
        console.error("Erreur fetch offers");
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleApply = async (id_offer: number) => {
    setApplying(id_offer);
    setError(null);
    try {
      await api.post("/applications", {
        id_student: 2,
        id_offer,
        motivation: "",
      });
      setSuccess(id_offer);
    } catch {
      setError(id_offer);
    } finally {
      setApplying(null);
    }
  };

  const filtered = offers.filter(
    (o) =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.company.company_name.toLowerCase().includes(search.toLowerCase()) ||
      o.location?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
          Offres de stage
        </h1>
        <p className="text-sm text-gray-500">
          Découvrez les offres disponibles et postulez en un clic.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 mb-6">
        <i className="ti ti-search text-gray-400"></i>
        <input
          type="text"
          placeholder="Rechercher par titre, entreprise, lieu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="ti ti-x text-xs"></i>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-search text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">
            Aucune offre trouvée pour &quot;{search}&quot;
          </p>
          <button
            onClick={() => setSearch("")}
            className="text-xs text-indigo-500 mt-2 hover:underline"
          >
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((offer) => (
            <div
              key={offer.id_offer}
              className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 hover:shadow-sm transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {offer.company.company_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-800">
                        {offer.title}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {offer.company.company_name} — {offer.company.sector}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2 mb-3 line-clamp-2">
                    {offer.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {offer.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        <i className="ti ti-map-pin text-xs"></i>
                        {offer.location}
                      </span>
                    )}
                    {offer.salary && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        <i className="ti ti-cash text-xs"></i>
                        {offer.salary.toLocaleString()} Ar
                      </span>
                    )}
                    {offer.deadline && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        <i className="ti ti-calendar text-xs"></i>
                        {new Date(offer.deadline).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    {offer.categories.map((c) => (
                      <span
                        key={c.category.id_category}
                        className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg"
                      >
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2 sm:ml-4 flex-shrink-0">
                  {success === offer.id_offer ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <i className="ti ti-circle-check"></i>
                      Candidature envoyée !
                    </span>
                  ) : error === offer.id_offer ? (
                    <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                      <i className="ti ti-alert-circle"></i>
                      Déjà postulé
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(offer.id_offer)}
                      disabled={applying === offer.id_offer}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {applying === offer.id_offer ? "Envoi..." : "Postuler"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentOffersPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-gray-400">Chargement...</div>}
    >
      <OffersContent />
    </Suspense>
  );
}
