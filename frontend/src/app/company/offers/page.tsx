"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface Offer {
  id_offer: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: number;
  deadline?: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  company: { company_name: string };
  categories: { category: { id_category: number; name: string } }[];
}

const statusConfig = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  PUBLISHED: { label: "Publiée", color: "bg-green-50 text-green-600" },
  CLOSED: { label: "Fermée", color: "bg-red-50 text-red-500" },
};

export default function CompanyOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary: "",
    deadline: "",
    status: "DRAFT",
  });
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const res = await api.get("/offers/company/2");
        setOffers(res.data);
      } catch {
        console.error("Erreur fetch offers");
      } finally {
        setLoading(false);
      }
    };
    loadOffers();
  }, []);
  // ✅ Fetch iray ihany
  const fetchOffers = async () => {
    try {
      const res = await api.get("/offers/company/2");
      setOffers(res.data);
    } catch {
      console.error("Erreur fetch offers");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      requirements: "",
      location: "",
      salary: "",
      deadline: "",
      status: "DRAFT",
    });
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    setForm({
      title: offer.title,
      description: offer.description,
      requirements: offer.requirements ?? "",
      location: offer.location ?? "",
      salary: offer.salary?.toString() ?? "",
      deadline: offer.deadline ? offer.deadline.split("T")[0] : "",
      status: offer.status,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/offers/${editing.id_offer}`, {
          title: form.title,
          description: form.description,
          requirements: form.requirements || undefined,
          location: form.location || undefined,
          salary: form.salary ? Number(form.salary) : undefined,
          deadline: form.deadline
            ? new Date(form.deadline).toISOString()
            : undefined,
          status: form.status as "DRAFT" | "PUBLISHED" | "CLOSED",
        });
      } else {
        await api.post("/offers", {
          title: form.title,
          description: form.description,
          requirements: form.requirements || undefined,
          location: form.location || undefined,
          salary: form.salary ? Number(form.salary) : undefined,
          deadline: form.deadline
            ? new Date(form.deadline).toISOString()
            : undefined,
          status: form.status as "DRAFT" | "PUBLISHED" | "CLOSED",
          id_company: 2,
        });
      }
      setShowForm(false);
      await fetchOffers();
    } catch (err) {
      console.error("Erreur save offer:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id_offer: number) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try {
      await api.delete(`/offers/${id_offer}`);
      await fetchOffers();
    } catch {
      console.error("Erreur delete offer");
    }
  };

  const handleStatusChange = async (id_offer: number, status: string) => {
    try {
      await api.put(`/offers/${id_offer}`, { status });
      await fetchOffers();
    } catch {
      console.error("Erreur status change");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            Mes offres
          </h1>
          <p className="text-sm text-gray-500">Gérez vos offres de stage.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          <i className="ti ti-plus"></i>
          Nouvelle offre
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? "Modifier l'offre" : "Nouvelle offre"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Prérequis
                </label>
                <input
                  type="text"
                  value={form.requirements}
                  onChange={(e) =>
                    setForm({ ...form, requirements: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Salaire (Ar)
                  </label>
                  <input
                    type="number"
                    value={form.salary}
                    onChange={(e) =>
                      setForm({ ...form, salary: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date limite
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PUBLISHED">Publier</option>
                    <option value="CLOSED">Fermer</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : offers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <i className="ti ti-briefcase text-4xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">Aucune offre pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map((offer) => {
            const status = statusConfig[offer.status];
            return (
              <div
                key={offer.id_offer}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-800">
                        {offer.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-lg ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {offer.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {offer.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                          <i className="ti ti-map-pin text-xs"></i>
                          {offer.location}
                        </span>
                      )}
                      {offer.salary && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                          <i className="ti ti-cash text-xs"></i>
                          {offer.salary.toLocaleString()} Ar
                        </span>
                      )}
                      {offer.deadline && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                          <i className="ti ti-calendar text-xs"></i>
                          {new Date(offer.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {offer.status === "DRAFT" && (
                      <button
                        onClick={() =>
                          handleStatusChange(offer.id_offer, "PUBLISHED")
                        }
                        className="px-3 py-1.5 bg-green-50 text-green-600 text-xs rounded-lg hover:bg-green-100 transition"
                      >
                        Publier
                      </button>
                    )}
                    {offer.status === "PUBLISHED" && (
                      <button
                        onClick={() =>
                          handleStatusChange(offer.id_offer, "CLOSED")
                        }
                        className="px-3 py-1.5 bg-yellow-50 text-yellow-600 text-xs rounded-lg hover:bg-yellow-100 transition"
                      >
                        Fermer
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(offer)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <i className="ti ti-edit text-sm"></i>
                    </button>
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
