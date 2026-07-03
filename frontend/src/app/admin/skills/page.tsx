'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface Skill {
  id_skill: number;
  name: string;
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await api.get('/skills');
        setSkills(res.data);
      } catch {
        console.error('Erreur fetch skills');
      } finally {
        setLoading(false);
      }
    };
    loadSkills();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/skills/${editing.id_skill}`, { name });
      } else {
        await api.post('/skills', { name });
      }
      setShowForm(false);
      const res = await api.get('/skills');
      setSkills(res.data);
    } catch {
      console.error('Erreur save skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id_skill: number) => {
    if (!confirm('Supprimer cette compétence ?')) return;
    try {
      await api.delete(`/skills/${id_skill}`);
      setSkills((prev) => prev.filter((s) => s.id_skill !== id_skill));
    } catch {
      console.error('Erreur delete skill');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Compétences</h1>
          <p className="text-sm text-gray-500">Gérez les compétences des étudiants.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setName(''); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          <i className="ti ti-plus"></i>
          Nouvelle compétence
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? 'Modifier' : 'Nouvelle compétence'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Chargement...</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {skills.map((skill) => (
            <div key={skill.id_skill} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <i className="ti ti-star text-indigo-600 text-sm"></i>
              </div>
              <span className="text-sm font-medium text-gray-800">{skill.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditing(skill); setName(skill.name); setShowForm(true); }}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <i className="ti ti-edit text-xs"></i>
                </button>
                <button
                  onClick={() => handleDelete(skill.id_skill)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <i className="ti ti-trash text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}