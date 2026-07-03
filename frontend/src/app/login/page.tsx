'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { jwtDecode } from 'jwt-decode';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Veuillez sélectionner votre profil');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);
      const token = res.data.access_token as string;
      const user = jwtDecode<{ userId: number; email: string; roles: string[] }>(token);

      // Verification role
      if (!user.roles.includes(selectedRole)) {
        setError(`Ce compte n'est pas un compte ${
          selectedRole === 'STUDENT' ? 'Étudiant' :
          selectedRole === 'COMPANY' ? 'Entreprise' : 'Administrateur'
        }`);
        setLoading(false);
        return;
      }

      setAuth(user, token);

      if (user.roles.includes('ADMIN')) router.push('/admin');
      else if (user.roles.includes('COMPANY')) router.push('/company');
      else router.push('/student');

    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'STUDENT', label: 'Étudiant', icon: 'ti-school', color: 'indigo' },
    { value: 'COMPANY', label: 'Entreprise', icon: 'ti-building', color: 'indigo' },
    { value: 'ADMIN', label: 'Administrateur', icon: 'ti-shield', color: 'indigo' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">PlatStage</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Connexion</h2>

        {/* Role selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Je suis...</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setSelectedRole(r.value); setError(''); }}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition text-xs font-medium ${
                  selectedRole === r.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <i className={`ti ${r.icon} text-xl`}></i>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRole}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}