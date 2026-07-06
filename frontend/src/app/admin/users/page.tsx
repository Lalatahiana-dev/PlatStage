"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface User {
  id_user: number;
  nom: string;
  prenom: string;
  email: string;
  created_at: string;
  roles: { role: { name: string } }[];
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-600",
  COMPANY: "bg-purple-50 text-purple-600",
  STUDENT: "bg-green-50 text-green-600",
  USER: "bg-gray-100 text-gray-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data);
      } catch {
        console.error("Erreur fetch users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            Utilisateurs
          </h1>
          <p className="text-sm text-gray-500">
            Gérez tous les comptes utilisateurs.
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium">
          {users.length} utilisateurs
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 mb-6">
        <i className="ti ti-search text-gray-400"></i>
        <input
          type="text"
          placeholder="Rechercher par nom, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Utilisateur
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Rôles
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Inscrit le
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id_user}
                  className="border-b border-gray-50 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {user.prenom.charAt(0)}
                        {user.nom.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {user.prenom} {user.nom}
                        </div>
                        <div className="text-xs text-gray-400">
                          #{user.id_user}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-gray-400">
                          Aucun rôle
                        </span>
                      ) : (
                        user.roles.map((r, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded-lg font-medium ${roleColors[r.role.name] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {r.role.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
