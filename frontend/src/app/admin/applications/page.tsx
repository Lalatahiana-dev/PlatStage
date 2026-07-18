"use client";

import { useEffect, useState } from "react";
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
  offer: {
    id_offer: number;
    title: string;
    company: {
      company_name: string;
    };
  };
}

const statusConfig = {
  EN_ATTENTE: { label: "En attente", color: "bg-yellow-50 text-yellow-600" },
  ACCEPTEE: { label: "Acceptée", color: "bg-green-50 text-green-600" },
  REFUSEE: { label: "Refusée", color: "bg-red-50 text-red-500" },
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE"
  >("ALL");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await api.get("/applications");
        setApplications(res.data);
      } catch {
        console.error("Erreur fetch applications");
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

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

  const filtered = applications.filter((a) => {
    const matchSearch =
      a.student.user.nom.toLowerCase().includes(search.toLowerCase()) ||
      a.student.user.email.toLowerCase().includes(search.toLowerCase()) ||
      a.offer.title.toLowerCase().includes(search.toLowerCase()) ||
      a.offer.company.company_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
            Candidatures
          </h1>
          <p className="text-sm text-gray-500">
            Gérez toutes les candidatures.
          </p>
        </div>
        <div className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-xl text-sm font-medium self-start">
          {applications.length} candidatures
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <i className="ti ti-search text-gray-400"></i>
          <input
            type="text"
            placeholder="Rechercher par étudiant, offre, entreprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "EN_ATTENTE", "ACCEPTEE", "REFUSEE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs rounded-lg transition ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "ALL" ? "Tous" : statusConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          {
            label: "En attente",
            value: applications.filter((a) => a.status === "EN_ATTENTE").length,
            color: "yellow",
            icon: "ti-clock",
          },
          {
            label: "Acceptées",
            value: applications.filter((a) => a.status === "ACCEPTEE").length,
            color: "green",
            icon: "ti-circle-check",
          },
          {
            label: "Refusées",
            value: applications.filter((a) => a.status === "REFUSEE").length,
            color: "red",
            icon: "ti-circle-x",
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
          <p className="text-sm text-gray-400">Aucune candidature trouvée.</p>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
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
                      <p className="text-xs text-indigo-500 mt-1">
                        <i className="ti ti-briefcase mr-1"></i>
                        {app.offer.title} — {app.offer.company.company_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
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
                  <div className="mt-3 sm:ml-14 bg-gray-50 rounded-lg p-3">
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
