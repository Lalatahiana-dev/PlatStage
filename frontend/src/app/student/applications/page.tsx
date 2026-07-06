"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface Application {
  id_application: number;
  motivation?: string;
  status: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  applied_at: string;
  offer: {
    id_offer: number;
    title: string;
    location?: string;
    company: {
      company_name: string;
      logo_url?: string;
    };
  };
}

const statusConfig = {
  EN_ATTENTE: {
    label: "En attente",
    color: "bg-yellow-50 text-yellow-600",
    icon: "ti-clock",
  },
  ACCEPTEE: {
    label: "Acceptée",
    color: "bg-green-50 text-green-600",
    icon: "ti-circle-check",
  },
  REFUSEE: {
    label: "Refusée",
    color: "bg-red-50 text-red-500",
    icon: "ti-circle-x",
  },
};

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get("/applications/student/2"); // id_student
        setApplications(res.data);
      } catch {
        console.error("Erreur fetch applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Mes candidatures
        </h1>
        <p className="text-sm text-gray-500">
          Suivez l&apos;état de vos candidatures.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: applications.length,
            color: "indigo",
            icon: "ti-file-text",
          },
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

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-file-text text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">
            Aucune candidature pour le moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const status = statusConfig[app.status];
            return (
              <div
                key={app.id_application}
                className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-sm transition"
              >
                {/* Left */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {app.offer.company.company_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {app.offer.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {app.offer.company.company_name}
                    </p>
                    {app.offer.location && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <i className="ti ti-map-pin text-xs"></i>
                        {app.offer.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                  <div className="text-xs text-gray-400">
                    <i className="ti ti-calendar mr-1"></i>
                    {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium ${status.color}`}
                  >
                    <i className={`ti ${status.icon}`}></i>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
