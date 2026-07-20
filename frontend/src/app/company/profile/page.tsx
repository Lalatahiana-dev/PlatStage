 "use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import api from "@/lib/axios";
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  Edit3,
  CheckCircle2,
  Briefcase,
  BarChart3,
  Clock,
  Calendar,
  ExternalLink,
  Plus,
  FileText,
  Loader2,
  Eye,
  ChevronRight,
  Sparkles,
  Tag,
} from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";

interface CompanyProfile {
  id_company: number;
  company_name: string;
  sector?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  address?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  user: { id_user: number; nom: string; prenom: string; email: string };
}

interface Offer {
  id_offer: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: number;
  deadline?: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  created_at: string;
  updated_at: string;
  categories: { category: { id_category: number; name: string } }[];
}

const OFFER_STATUS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PUBLISHED: {
    label: "Publiée",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  DRAFT: {
    label: "Brouillon",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  CLOSED: {
    label: "Fermée",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
};

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
          <p className="text-sm text-gray-700">{value}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  trend,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CompanyProfilePage() {
  const { user } = useAuthStore();
  const bumpAvatar = useProfileStore((s) => s.bumpAvatar);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editInfo, setEditInfo] = useState(false);
  const [editDesc, setEditDesc] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    sector: "",
    description: "",
    website: "",
    address: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchCompanyId = async () => {
      try {
        const res = await api.get(`/companies/user/${user.userId}`);
        const id = res.data?.id_company ?? null;
        setCompanyId(id);
        if (!id) setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (!companyId) return;
    const loadProfile = async () => {
      try {
        const [compRes, offersRes] = await Promise.all([
          api.get(`/companies/${companyId}`),
          api.get(`/offers/company/${companyId}`),
        ]);
        setProfile(compRes.data);
        setOffers(offersRes.data);
        setForm({
          company_name: compRes.data.company_name ?? "",
          sector: compRes.data.sector ?? "",
          description: compRes.data.description ?? "",
          website: compRes.data.website ?? "",
          address: compRes.data.address ?? "",
        });
      } catch {
        console.error("Erreur fetch profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [companyId]);

  const refreshProfile = async () => {
    if (!companyId) return;
    const res = await api.get(`/companies/${companyId}`);
    setProfile(res.data);
    setForm({
      company_name: res.data.company_name ?? "",
      sector: res.data.sector ?? "",
      description: res.data.description ?? "",
      website: res.data.website ?? "",
      address: res.data.address ?? "",
    });
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    setSuccess(false);
    try {
      await api.put(`/companies/${companyId}`, {
        company_name: form.company_name,
        sector: form.sector,
        website: form.website,
        address: form.address,
      });
      await refreshProfile();
      setSuccess(true);
      setEditInfo(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const ax = err as { response: { data: unknown; status: number } };
        console.error(
          "Update error:",
          JSON.stringify(ax.response.data),
          ax.response.status,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDesc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      await api.put(`/companies/${companyId}`, {
        description: form.description,
      });
      await refreshProfile();
      setEditDesc(false);
    } catch {
      console.error("Erreur update description");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      await api.post("/companies", {
        company_name: "Mon entreprise",
        id_user: user?.userId,
      });
      window.location.reload();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const ax = err as { response: { data: unknown; status: number } };
        console.error(
          "Create error:",
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  /* ── No profile ── */
  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100/50">
            <Sparkles className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Créez votre profil entreprise
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Présentez votre entreprise aux étudiants et publiez vos offres de
            stage.
          </p>
          <button
            onClick={handleCreateProfile}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-200/50"
          >
            <Plus className="w-5 h-5" />
            Commencer
          </button>
        </div>
      </div>
    );
  }

  const published = offers.filter((o) => o.status === "PUBLISHED").length;
  const drafts = offers.filter((o) => o.status === "DRAFT").length;
  const closed = offers.filter((o) => o.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════ HEADER ═══════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute -top-10 -left-10 w-48 h-48 border-[3px] border-white rounded-full" />
            <div className="absolute top-12 right-8 w-32 h-32 border-[3px] border-white rounded-full" />
            <div className="absolute -bottom-6 left-1/3 w-24 h-24 border-[3px] border-white rounded-full" />
          </div>
        </div>

        {/* Logo + Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            {/* Logo */}
            <div className="relative self-center sm:self-auto">
              <AvatarUpload
                currentUrl={profile.logo_url}
                onUpload={async (url) => {
                  if (!companyId) return;
                  await api.put(`/companies/${companyId}`, { logo_url: url });
                  await refreshProfile();
                  bumpAvatar();
                }}
                shape="square"
              />
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow z-10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Name + info */}
            <div className="flex-1 text-center sm:text-left sm:pb-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {profile.company_name}
                </h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Vérifié
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                {profile.sector && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-blue-400" />
                    {profile.sector}
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {profile.address}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    {profile.website.replace(/^https?:\/\//, "").slice(0, 30)}
                    {profile.website.replace(/^https?:\/\//, "").length > 30 &&
                      "..."}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  Membre depuis {formatDate(profile.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ STATS ═══════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
          value={offers.length}
          label="Offres totales"
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Globe className="w-5 h-5 text-emerald-600" />}
          value={published}
          label="Offres publiées"
          color="bg-emerald-50"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-amber-600" />}
          value={drafts}
          label="Brouillons"
          color="bg-amber-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-gray-600" />}
          value={closed}
          label="Clôturées"
          color="bg-gray-50"
        />
      </div>

      {/* ═══════════════════════ CONTENT GRID ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* Company Info */}
          <SectionCard
            icon={<Building2 className="w-4 h-4" />}
            title="Informations entreprise"
            action={
              !editInfo ? (
                <button
                  onClick={() => setEditInfo(true)}
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
                Profil mis à jour !
              </div>
            )}
            {editInfo ? (
              <form onSubmit={handleSaveInfo} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nom de l&apos;entreprise *
                  </label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) =>
                      setForm({ ...form, company_name: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Secteur
                  </label>
                  <input
                    type="text"
                    value={form.sector}
                    onChange={(e) =>
                      setForm({ ...form, sector: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="Informatique, Finance..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="https://..."
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
                    placeholder="Antananarivo..."
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
                      setEditInfo(false);
                      setForm({
                        company_name: profile.company_name ?? "",
                        sector: profile.sector ?? "",
                        description: profile.description ?? "",
                        website: profile.website ?? "",
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
                  icon={<Building2 className="w-4 h-4" />}
                  label="Nom"
                  value={profile.company_name}
                />
                <InfoRow
                  icon={<Tag className="w-4 h-4" />}
                  label="Secteur"
                  value={profile.sector}
                />
                <InfoRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Site web"
                  value={profile.website}
                  href={profile.website || undefined}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Adresse"
                  value={profile.address}
                />
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={profile.user.email}
                />
              </div>
            )}
          </SectionCard>

          {/* Contact */}
          <SectionCard
            icon={<Mail className="w-4 h-4" />}
            title="Contact"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-sm text-gray-700 truncate">
                    {profile.user.email}
                  </p>
                </div>
              </div>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      Site web
                    </p>
                    <p className="text-sm text-indigo-600 truncate group-hover:underline">
                      {profile.website}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </a>
              )}
              {profile.address && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      Adresse
                    </p>
                    <p className="text-sm text-gray-700">{profile.address}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <SectionCard
            icon={<FileText className="w-4 h-4" />}
            title="À propos de l'entreprise"
            action={
              !editDesc ? (
                <button
                  onClick={() => setEditDesc(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modifier
                </button>
              ) : undefined
            }
          >
            {editDesc ? (
              <form onSubmit={handleSaveDesc} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                    rows={5}
                    placeholder="Décrivez votre entreprise, votre culture, vos valeurs..."
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
                      setEditDesc(false);
                      setForm({ ...form, description: profile.description ?? "" });
                    }}
                    className="px-4 py-2 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : profile.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Aucune description
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Présentez votre entreprise aux étudiants.
                </p>
                <button
                  onClick={() => setEditDesc(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Ajouter une description
                </button>
              </div>
            )}
          </SectionCard>

          {/* Active Offers */}
          <SectionCard
            icon={<Briefcase className="w-4 h-4" />}
            title="Offres de stage"
            action={
              offers.length > 0 ? (
                <a
                  href="/company/offers"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </a>
              ) : undefined
            }
          >
            {offers.length > 0 ? (
              <div className="space-y-3">
                {offers.slice(0, 5).map((offer) => {
                  const st = OFFER_STATUS[offer.status] || OFFER_STATUS.DRAFT;
                  return (
                    <div
                      key={offer.id_offer}
                      className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
                              {offer.title}
                            </h4>
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex-shrink-0 ${st.bg} ${st.color}`}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                            {offer.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {offer.location}
                              </span>
                            )}
                            {offer.salary && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" />
                                {offer.salary.toLocaleString("fr-FR")} MGA
                              </span>
                            )}
                            {offer.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(offer.deadline)}
                              </span>
                            )}
                          </div>
                          {offer.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {offer.categories.map((c) => (
                                <span
                                  key={c.category.id_category}
                                  className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"
                                >
                                  {c.category.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <a
                          href={`/company/offers`}
                          className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                          title="Voir l'offre"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Aucune offre publiée
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Publiez votre première offre de stage pour attirer les
                  talents.
                </p>
                <a
                  href="/company/offers"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Créer une offre
                </a>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
