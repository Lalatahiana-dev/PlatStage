"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import api from "@/lib/axios";
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  FileText,
  Download,
  Upload,
  Edit3,
  Plus,
  X,
  CheckCircle2,
  BarChart3,
  Briefcase,
  ChevronRight,
  Loader2,
  Globe,
  Award,
  Sparkles,
} from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";

interface StudentProfile {
  id_student: number;
  phone?: string;
  university?: string;
  level?: string;
  cv_url?: string;
  address?: string;
  photo_url?: string;
  user: { id_user: number; nom: string; prenom: string; email: string };
  skills: { skill: { id_skill: number; name: string } }[];
}

interface Skill {
  id_skill: number;
  name: string;
}

interface Application {
  id_application: number;
  motivation?: string;
  status: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  applied_at: string;
  offer: {
    id_offer: number;
    title: string;
    company: { company_name: string; logo_url?: string };
  };
}

const SKILL_COLORS = [
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-sky-500",
];

function getSkillColor(id: number) {
  return SKILL_COLORS[id % SKILL_COLORS.length];
}

function calcCompletion(p: StudentProfile): number {
  let filled = 0;
  const total = 7;
  if (p.phone) filled++;
  if (p.university) filled++;
  if (p.level) filled++;
  if (p.address) filled++;
  if (p.cv_url) filled++;
  if (p.skills && p.skills.length > 0) filled++;
  if (p.photo_url) filled++;
  return Math.round((filled / total) * 100);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EN_ATTENTE: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  ACCEPTEE: { label: "Acceptée", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  REFUSEE: { label: "Refusée", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

/* ─── Section Card Wrapper ─── */
function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─── Info Row ─── */
function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-700 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/80">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { user } = useAuthStore();
  const bumpAvatar = useProfileStore((s) => s.bumpAvatar);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [idStudent, setIdStudent] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  const [editPersonal, setEditPersonal] = useState(false);
  const [editAcademic, setEditAcademic] = useState(false);
  const [editCv, setEditCv] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    university: "",
    level: "",
    address: "",
  });
  const [cvForm, setCvForm] = useState({ cv_url: "" });
  const [selectedSkill, setSelectedSkill] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
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
        setCvForm({ cv_url: profileRes.data.cv_url ?? "" });
        setAllSkills(skillsRes.data);

        try {
          const appRes = await api.get(
            `/applications/student/${profileRes.data.id_student}`,
          );
          setApplications(appRes.data);
        } catch {
          /* ok */
        }
      } catch {
        console.error("Erreur fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const refreshProfile = async () => {
    if (!idStudent) return;
    const res = await api.get(`/students/${idStudent}`);
    setProfile(res.data);
    setForm({
      phone: res.data.phone ?? "",
      university: res.data.university ?? "",
      level: res.data.level ?? "",
      address: res.data.address ?? "",
    });
    setCvForm({ cv_url: res.data.cv_url ?? "" });
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idStudent) return;
    setSaving(true);
    setSuccess(false);
    setFormError(null);
    try {
      await api.put(`/students/${idStudent}`, form);
      await refreshProfile();
      setSuccess(true);
      setEditPersonal(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data
          : null;
      const raw = data?.message;
      setFormError(Array.isArray(raw) ? raw.join(", ") : (raw ?? "Erreur lors de la mise à jour."));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idStudent) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.put(`/students/${idStudent}`, {
        university: form.university,
        level: form.level,
      });
      await refreshProfile();
      setEditAcademic(false);
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data
          : null;
      const raw = data?.message;
      setFormError(Array.isArray(raw) ? raw.join(", ") : (raw ?? "Erreur lors de la mise à jour."));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idStudent) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.put(`/students/${idStudent}`, { cv_url: cvForm.cv_url });
      await refreshProfile();
      setEditCv(false);
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data
          : null;
      const raw = data?.message;
      setFormError(Array.isArray(raw) ? raw.join(", ") : (raw ?? "Erreur lors de la mise à jour."));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill || !idStudent) return;
    try {
      await api.post(`/students/${idStudent}/skills`, {
        id_skill: Number(selectedSkill),
      });
      await refreshProfile();
      setSelectedSkill("");
    } catch {
      console.error("Erreur add skill");
    }
  };

  const handleRemoveSkill = async (id_skill: number) => {
    if (!idStudent) return;
    try {
      await api.delete(`/students/${idStudent}/skills/${id_skill}`);
      await refreshProfile();
    } catch {
      console.error("Erreur remove skill");
    }
  };

  const handleCreateProfile = async () => {
    try {
      await api.post("/students", { id_user: user?.userId });
      window.location.reload();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const ax = err as { response: { data: unknown; status: number } };
        console.error(
          "Create profile error:",
          JSON.stringify(ax.response.data),
          ax.response.status,
        );
      }
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── No profile ── */
  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100/50">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Créez votre profil étudiant
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Complétez votre profil pour attirer les entreprises et décrocher le
            stage idéal.
          </p>
          <button
            onClick={handleCreateProfile}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200/50"
          >
            <Plus className="w-5 h-5" />
            Commencer
          </button>
        </div>
      </div>
    );
  }

  const completion = calcCompletion(profile);
  const published = applications.filter(
    (a) => a.offer && "title" in a.offer,
  ).length;
  const accepted = applications.filter((a) => a.status === "ACCEPTEE").length;
  const pending = applications.filter((a) => a.status === "EN_ATTENTE").length;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════ HEADER ═══════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute -top-10 -left-10 w-48 h-48 border-[3px] border-white rounded-full" />
            <div className="absolute top-12 right-8 w-32 h-32 border-[3px] border-white rounded-full" />
            <div className="absolute -bottom-6 left-1/3 w-24 h-24 border-[3px] border-white rounded-full" />
            <div className="absolute bottom-8 right-1/4 w-16 h-16 border-[3px] border-white rounded-full" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <AvatarUpload
              currentUrl={profile.photo_url}
              onUpload={async (url) => {
                if (!idStudent) return;
                await api.put(`/students/${idStudent}`, { photo_url: url });
                await refreshProfile();
                bumpAvatar();
              }}
              shape="circle"
            />

            {/* Name + info */}
            <div className="flex-1 text-center sm:text-left sm:pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {profile.user.prenom} {profile.user.nom}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                {profile.university && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    {profile.university}
                  </span>
                )}
                {profile.level && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    {profile.level}
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {profile.address}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-300" />
                  {profile.user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Completion bar */}
          <div className="mt-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-gray-700">
                Complétion du profil
              </span>
              <span
                className={`text-sm font-bold ${
                  completion >= 75
                    ? "text-emerald-600"
                    : completion >= 50
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {completion}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  completion >= 75
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : completion >= 50
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                }`}
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { ok: !!profile.phone, label: "Téléphone" },
                { ok: !!profile.university, label: "Université" },
                { ok: !!profile.level, label: "Niveau" },
                { ok: !!profile.address, label: "Adresse" },
                { ok: !!profile.cv_url, label: "CV" },
                { ok: profile.skills.length > 0, label: "Compétences" },
                { ok: !!profile.photo_url, label: "Photo" },
              ].map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.ok
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item.ok ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ CONTENT GRID ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* Personal Info */}
          <SectionCard
            icon={<Mail className="w-4 h-4" />}
            title="Informations personnelles"
            action={
              !editPersonal ? (
                <button
                  onClick={() => { setEditPersonal(true); setFormError(null); }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modifier
                </button>
              ) : undefined
            }
          >
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-2.5 rounded-xl mb-4 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
                Profil mis à jour avec succès !
              </div>
            )}
            {formError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl mb-4 border border-red-100">
                {formError}
              </div>
            )}
            {editPersonal ? (
              <form onSubmit={handleSavePersonal} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="034 00 000 00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="Antananarivo"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPersonal(false);
                      setForm({
                        phone: profile.phone ?? "",
                        university: profile.university ?? "",
                        level: profile.level ?? "",
                        address: profile.address ?? "",
                      });
                    }}
                    className="px-4 py-2 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-0.5">
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={profile.user.email}
                />
                <InfoRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Téléphone"
                  value={profile.phone}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Adresse"
                  value={profile.address}
                />
                {!profile.phone && !profile.address && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Ajoutez vos coordonnées pour faciliter le contact.
                  </p>
                )}
              </div>
            )}
          </SectionCard>

          {/* Skills */}
          <SectionCard
            icon={<Award className="w-4 h-4" />}
            title="Compétences"
            action={
              <span className="text-xs text-gray-400 font-medium">
                {profile.skills.length} skill{profile.skills.length !== 1 && "s"}
              </span>
            }
          >
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((s) => (
                  <span
                    key={s.skill.id_skill}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg bg-gradient-to-r ${getSkillColor(s.skill.id_skill)} shadow-sm`}
                  >
                    {s.skill.name}
                    <button
                      onClick={() => handleRemoveSkill(s.skill.id_skill)}
                      className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      title="Retirer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4 text-center py-2">
                Ajoutez vos compétences pour vous démarquer.
              </p>
            )}
            <div className="flex gap-2">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-white"
              >
                <option value="">Sélectionner...</option>
                {allSkills
                  .filter(
                    (sk) =>
                      !profile.skills.some(
                        (s) => s.skill.id_skill === sk.id_skill,
                      ),
                  )
                  .map((skill) => (
                    <option key={skill.id_skill} value={skill.id_skill}>
                      {skill.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleAddSkill}
                disabled={!selectedSkill}
                className="px-3.5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Background */}
          <SectionCard
            icon={<GraduationCap className="w-4 h-4" />}
            title="Parcours académique"
            action={
              !editAcademic ? (
                <button
                  onClick={() => { setEditAcademic(true); setFormError(null); }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modifier
                </button>
              ) : undefined
            }
          >
            {editAcademic ? (
              <form onSubmit={handleSaveAcademic} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Université
                    </label>
                    <input
                      type="text"
                      value={form.university}
                      onChange={(e) =>
                        setForm({ ...form, university: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      placeholder="ENI Fianarantsoa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Niveau d&apos;études
                    </label>
                    <input
                      type="text"
                      value={form.level}
                      onChange={(e) =>
                        setForm({ ...form, level: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      placeholder="Licence 3"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAcademic(false);
                      setForm({
                        ...form,
                        university: profile.university ?? "",
                        level: profile.level ?? "",
                      });
                    }}
                    className="px-4 py-2 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
                      Université
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {profile.university || (
                        <span className="text-gray-400 font-normal italic">
                          Non renseigné
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100/50">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">
                      Niveau
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {profile.level || (
                        <span className="text-gray-400 font-normal italic">
                          Non renseigné
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* CV */}
          <SectionCard
            icon={<FileText className="w-4 h-4" />}
            title="CV / Curriculum Vitae"
            action={
              !editCv ? (
                <button
                  onClick={() => { setEditCv(true); setFormError(null); }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modifier
                </button>
              ) : undefined
            }
          >
            {editCv ? (
              <form onSubmit={handleSaveCv} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    URL du CV (Google Drive, Dropbox, etc.)
                  </label>
                  <input
                    type="url"
                    value={cvForm.cv_url}
                    onChange={(e) =>
                      setCvForm({ cv_url: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCv(false);
                      setCvForm({ cv_url: profile.cv_url ?? "" });
                    }}
                    className="px-4 py-2 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : profile.cv_url ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    Mon CV
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {profile.cv_url}
                  </p>
                </div>
                <a
                  href={profile.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Aucun CV téléchargé
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Ajoutez votre CV pour augmenter vos chances.
                </p>
                <button
                  onClick={() => { setEditCv(true); setFormError(null); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Ajouter un CV
                </button>
              </div>
            )}
          </SectionCard>

          {/* Applications Summary */}
          <SectionCard
            icon={<BarChart3 className="w-4 h-4" />}
            title="Mes candidatures"
            action={
              applications.length > 0 ? (
                <a
                  href="/student/applications"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </a>
              ) : undefined
            }
          >
            {applications.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <StatCard
                    icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
                    value={applications.length}
                    label="Total"
                    color="bg-indigo-50"
                  />
                  <StatCard
                    icon={
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    }
                    value={accepted}
                    label="Acceptées"
                    color="bg-emerald-50"
                  />
                  <StatCard
                    icon={<Globe className="w-5 h-5 text-amber-600" />}
                    value={pending}
                    label="En attente"
                    color="bg-amber-50"
                  />
                </div>
                <div className="space-y-2">
                  {applications.slice(0, 3).map((app) => {
                    const st = STATUS_MAP[app.status] || STATUS_MAP.EN_ATTENTE;
                    return (
                      <div
                        key={app.id_application}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {app.offer.company.company_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {app.offer.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {app.offer.company.company_name} ·{" "}
                            {formatDate(app.applied_at)}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${st.bg} ${st.color} flex-shrink-0`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Aucune candidature
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Commencez à postuler pour les offres qui vous intéressent.
                </p>
                <a
                  href="/student/offers"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Explorer les offres <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
