"use client";

import { useAuthStore } from "@/store/auth.store";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";

interface Stats {
  users: number;
  companies: number;
  offers: number;
  applications: number;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    companies: 0,
    offers: 0,
    applications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, companies, offers, applications] = await Promise.all([
          api.get("/users"),
          api.get("/companies"),
          api.get("/offers"),
          api.get("/applications"),
        ]);
        setStats({
          users: users.data.length,
          companies: companies.data.length,
          offers: offers.data.length,
          applications: applications.data.length,
        });
      } catch {
        console.error("Erreur fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Utilisateurs",
      value: stats.users,
      color: "indigo",
      icon: "ti-users",
      href: "/admin/users",
    },
    {
      label: "Entreprises",
      value: stats.companies,
      color: "purple",
      icon: "ti-building",
      href: "/admin/companies",
    },
    {
      label: "Offres",
      value: stats.offers,
      color: "green",
      icon: "ti-briefcase",
      href: "/admin/offers",
    },
    {
      label: "Candidatures",
      value: stats.applications,
      color: "yellow",
      icon: "ti-file-text",
      href: "/admin/applications",
    },
  ];

  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-green-50 text-green-600 border-green-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  };

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
            Bonjour, {user?.email.split("@")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Gérez la plateforme PlatStage depuis ce tableau de bord.
          </p>
        </div>
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className="ti ti-dashboard text-2xl sm:text-4xl text-indigo-400"></i>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-sm text-gray-400 mb-6">Chargement...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}
                >
                  <i className={`ti ${card.icon} text-sm`}></i>
                </div>
                <span className="text-xs text-gray-400">{card.label}</span>
              </div>
              <div className="text-2xl font-semibold text-gray-800">
                {card.value}
              </div>
              <div className="text-xs text-indigo-400 mt-1">Voir tout →</div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h3 className="text-base font-medium text-gray-700 mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            href: "/admin/users",
            icon: "ti-user-plus",
            label: "Gérer les utilisateurs",
            desc: "Voir et gérer tous les comptes",
            color: "indigo",
          },
          {
            href: "/admin/offers",
            icon: "ti-briefcase",
            label: "Gérer les offres",
            desc: "Publier ou fermer des offres",
            color: "green",
          },
          {
            href: "/admin/applications",
            icon: "ti-file-text",
            label: "Voir les candidatures",
            desc: "Suivre toutes les candidatures",
            color: "yellow",
          },
          {
            href: "/admin/categories",
            icon: "ti-tag",
            label: "Catégories & Compétences",
            desc: "Gérer les référentiels",
            color: "purple",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`bg-${action.color}-50 border border-${action.color}-100 rounded-xl p-5 hover:shadow-sm transition flex items-center gap-4`}
          >
            <div
              className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center`}
            >
              <i
                className={`ti ${action.icon} text-xl text-${action.color}-600`}
              ></i>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">
                {action.label}
              </h4>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
