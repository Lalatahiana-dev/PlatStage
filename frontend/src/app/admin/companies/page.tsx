'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface Company {
  id_company: number;
  company_name: string;
  sector?: string;
  description?: string;
  website?: string;
  address?: string;
  is_verified: boolean;
  created_at: string;
  user: {
    id_user: number;
    nom: string;
    prenom: string;
    email: string;
  };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await api.get('/companies');
        setCompanies(res.data);
      } catch {
        console.error('Erreur fetch companies');
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector?.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id_company: number) => {
    if (!confirm('Supprimer cette entreprise ?')) return;
    try {
      await api.delete(`/companies/${id_company}`);
      setCompanies((prev) => prev.filter((c) => c.id_company !== id_company));
    } catch {
      console.error('Erreur delete company');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Entreprises</h1>
          <p className="text-sm text-gray-500">Gérez toutes les entreprises.</p>
        </div>
        <div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-sm font-medium">
          {companies.length} entreprises
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 mb-6">
        <i className="ti ti-search text-gray-400"></i>
        <input
          type="text"
          placeholder="Rechercher par nom, secteur, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((company) => (
            <div key={company.id_company} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg flex-shrink-0">
                    {company.company_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">{company.company_name}</h3>
                      {company.is_verified && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg">
                          <i className="ti ti-circle-check mr-1"></i>Vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{company.sector}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      <i className="ti ti-user mr-1"></i>
                      {company.user.prenom} {company.user.nom} — {company.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {company.address && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <i className="ti ti-map-pin"></i>
                      {company.address}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(company.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <button
                    onClick={() => handleDelete(company.id_company)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <i className="ti ti-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}