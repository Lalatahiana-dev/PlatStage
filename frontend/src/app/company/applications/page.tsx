"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";

interface Application {
  id_application: number;
  motivation?: string;
  status: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  applied_at: string;
  student: {
    id_student: number;
    university?: string;
    level?: string;
    user: {
      nom: string;
      prenom: string;
      email: string;
    };
  };
}

interface Offer {
  id_offer: number;
  title: string;
}

const statusConfig = {
  EN_ATTENTE: { label: "En attente", color: "bg-yellow-50 text-yellow-600" },
  ACCEPTEE: { label: "Acceptée", color: "bg-green-50 text-green-600" },
  REFUSEE: { label: "Refusée", color: "bg-red-50 text-red-500" },
};

function CompanyApplicationsContent() {
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const fetchApplications = useCallback(async (id_offer: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/offer/${id_offer}`);
      setApplications(res.data);
    } catch {
      console.error("Erreur fetch applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get("/offers/company/2");
        setOffers(res.data);
        if (res.data.length > 0) {
          setSelectedOffer(res.data[0].id_offer);
          await fetchApplications(res.data[0].id_offer);
        } else {
          setLoading(false);
        }
      } catch {
        console.error("Erreur fetch offers");
        setLoading(false);
      }
    };
    fetchOffers();
  }, [fetchApplications]);

  const handleOfferChange = async (id_offer: number) => {
    setSelectedOffer(id_offer);
    await fetchApplications(id_offer);
  };

  const handleStatusChange = async (id_application: number, status: string) => {
    setUpdating(id_application);
    try {
      await api.put(`/applications/${id_application}/status`, { status });
      setApplications((prev) =>
        prev.map((a) =>
          a.id_application === id_application
            ? { ...a, status: status as Application["status"] }
            : a,
        ),
      );
    } catch {
      console.error("Erreur update status");
    } finally {
      setUpdating(null);
    }
  };

  // ✅ Filter arakaraka ny search
  const filtered = applications.filter(
    (app) =>
      search === "" ||
      app.student.user.nom.toLowerCase().includes(search.toLowerCase()) ||
      app.student.user.prenom.toLowerCase().includes(search.toLowerCase()) ||
      app.student.user.email.toLowerCase().includes(search.toLowerCase()) ||
      app.student.university?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Candidatures reçues
        </h1>
        <p className="text-sm text-gray-500">
          Gérez les candidatures pour vos offres de stage.
        </p>
      </div>

      {/* ✅ Search bar */}
      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 mb-4">
        <i className="ti ti-search text-gray-400"></i>
        <input
          type="text"
          placeholder="Rechercher par nom, email, université..."
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

      {offers.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {offers.map((offer) => (
            <button
              key={offer.id_offer}
              onClick={() => handleOfferChange(offer.id_offer)}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                selectedOffer === offer.id_offer
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {offer.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: filtered.length,
            color: "indigo",
            icon: "ti-file-text",
          },
          {
            label: "En attente",
            value: filtered.filter((a) => a.status === "EN_ATTENTE").length,
            color: "yellow",
            icon: "ti-clock",
          },
          {
            label: "Acceptées",
            value: filtered.filter((a) => a.status === "ACCEPTEE").length,
            color: "green",
            icon: "ti-circle-check",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${s.color}-50 text-${s.color}-600`}
            >
              <i className={`ti ${s.icon} text-lg`}></i>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-800">
                {s.value}
              </div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-file-text text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">
            {search
              ? `Aucun candidat trouvé pour "${search}"`
              : "Aucune candidature pour cette offre."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const status = statusConfig[app.status];
            return (
              <div
                key={app.id_application}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {app.student.user.prenom.charAt(0)}
                      {app.student.user.nom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {app.student.user.prenom} {app.student.user.nom}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {app.student.user.email}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {app.student.university && (
                          <span className="text-xs text-gray-400">
                            <i className="ti ti-school mr-1"></i>
                            {app.student.university}
                          </span>
                        )}
                        {app.student.level && (
                          <span className="text-xs text-gray-400">
                            <i className="ti ti-certificate mr-1"></i>
                            {app.student.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                      {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-lg font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {app.status === "EN_ATTENTE" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(app.id_application, "ACCEPTEE")
                          }
                          disabled={updating === app.id_application}
                          className="px-3 py-1.5 bg-green-50 text-green-600 text-xs rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(app.id_application, "REFUSEE")
                          }
                          disabled={updating === app.id_application}
                          className="px-3 py-1.5 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {app.motivation && (
                  <div className="mt-3 ml-14 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 italic">
                      &quot;{app.motivation}&quot;
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CompanyApplicationsPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-gray-400">Chargement...</div>}
    >
      <CompanyApplicationsContent />
    </Suspense>
  );
}
