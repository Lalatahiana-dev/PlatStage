"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

interface StudentProfile {
  id_student: number;
  phone?: string;
  university?: string;
  level?: string;
  cv_url?: string;
  address?: string;
  photo_url?: string;
  user: {
    id_user: number;
    nom: string;
    prenom: string;
    email: string;
  };
  skills: { skill: { id_skill: number; name: string } }[];
}

interface Skill {
  id_skill: number;
  name: string;
}

export default function StudentProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [idStudent, setIdStudent] = useState<number | null>(null);
  const [form, setForm] = useState({
    phone: "",
    university: "",
    level: "",
    address: "",
  });
  const [selectedSkill, setSelectedSkill] = useState("");

  useEffect(() => {
  if (!user) return;

  const fetchData = async () => {
    try {
      // ✅ Hahazo ny student profile avy amin'ny id_user mivantana
      // Manampy endpoint vaovao ao amin'ny backend
      const [profileRes, skillsRes] = await Promise.all([
        api.get(`/students/user/${user.userId}`),
        api.get("/skills"),
      ]);
      setProfile(profileRes.data);
      setIdStudent(profileRes.data.id_student);
      setForm({
        phone: profileRes.data.phone ?? "",
        university: profileRes.data.university ?? "",
        level: profileRes.data.level ?? "",
        address: profileRes.data.address ?? "",
      });
      setAllSkills(skillsRes.data);
    } catch {
      console.error("Erreur fetch profile");
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idStudent) return;
    setSaving(true);
    setSuccess(false);
    try {
      await api.put(`/students/${idStudent}`, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      console.error("Erreur update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill || !idStudent) return;
    try {
      await api.post(`/students/${idStudent}/skills`, { id_skill: Number(selectedSkill) });
      const res = await api.get(`/students/${idStudent}`);
      setProfile(res.data);
      setSelectedSkill("");
    } catch {
      console.error("Erreur add skill");
    }
  };

  const handleRemoveSkill = async (id_skill: number) => {
    if (!idStudent) return;
    try {
      await api.delete(`/students/${idStudent}/skills/${id_skill}`);
      const res = await api.get(`/students/${idStudent}`);
      setProfile(res.data);
    } catch {
      console.error("Erreur remove skill");
    }
  };

  if (loading) return <div className="text-sm text-gray-400">Chargement...</div>;

  // ✅ Raha tsy misy profile encore
  if (!profile) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
        <i className="ti ti-user text-4xl text-gray-300 mb-2 block"></i>
        <p className="text-sm text-gray-500 mb-4">Vous n&apos;avez pas encore de profil étudiant.</p>
        <button
          onClick={async () => {
            try {
              await api.post('/students', { id_user: user?.userId });
              window.location.reload();
            } catch (err: unknown) {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response: { data: unknown; status: number } };
    console.error('Create profile error:', JSON.stringify(axiosErr.response.data), axiosErr.response.status);
  }}
          }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          Créer mon profil
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Mon profil</h1>
        <p className="text-sm text-gray-500">Gérez vos informations personnelles et vos compétences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Avatar card */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center h-fit">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl mx-auto mb-3">
            {profile.user.prenom.charAt(0)}{profile.user.nom.charAt(0)}
          </div>
          <h3 className="text-base font-semibold text-gray-800">
            {profile.user.prenom} {profile.user.nom}
          </h3>
          <p className="text-sm text-gray-400 mb-4">{profile.user.email}</p>
          <div className="text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            {profile.university && (
              <div className="flex items-center gap-2">
                <i className="ti ti-school"></i> {profile.university}
              </div>
            )}
            {profile.level && (
              <div className="flex items-center gap-2">
                <i className="ti ti-certificate"></i> {profile.level}
              </div>
            )}
            {profile.address && (
              <div className="flex items-center gap-2">
                <i className="ti ti-map-pin"></i> {profile.address}
              </div>
            )}
          </div>
        </div>

        {/* Right — Form + skills */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Informations personnelles</h3>

            {success && (
              <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-lg mb-4">
                Profil mis à jour avec succès !
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="034 00 000 00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Niveau</label>
                  <input
                    type="text"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Licence 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Université</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="ENI Fianarantsoa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Antananarivo"
                />
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

          {/* Skills */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Compétences</h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.length === 0 && (
                <p className="text-sm text-gray-400">Aucune compétence ajoutée.</p>
              )}
              {profile.skills.map((s) => (
                <span
                  key={s.skill.id_skill}
                  className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg"
                >
                  {s.skill.name}
                  <button onClick={() => handleRemoveSkill(s.skill.id_skill)} className="hover:text-red-500">
                    <i className="ti ti-x text-xs"></i>
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Sélectionner une compétence</option>
                {allSkills.map((skill) => (
                  <option key={skill.id_skill} value={skill.id_skill}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}