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

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const mounted = useHydrated();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) router.push("/login");
    else if (!user.roles.includes("STUDENT") && !user.roles.includes("ADMIN")) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.get(`/notifications/user/${user?.userId}`);
        setNotifications(res.data);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "response" in err) {
          const axiosErr = err as {
            response: { data: unknown; status: number };
          };
          console.error(
            "Notif error:",
            JSON.stringify(axiosErr.response.data),
            axiosErr.response.status,
          );
        } else {
          console.error("Notif unknown error:", err);
        }
      }
    };
    if (user) loadNotifications();
  }, [user]);

  // Close dropdown raha click ivelan'ny notif
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
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response: { data: unknown; status: number } };
        console.error(
          "Mark as read error:",
          JSON.stringify(axiosErr.response.data),
          axiosErr.response.status,
        );
      }
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/student/offers?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const navItems = [
    { href: "/student", icon: "ti-home", label: "Accueil" },
    { href: "/student/offers", icon: "ti-search", label: "Offres de stage" },
    {
      href: "/student/applications",
      icon: "ti-file-text",
      label: "Mes candidatures",
    },
    { href: "/student/interviews", icon: "ti-calendar", label: "Entretiens" },
    { href: "/student/favorites", icon: "ti-heart", label: "Favoris" },
    { href: "/student/messages", icon: "ti-message", label: "Messages" },
    { href: "/student/profile", icon: "ti-user", label: "Profil" },
  ];

  const typeIcons: Record<string, string> = {
    NEW_APPLICATION: "ti-file-text",
    ACCEPTED: "ti-circle-check",
    REFUSED: "ti-circle-x",
    NEW_MESSAGE: "ti-message",
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-3 fixed h-full">
        <div className="flex items-center gap-2 px-3 mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-sm">P</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">PlatStage</div>
            <div className="text-xs text-gray-400">Plateforme de stage</div>
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

        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-4">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Complétez votre profil
          </div>
          <div className="text-xs text-gray-400 mb-2">
            Un profil complet augmente vos chances.
          </div>
          <div className="bg-gray-200 rounded-full h-1 mb-1">
            <div className="bg-indigo-500 h-1 rounded-full w-4/5"></div>
          </div>
          <div className="text-xs text-indigo-500 font-medium">
            80% — Continuer →
          </div>
        </div>

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
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <i className="ti ti-search text-gray-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Rechercher un stage, une entreprise... (Entrée)"
              className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
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

          {/* ✅ Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative cursor-pointer p-1"
            >
              <i className="ti ti-bell text-gray-500 text-lg"></i>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                </div>
              )}
            </button>

            {/* Dropdown */}
            {showNotif && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50">
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
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${
                          !notif.is_read ? "bg-indigo-50" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            !notif.is_read
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
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

          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
              {mounted ? (user?.email?.charAt(0).toUpperCase() ?? "?") : ""}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">
                {mounted ? (user?.email ?? "") : ""}
              </div>
              <div className="text-xs text-gray-400">Étudiant</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
