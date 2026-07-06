"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const mounted = useHydrated();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) router.push("/login");
    else if (!user.roles.includes("ADMIN")) router.push("/");
  }, [user, router]);

  const navItems = [
    { href: "/admin", icon: "ti-home", label: "Dashboard" },
    { href: "/admin/users", icon: "ti-users", label: "Utilisateurs" },
    { href: "/admin/companies", icon: "ti-building", label: "Entreprises" },
    { href: "/admin/offers", icon: "ti-briefcase", label: "Offres" },
    {
      href: "/admin/applications",
      icon: "ti-file-text",
      label: "Candidatures",
    },
    { href: "/admin/interviews", icon: "ti-calendar", label: "Entretiens" },
    { href: "/admin/categories", icon: "ti-tag", label: "Catégories" },
    { href: "/admin/skills", icon: "ti-star", label: "Compétences" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-3 fixed h-full">
        <div className="flex items-center gap-2 px-3 mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-sm">P</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">PlatStage</div>
            <div className="text-xs text-gray-400">Administration</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <i className={`ti ${item.icon} text-base`}></i>
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-50 mt-2 transition"
        >
          <i className="ti ti-logout text-base"></i>
          Déconnexion
        </button>
      </aside>

      <div className="ml-56 flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-4 sticky top-0 z-10">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
              {mounted ? (user?.email?.charAt(0).toUpperCase() ?? "A") : ""}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">
                {mounted ? (user?.email ?? "") : ""}
              </div>
              <div className="text-xs text-gray-400">Administrateur</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
