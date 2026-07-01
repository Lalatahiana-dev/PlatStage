'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!user.roles.includes('STUDENT') && !user.roles.includes('ADMIN')) {
      router.push('/');
    }
  }, [user, router]);

  const navItems = [
    { href: '/student', icon: 'ti-home', label: 'Accueil' },
    { href: '/student/offers', icon: 'ti-search', label: 'Offres de stage' },
    { href: '/student/applications', icon: 'ti-file-text', label: 'Mes candidatures' },
    { href: '/student/interviews', icon: 'ti-calendar', label: 'Entretiens' },
    { href: '/student/favorites', icon: 'ti-heart', label: 'Favoris' },
    { href: '/student/messages', icon: 'ti-message', label: 'Messages' },
    { href: '/student/profile', icon: 'ti-user', label: 'Profil' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-3 fixed h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-sm">P</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">PlatStage</div>
            <div className="text-xs text-gray-400">Plateforme de stage</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <i className={`ti ${item.icon} text-base`}></i>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile completion */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-4">
          <div className="text-xs font-medium text-gray-700 mb-1">Complétez votre profil</div>
          <div className="text-xs text-gray-400 mb-2">Un profil complet augmente vos chances.</div>
          <div className="bg-gray-200 rounded-full h-1 mb-1">
            <div className="bg-indigo-500 h-1 rounded-full w-4/5"></div>
          </div>
          <div className="text-xs text-indigo-500 font-medium">80% — Continuer →</div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-50 mt-2 transition"
        >
          <i className="ti ti-logout text-base"></i>
          Déconnexion
        </button>
      </aside>

      {/* Main */}
      <div className="ml-56 flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-4 sticky top-0 z-10">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <i className="ti ti-search text-gray-400 text-sm"></i>
            <span className="text-sm text-gray-400">Rechercher un stage, une entreprise...</span>
          </div>
          <div className="relative cursor-pointer">
            <i className="ti ti-bell text-gray-500 text-lg"></i>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">{user?.email}</div>
              <div className="text-xs text-gray-400">Étudiant</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}