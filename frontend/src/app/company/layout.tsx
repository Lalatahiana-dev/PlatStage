"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useHydrated } from "@/hooks/useHydrated";

interface Notification {
  id_notification: number;
  title?: string;
  content: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const mounted = useHydrated();
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(
        `/company/applications?q=${encodeURIComponent(search.trim())}`,
      );
      setSearch("");
    }
  };
  useEffect(() => {
    if (!user) router.push("/login");
    else if (!user.roles.includes("COMPANY") && !user.roles.includes("ADMIN")) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.get(`/notifications/user/${user?.userId}`);
        setNotifications(res.data);
      } catch {
        console.error("Erreur fetch notifications");
      }
    };
    if (user) loadNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id_notification: number) => {
    try {
      await api.put(`/notifications/${id_notification}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id_notification === id_notification ? { ...n, is_read: true } : n,
        ),
      );
    } catch {
      console.error("Erreur mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(`/notifications/user/${user?.userId}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      console.error("Erreur mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeIcons: Record<string, string> = {
    NEW_APPLICATION: "ti-file-text",
    ACCEPTED: "ti-circle-check",
    REFUSED: "ti-circle-x",
    NEW_MESSAGE: "ti-message",
  };

  const navItems = [
    { href: "/company", icon: "ti-home", label: "Accueil" },
    { href: "/company/offers", icon: "ti-briefcase", label: "Mes offres" },
    {
      href: "/company/applications",
      icon: "ti-file-text",
      label: "Candidatures",
    },
    { href: "/company/interviews", icon: "ti-calendar", label: "Entretiens" },
    { href: "/company/messages", icon: "ti-message", label: "Messages" },
    {
      href: "/company/profile",
      icon: "ti-building",
      label: "Profil entreprise",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-3 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-3 mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-sm">P</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">PlatStage</div>
            <div className="text-xs text-gray-400">Espace entreprise</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
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

      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sm:gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            aria-label="Open menu"
          >
            <i className="ti ti-menu-2 text-xl"></i>
          </button>

          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 min-w-0">
            <i className="ti ti-search text-gray-400 text-sm flex-shrink-0"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Rechercher un candidat... (Entrée)"
              className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <i className="ti ti-x text-xs"></i>
              </button>
            )}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative cursor-pointer p-1"
            >
              <i className="ti ti-bell text-gray-500 text-lg"></i>
              {mounted && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                </div>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-10 w-72 sm:w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <i className="ti ti-bell text-3xl text-gray-300 block mb-2"></i>
                      <p className="text-xs text-gray-400">
                        Aucune notification
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id_notification}
                        onClick={() => handleMarkAsRead(notif.id_notification)}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!notif.is_read ? "bg-indigo-50" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!notif.is_read ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          <i
                            className={`ti ${typeIcons[notif.type ?? ""] ?? "ti-bell"} text-sm`}
                          ></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          {notif.title && (
                            <p className="text-xs font-semibold text-gray-800 mb-0.5">
                              {notif.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {notif.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 cursor-pointer min-w-0">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600 flex-shrink-0">
              {mounted ? (user?.email?.charAt(0).toUpperCase() ?? "C") : ""}
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">
                {mounted ? (user?.email ?? "") : ""}
              </div>
              <div className="text-xs text-gray-400">Entreprise</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
