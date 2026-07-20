"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1); // ✅ Étape 1 = choix role, Étape 2 = formulaire
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: string) => {
    setForm({ ...form, role });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      const token = res.data.access_token as string;
      const user = jwtDecode<{
        userId: number;
        email: string;
        roles: string[];
      }>(token);
      setAuth(user, token);

      if (user.roles.includes("COMPANY")) router.push("/company");
      else router.push("/student");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response: { data: unknown } };
        console.error(
          "Erreur inscription:",
          JSON.stringify(axiosErr.response.data),
        );
      }
      setError("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 w-full max-w-md">
        <div className="mb-2">
          <Logo size="md" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
          Inscription
        </h2>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-indigo-500" : "bg-gray-200"}`}
          ></div>
          <div
            className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-indigo-500" : "bg-gray-200"}`}
          ></div>
        </div>

        {/* Step 1 — Choix du role */}
        {step === 1 && (
          <div>
            <p className="text-sm text-gray-500 mb-6">Je suis...</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleRoleSelect("STUDENT")}
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ti ti-school text-2xl text-indigo-600"></i>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Étudiant
                  </h3>
                  <p className="text-xs text-gray-400">Je cherche un stage</p>
                </div>
                <i className="ti ti-chevron-right text-gray-400 ml-auto"></i>
              </button>

              <button
                onClick={() => handleRoleSelect("COMPANY")}
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ti ti-building text-2xl text-purple-600"></i>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Entreprise
                  </h3>
                  <p className="text-xs text-gray-400">
                    Je publie des offres de stage
                  </p>
                </div>
                <i className="ti ti-chevron-right text-gray-400 ml-auto"></i>
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-indigo-600 font-medium hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* Step 2 — Formulaire */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep(1)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <i className="ti ti-arrow-left text-sm"></i>
              </button>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${form.role === "COMPANY" ? "text-purple-600" : "text-indigo-600"}`}
              >
                <i
                  className={`ti ${form.role === "COMPANY" ? "ti-building" : "ti-school"}`}
                ></i>
                {form.role === "COMPANY" ? "Entreprise" : "Étudiant"}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    placeholder="Rakoto"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) =>
                      setForm({ ...form, prenom: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 ${
                  form.role === "COMPANY"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Inscription..." : "S'inscrire"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-indigo-600 font-medium hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
