"use client";

import { useAuthStore } from "@/store/auth.store";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";

interface Stats {
  offers: number;
  applications: number;
  pending: number;
  interviews: number;
}

export default function CompanyPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    offers: 0,
    applications: 0,
    pending: 0,
    interviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const offersRes = await api.get("/offers");
        const myOffers = offersRes.data.filter(
          (o: { company: { company_name: string } }) =>
            o.company.company_name === "Tech Madagascar",
        );

        // Hahazo applications an'ny offer tsirairay
        let totalApps = 0;
        let pendingApps = 0;
        for (const offer of myOffers) {
          const appsRes = await api.get(
            `/applications/offer/${offer.id_offer}`,
          );
          totalApps += appsRes.data.length;
          pendingApps += appsRes.data.filter(
            (a: { status: string }) => a.status === "EN_ATTENTE",
          ).length;
        }

        setStats({
          offers: myOffers.length,
          applications: totalApps,
          pending: pendingApps,
          interviews: 0,
        });
      } catch {
        console.error("Erreur fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
            Bonjour, {user?.email.split("@")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Gérez vos offres de stage et trouvez les meilleurs talents.
          </p>
        </div>
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className="ti ti-building text-2xl sm:text-4xl text-indigo-400"></i>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-sm text-gray-400 mb-6">Chargement...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: "Mes offres",
              value: stats.offers,
              color: "indigo",
              icon: "ti-briefcase",
            },
            {
              label: "Candidatures reçues",
              value: stats.applications,
              color: "green",
              icon: "ti-file-text",
            },
            {
              label: "En attente",
              value: stats.pending,
              color: "yellow",
              icon: "ti-clock",
            },
            {
              label: "Entretiens",
              value: stats.interviews,
              color: "purple",
              icon: "ti-calendar",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${card.color}-50 text-${card.color}-600`}
                >
                  <i className={`ti ${card.icon} text-sm`}></i>
                </div>
                <span className="text-xs text-gray-400">{card.label}</span>
              </div>
              <div className="text-2xl font-semibold text-gray-800">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/company/offers"
          className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 hover:shadow-sm transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <i className="ti ti-plus text-xl text-indigo-600"></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Publier une offre
            </h3>
            <p className="text-xs text-gray-500">
              Créez une nouvelle offre de stage
            </p>
          </div>
        </Link>

        <Link
          href="/company/applications"
          className="bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-sm transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i className="ti ti-users text-xl text-green-600"></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Voir les candidatures
            </h3>
            <p className="text-xs text-gray-500">
              Consultez les candidats intéressés
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
