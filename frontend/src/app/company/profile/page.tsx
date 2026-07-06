"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface CompanyProfile {
  id_company: number;
  company_name: string;
  sector?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  address?: string;
  is_verified: boolean;
  user: {
    id_user: number;
    nom: string;
    prenom: string;
    email: string;
  };
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    sector: "",
    description: "",
    website: "",
    address: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/companies/2"); // id_company
        setProfile(res.data);
        setForm({
          company_name: res.data.company_name ?? "",
          sector: res.data.sector ?? "",
          description: res.data.description ?? "",
          website: res.data.website ?? "",
          address: res.data.address ?? "",
        });
      } catch {
        console.error("Erreur fetch profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.put("/companies/2", form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response: { data: unknown; status: number } };
        console.error(
          "Erreur update profile:",
          JSON.stringify(axiosErr.response.data),
        );
        console.error("Status:", axiosErr.response.status);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-sm text-gray-400">Chargement...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Profil entreprise
        </h1>
        <p className="text-sm text-gray-500">
          Gérez les informations de votre entreprise.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Info card */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center h-fit">
          <div className="w-20 h-20 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-2xl mx-auto mb-3">
            {profile?.company_name.charAt(0)}
          </div>
          <h3 className="text-base font-semibold text-gray-800">
            {profile?.company_name}
          </h3>
          <p className="text-sm text-gray-400 mb-2">{profile?.sector}</p>
          {profile?.is_verified && (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">
              <i className="ti ti-circle-check mr-1"></i>Vérifié
            </span>
          )}
          <div className="text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-2 mt-4">
            {profile?.website && (
              <div className="flex items-center gap-2">
                <i className="ti ti-world"></i>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:underline truncate"
                >
                  {profile.website}
                </a>
              </div>
            )}
            {profile?.address && (
              <div className="flex items-center gap-2">
                <i className="ti ti-map-pin"></i> {profile.address}
              </div>
            )}
            <div className="flex items-center gap-2">
              <i className="ti ti-mail"></i> {profile?.user.email}
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Informations entreprise
            </h3>

            {success && (
              <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-lg mb-4">
                Profil mis à jour avec succès !
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nom de l&apos;entreprise *
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Secteur
                </label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Informatique, Finance..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={3}
                  placeholder="Décrivez votre entreprise..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Antananarivo..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="self-start px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
