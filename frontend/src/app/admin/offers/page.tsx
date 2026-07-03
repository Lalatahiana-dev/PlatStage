'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface Offer {
  id_offer: number;
  title: string;
  description: string;
  location?: string;
  salary?: number;
  deadline?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  created_at: string;
  company: {
    company_name: string;
    sector?: string;
  };
  categories: { category: { name: string } }[];
}

const statusConfig = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: 'Publiée', color: 'bg-green-50 text-green-600' },
  CLOSED: { label: 'Fermée', color: 'bg-red-50 text-red-500' },
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED'>('ALL');

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const res = await api.get('/offers');
        setOffers(res.data);
      } catch {
        console.error('Erreur fetch offers');
      } finally {
        setLoading(false);
      }
    };
    loadOffers();
  }, []);

  const handleDelete = async (id_offer: number) => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      await api.delete(`/offers/${id_offer}`);
      setOffers((prev) => prev.filter((o) => o.id_offer !== id_offer));
    } catch {
      console.error('Erreur delete offer');
    }
  };

  const handleStatusChange = async (id_offer: number, status: string) => {
    try {
      await api.put(`/offers/${id_offer}`, { status });
      setOffers((prev) =>
        prev.map((o) => o.id_offer === id_offer ? { ...o, status: status as Offer['status'] } : o)
      );
    } catch {
      console.error('Erreur status change');
    }
  };

  const filtered = offers.filter((o) => {
    const matchSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.company.company_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Offres de stage</h1>
          <p className="text-sm text-gray-500">Gérez toutes les offres publiées.</p>
        </div>
        <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-medium">
          {offers.length} offres
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <i className="ti ti-search text-gray-400"></i>
          <input
            type="text"
            placeholder="Rechercher par titre, entreprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED'] as const).map((f) => (
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
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-briefcase text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">Aucune offre trouvée.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((offer) => {
            const status = statusConfig[offer.status];
            return (
              <div key={offer.id_offer} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-gray-800">{offer.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-lg ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      <i className="ti ti-building mr-1"></i>
                      {offer.company.company_name}
                      {offer.company.sector && ` — ${offer.company.sector}`}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {offer.location && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <i className="ti ti-map-pin"></i>{offer.location}
                        </span>
                      )}
                      {offer.salary && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <i className="ti ti-cash"></i>{offer.salary.toLocaleString()} Ar
                        </span>
                      )}
                      {offer.deadline && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <i className="ti ti-calendar"></i>
                          {new Date(offer.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {offer.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(offer.id_offer, 'PUBLISHED')}
                        className="px-3 py-1.5 bg-green-50 text-green-600 text-xs rounded-lg hover:bg-green-100 transition"
                      >
                        Publier
                      </button>
                    )}
                    {offer.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleStatusChange(offer.id_offer, 'CLOSED')}
                        className="px-3 py-1.5 bg-yellow-50 text-yellow-600 text-xs rounded-lg hover:bg-yellow-100 transition"
                      >
                        Fermer
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(offer.id_offer)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <i className="ti ti-trash text-sm"></i>
                    </button>
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