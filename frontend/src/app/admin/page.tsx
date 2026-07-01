'use client';

import { useAuthStore } from '@/store/auth.store';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Stats {
  offers: number;
  applications: number;
  pending: number;
  accepted: number;
  favorites: number;
}

export default function StudentPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    offers: 0,
    applications: 0,
    pending: 0,
    accepted: 0,
    favorites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [offers, applications, favorites] = await Promise.all([
          api.get('/offers'),
          api.get(`/applications/student/2`), // id_student
          api.get(`/favorites/student/2`),    // id_student
        ]);

        const apps = applications.data;
        setStats({
          offers: offers.data.length,
          applications: apps.length,
          pending: apps.filter((a: { status: string }) => a.status === 'EN_ATTENTE').length,
          accepted: apps.filter((a: { status: string }) => a.status === 'ACCEPTEE').length,
          favorites: favorites.data.length,
        });
      } catch {
        console.error('Erreur fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Stages disponibles', value: stats.offers, color: 'indigo', icon: 'ti-briefcase', sub: 'offres publiées' },
    { label: 'Candidatures envoyées', value: stats.applications, color: 'green', icon: 'ti-send', sub: 'au total' },
    { label: 'En attente', value: stats.pending, color: 'yellow', icon: 'ti-clock', sub: 'en cours' },
    { label: 'Acceptées', value: stats.accepted, color: 'emerald', icon: 'ti-circle-check', sub: 'ce mois-ci' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            Bonjour, {user?.email.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Prêt à transformer votre carrière ? Découvrez des opportunités et avancez vers votre avenir professionnel.
          </p>
        </div>
        <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center">
          <i className="ti ti-school text-4xl text-indigo-400"></i>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-sm text-gray-400 mb-6">Chargement...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                  <i className={`ti ${card.icon} text-sm`}></i>
                </div>
                <span className="text-xs text-gray-400">{card.label}</span>
              </div>
              <div className="text-2xl font-semibold text-gray-800">{card.value}</div>
              <div className="text-xs text-gray-400">{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Hero banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6 flex justify-between items-center">
        <div>
          <div className="text-xs text-indigo-500 font-medium mb-1">Trouvez le stage qui vous correspond</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Votre avenir commence avec <span className="text-indigo-600">le bon stage.</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            PlatStage vous aide à trouver, postuler et suivre vos stages en toute simplicité.
          </p>
          <div className="flex gap-3">
            <Link
              href="/student/offers"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
            >
              Découvrir les offres
            </Link>
            <Link
              href="/student/profile"
              className="px-4 py-2 border border-indigo-300 text-indigo-600 text-sm rounded-lg hover:bg-indigo-50 transition"
            >
              Compléter mon profil
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2">
            <i className="ti ti-users text-indigo-500"></i>
            <div>
              <div className="text-sm font-medium text-gray-700">+500</div>
              <div className="text-xs text-gray-400">Entreprises partenaires</div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2">
            <i className="ti ti-briefcase text-green-500"></i>
            <div>
              <div className="text-sm font-medium text-gray-700">+2000</div>
              <div className="text-xs text-gray-400">Stages disponibles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-gray-700">Comment ça marche ?</h3>
          <span className="text-sm text-indigo-500 cursor-pointer">Voir toutes les étapes →</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { num: '1', label: 'Créez votre profil', desc: 'Inscrivez-vous et complétez votre profil en quelques minutes.', color: 'indigo', icon: 'ti-user' },
            { num: '2', label: 'Trouvez des offres', desc: 'Consultez les offres qui correspondent à votre profil.', color: 'green', icon: 'ti-search' },
            { num: '3', label: 'Postulez facilement', desc: "Envoyez votre candidature en ligne en quelques clics.", color: 'yellow', icon: 'ti-send' },
            { num: '4', label: 'Suivez votre progression', desc: "Suivez l'état de vos candidatures et entretiens.", color: 'purple', icon: 'ti-chart-bar' },
          ].map((step) => (
            <div key={step.num} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${colorMap[step.color] ?? 'bg-purple-50 text-purple-600'}`}>
                <i className={`ti ${step.icon} text-base`}></i>
              </div>
              <div className={`text-xs font-medium mb-1 ${step.color === 'purple' ? 'text-purple-600' : `text-${step.color}-600`}`}>
                {step.num}. {step.label}
              </div>
              <div className="text-xs text-gray-400">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { value: '2500+', label: 'Étudiants inscrits', icon: 'ti-users', color: 'text-indigo-500' },
          { value: '500+', label: 'Entreprises partenaires', icon: 'ti-building', color: 'text-green-500' },
          { value: '2000+', label: 'Stages disponibles', icon: 'ti-briefcase', color: 'text-yellow-500' },
          { value: '98%', label: 'Taux de satisfaction', icon: 'ti-star', color: 'text-purple-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <i className={`ti ${s.icon} text-2xl ${s.color}`}></i>
            <div>
              <div className={`text-base font-semibold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}