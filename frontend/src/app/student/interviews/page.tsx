"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface Interview {
  id_interview: number;
  scheduled_at: string;
  location?: string;
  type: "ONLINE" | "ON_SITE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  application: {
    id_application: number;
    offer: {
      title: string;
      company: {
        company_name: string;
      };
    };
  };
}

const statusConfig = {
  PENDING: {
    label: "En attente",
    color: "bg-yellow-50 text-yellow-600",
    icon: "ti-clock",
  },
  CONFIRMED: {
    label: "Confirmé",
    color: "bg-green-50 text-green-600",
    icon: "ti-circle-check",
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-50 text-red-500",
    icon: "ti-circle-x",
  },
};

const typeConfig = {
  ONLINE: {
    label: "En ligne",
    icon: "ti-video",
    color: "bg-indigo-50 text-indigo-600",
  },
  ON_SITE: {
    label: "Sur site",
    icon: "ti-building",
    color: "bg-purple-50 text-purple-600",
  },
};

export default function StudentInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const appsRes = await api.get("/applications/student/2");
        const apps = appsRes.data;

        const interviewsData: Interview[] = [];
        for (const app of apps) {
          try {
            const res = await api.get(
              `/interviews/application/${app.id_application}`,
            );
            if (res.data) interviewsData.push(res.data);
          } catch {
            // tsy misy interview io application io
          }
        }
        setInterviews(interviewsData);
      } catch {
        console.error("Erreur fetch interviews");
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Mes entretiens
        </h1>
        <p className="text-sm text-gray-500">
          Suivez vos entretiens planifiés.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          {
            label: "Total",
            value: interviews.length,
            color: "indigo",
            icon: "ti-calendar",
          },
          {
            label: "En attente",
            value: interviews.filter((i) => i.status === "PENDING").length,
            color: "yellow",
            icon: "ti-clock",
          },
          {
            label: "Confirmés",
            value: interviews.filter((i) => i.status === "CONFIRMED").length,
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
      ) : interviews.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-calendar text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">
            Aucun entretien planifié pour le moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {interviews.map((interview) => {
            const status = statusConfig[interview.status];
            const type = typeConfig[interview.type];
            return (
              <div
                key={interview.id_interview}
                className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-sm transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <i className="ti ti-calendar text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {interview.application.offer.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {interview.application.offer.company.company_name}
                      </p>
                      {interview.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <i className="ti ti-map-pin text-xs"></i>
                          {interview.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-[52px] sm:ml-0">
                    <span
                      className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg ${type.color}`}
                    >
                      <i className={`ti ${type.icon}`}></i>
                      {type.label}
                    </span>
                    <div className="text-xs text-gray-500 text-right">
                      <div className="font-medium">
                        {new Date(interview.scheduled_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </div>
                      <div>
                        {new Date(interview.scheduled_at).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium ${status.color}`}
                    >
                      <i className={`ti ${status.icon}`}></i>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
