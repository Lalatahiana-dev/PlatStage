'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface Interview {
  id_interview: number;
  scheduled_at: string;
  location?: string;
  type: 'ONLINE' | 'ON_SITE';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  application: {
    id_application: number;
    offer: {
      title: string;
      company: { company_name: string };
    };
    student: {
      user: { nom: string; prenom: string; email: string };
    };
  };
}

const statusConfig = {
  PENDING: { label: 'En attente', color: 'bg-yellow-50 text-yellow-600' },
  CONFIRMED: { label: 'Confirmé', color: 'bg-green-50 text-green-600' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-50 text-red-500' },
};

const typeConfig = {
  ONLINE: { label: 'En ligne', icon: 'ti-video', color: 'bg-indigo-50 text-indigo-600' },
  ON_SITE: { label: 'Sur site', icon: 'ti-building', color: 'bg-purple-50 text-purple-600' },
};

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const res = await api.get('/interviews');
        setInterviews(res.data);
      } catch {
        console.error('Erreur fetch interviews');
      } finally {
        setLoading(false);
      }
    };
    loadInterviews();
  }, []);

  const handleStatusChange = async (id_interview: number, status: string) => {
    setUpdating(id_interview);
    try {
      await api.put(`/interviews/${id_interview}`, { status });
      setInterviews((prev) =>
        prev.map((i) =>
          i.id_interview === id_interview
            ? { ...i, status: status as Interview['status'] }
            : i
        )
      );
    } catch {
      console.error('Erreur update status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = interviews.filter(
    (i) => filter === 'ALL' || i.status === filter
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Entretiens</h1>
          <p className="text-sm text-gray-500">Gérez tous les entretiens planifiés.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium">
          {interviews.length} entretiens
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs rounded-lg transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? 'Tous' : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En attente', value: interviews.filter(i => i.status === 'PENDING').length, color: 'yellow', icon: 'ti-clock' },
          { label: 'Confirmés', value: interviews.filter(i => i.status === 'CONFIRMED').length, color: 'green', icon: 'ti-circle-check' },
          { label: 'Annulés', value: interviews.filter(i => i.status === 'CANCELLED').length, color: 'red', icon: 'ti-circle-x' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${s.color}-50 text-${s.color}-600`}>
              <i className={`ti ${s.icon} text-lg`}></i>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-calendar text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">Aucun entretien trouvé.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((interview) => {
            const status = statusConfig[interview.status];
            const type = typeConfig[interview.type];
            return (
              <div key={interview.id_interview} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {interview.application.student.user.prenom.charAt(0)}
                      {interview.application.student.user.nom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {interview.application.student.user.prenom}{' '}
                        {interview.application.student.user.nom}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {interview.application.student.user.email}
                      </p>
                      <p className="text-xs text-indigo-500 mt-1">
                        <i className="ti ti-briefcase mr-1"></i>
                        {interview.application.offer.title} —{' '}
                        {interview.application.offer.company.company_name}
                      </p>
                      {interview.location && (
                        <p className="text-xs text-gray-400 mt-1">
                          <i className="ti ti-map-pin mr-1"></i>
                          {interview.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg ${type.color}`}>
                      <i className={`ti ${type.icon}`}></i>
                      {type.label}
                    </span>
                    <div className="text-xs text-gray-500 text-right">
                      <div className="font-medium">
                        {new Date(interview.scheduled_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div>
                        {new Date(interview.scheduled_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-lg font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {interview.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(interview.id_interview, 'CONFIRMED')}
                          disabled={updating === interview.id_interview}
                          className="px-3 py-1.5 bg-green-50 text-green-600 text-xs rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => handleStatusChange(interview.id_interview, 'CANCELLED')}
                          disabled={updating === interview.id_interview}
                          className="px-3 py-1.5 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
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