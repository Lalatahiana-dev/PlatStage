"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  MapPin,
  GraduationCap,
  FileText,
  ExternalLink,
  AlertTriangle,
  BarChart3,
  BookOpen,
  MessageCircle,
  Star,
  StickyNote,
  Save,
  Filter,
  ArrowRight,
  Phone,
  Mail,
  Download,
  CalendarClock,
  PenLine,
  Plus,
} from "lucide-react";

interface Application {
  id_application: number;
  motivation?: string;
  notes?: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  student: {
    id_student: number;
    university?: string;
    level?: string;
    photo_url?: string;
    cv_url?: string;
    user: { id_user: number; nom: string; prenom: string; email: string };
    skills: { skill: { id_skill: number; name: string } }[];
  };
  offer: { id_offer: number; title: string };
  interview?: {
    id_interview: number;
    scheduled_at: string;
    status: string;
  } | null;
}

interface Offer {
  id_offer: number;
  title: string;
}

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

type ApplicationStatus =
  | "EN_ATTENTE"
  | "REVIEWING"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "ACCEPTEE"
  | "REFUSEE";

const PIPELINE: {
  key: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
}[] = [
  {
    key: "EN_ATTENTE",
    label: "Reçue",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    activeBg: "bg-gray-100",
  },
  {
    key: "REVIEWING",
    label: "En review",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-100",
  },
  {
    key: "SHORTLISTED",
    label: "Présélection",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    activeBg: "bg-purple-100",
  },
  {
    key: "INTERVIEW_SCHEDULED",
    label: "Entretien",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-100",
  },
  {
    key: "ACCEPTEE",
    label: "Acceptée",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-100",
  },
  {
    key: "REFUSEE",
    label: "Refusée",
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    activeBg: "bg-red-100",
  },
];

function getStatusConf(s: ApplicationStatus) {
  return PIPELINE.find((p) => p.key === s) ?? PIPELINE[0];
}

function getPipelineIndex(s: ApplicationStatus): number {
  if (s === "REFUSEE") return -1;
  return PIPELINE.findIndex((p) => p.key === s);
}

function CompanyApplicationsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyNotFound, setCompanyNotFound] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [skillFilter, setSkillFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [notesMap, setNotesMap] = useState<Record<number, string>>({});
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    student: StudentProfile | null;
    loading: boolean;
  }>({ open: false, student: null, loading: false });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    applicationId: number;
    action: ApplicationStatus;
    studentName: string;
  }>({
    open: false,
    applicationId: 0,
    action: "REVIEWING",
    studentName: "",
  });

  const fetchAllApps = useCallback(async (offerList: Offer[]) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        offerList.map((o) =>
          api.get(`/applications/offer/${o.id_offer}`).then((r) => r.data),
        ),
      );
      const all = results.flat();
      setApplications(all);
      const notes: Record<number, string> = {};
      all.forEach((a: Application) => {
        if (a.notes) notes[a.id_application] = a.notes;
      });
      setNotesMap(notes);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get(`/companies/user/${user.userId}`).then((r) => {
      setCompanyId(r.data?.id_company ?? null);
    }).catch(() => {
      setCompanyNotFound(true);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!companyId) return;
    api.get(`/offers/company/${companyId}`).then((r) => {
      setOffers(r.data);
      fetchAllApps(r.data);
    }).catch(() => setLoading(false));
  }, [companyId, fetchAllApps]);

  const handleStatusChange = async (
    id_application: number,
    status: ApplicationStatus,
  ) => {
    setUpdating(id_application);
    try {
      await api.put(`/applications/${id_application}/status`, { status });
      setApplications((prev) =>
        prev.map((a) =>
          a.id_application === id_application
            ? { ...a, status, updated_at: new Date().toISOString() }
            : a,
        ),
      );
    } catch {
      // silent
    } finally {
      setUpdating(null);
      setConfirmModal((p) => ({ ...p, open: false }));
    }
  };

  const saveNotes = async (id_application: number) => {
    setSavingNotes(true);
    try {
      await api.patch(`/applications/${id_application}/notes`, {
        notes: notesDraft,
      });
      setNotesMap((prev) => ({ ...prev, [id_application]: notesDraft }));
      setEditingNotes(null);
    } catch {
      // silent
    } finally {
      setSavingNotes(false);
    }
  };

  const openProfile = async (id_student: number) => {
    setProfileModal({ open: true, student: null, loading: true });
    try {
      const res = await api.get(`/students/${id_student}`);
      setProfileModal({ open: true, student: res.data, loading: false });
    } catch {
      setProfileModal({ open: false, student: null, loading: false });
    }
  };

  const allLevels = [
    ...new Set(applications.map((a) => a.student.level).filter(Boolean)),
  ];
  const allSkills = [
    ...new Set(
      applications.flatMap((a) => a.student.skills.map((s) => s.skill.name)),
    ),
  ];

  const displayApps = applications.filter((app) => {
    if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
    if (selectedOffer !== null && app.offer.id_offer !== selectedOffer)
      return false;
    if (levelFilter !== "ALL" && app.student.level !== levelFilter) return false;
    if (
      skillFilter !== "ALL" &&
      !app.student.skills.some((s) => s.skill.name === skillFilter)
    )
      return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = `${app.student.user.prenom} ${app.student.user.nom}`
        .toLowerCase()
        .includes(q);
      const emailMatch = app.student.user.email.toLowerCase().includes(q);
      const uniMatch = app.student.university?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !uniMatch) return false;
    }
    return true;
  });

  const filteredByOffer = displayApps;

  const stats = [
    {
      label: "Total",
      value: applications.length,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Nouvelles",
      value: applications.filter((a) => a.status === "EN_ATTENTE").length,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-gray-100 text-gray-600",
    },
    {
      label: "En review",
      value: applications.filter((a) => a.status === "REVIEWING").length,
      icon: <Eye className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Présélectionnés",
      value: applications.filter((a) => a.status === "SHORTLISTED").length,
      icon: <Star className="w-5 h-5" />,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Entretiens",
      value: applications.filter((a) => a.status === "INTERVIEW_SCHEDULED")
        .length,
      icon: <CalendarClock className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Acceptés",
      value: applications.filter((a) => a.status === "ACCEPTEE").length,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Refusés",
      value: applications.filter((a) => a.status === "REFUSEE").length,
      icon: <XCircle className="w-5 h-5" />,
      color: "bg-red-50 text-red-500",
    },
  ];

  const statusTabs = [
    { key: "ALL", label: "Toutes" },
    ...PIPELINE.map((p) => ({ key: p.key, label: p.label })),
  ];

  const nextStatuses: Record<ApplicationStatus, ApplicationStatus[]> = {
    EN_ATTENTE: ["REVIEWING", "REFUSEE"],
    REVIEWING: ["SHORTLISTED", "REFUSEE"],
    SHORTLISTED: ["INTERVIEW_SCHEDULED", "REFUSEE"],
    INTERVIEW_SCHEDULED: ["ACCEPTEE", "REFUSEE"],
    ACCEPTEE: [],
    REFUSEE: [],
  };

  if (companyNotFound) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Profil entreprise non trouvé
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Créez votre profil entreprise pour gérer les candidatures.
          </p>
          <a
            href="/company/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Créer mon profil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des candidatures
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivez et gérez le pipeline de recrutement pour vos offres.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center text-center"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}
            >
              {s.icon}
            </div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {offers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
          <button
            onClick={() => setSelectedOffer(null)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition font-medium ${
              selectedOffer === null
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Toutes les offres
          </button>
          {offers.map((o) => (
            <button
              key={o.id_offer}
              onClick={() => setSelectedOffer(o.id_offer)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition font-medium ${
                selectedOffer === o.id_offer
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {o.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, université..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl border transition ${
            showFilters
              ? "bg-indigo-50 border-indigo-300 text-indigo-600"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-4"
        >
          <div>
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Niveau
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">Tous les niveaux</option>
              {allLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Compétence
            </label>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">Toutes les compétences</option>
              {allSkills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {(levelFilter !== "ALL" || skillFilter !== "ALL") && (
            <button
              onClick={() => {
                setLevelFilter("ALL");
                setSkillFilter("ALL");
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 self-end"
            >
              Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              statusFilter === tab.key
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : filteredByOffer.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Aucune candidature</p>
          <p className="text-sm text-gray-400 mt-1">
            {search
              ? "Essayez avec d'autres termes"
              : "Les candidatures apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredByOffer.map((app, idx) => {
            const statusConf = getStatusConf(app.status);
            const isExpanded = expandedId === app.id_application;
            const pipelineIdx = getPipelineIndex(app.status);
            const nexts = nextStatuses[app.status];

            return (
              <motion.div
                key={app.id_application}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {app.student.user.prenom.charAt(0)}
                        {app.student.user.nom.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {app.student.user.prenom} {app.student.user.nom}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {app.student.user.email}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {app.student.university && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {app.student.university}
                            </span>
                          )}
                          {app.student.level && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {app.student.level}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(app.applied_at).toLocaleDateString(
                              "fr-FR",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                        {app.student.skills.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {app.student.skills.slice(0, 4).map((s) => (
                              <span
                                key={s.skill.id_skill}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-medium rounded-md border border-indigo-100"
                              >
                                {s.skill.name}
                              </span>
                            ))}
                            {app.student.skills.length > 4 && (
                              <span className="px-2 py-0.5 text-[10px] text-gray-400">
                                +{app.student.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap ml-[64px] lg:ml-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                      >
                        {statusConf.label}
                      </span>

                      <div className="flex gap-1.5">
                        {nexts.includes("REFUSEE") && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                applicationId: app.id_application,
                                action: "REFUSEE",
                                studentName: `${app.student.user.prenom} ${app.student.user.nom}`,
                              })
                            }
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Refuser"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {nexts
                          .filter((n) => n !== "REFUSEE")
                          .map((nextStatus) => {
                            const nextConf = getStatusConf(nextStatus);
                            return (
                              <button
                                key={nextStatus}
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    applicationId: app.id_application,
                                    action: nextStatus,
                                    studentName: `${app.student.user.prenom} ${app.student.user.nom}`,
                                  })
                                }
                                disabled={updating === app.id_application}
                                className={`p-1.5 rounded-lg transition disabled:opacity-50 ${nextConf.color} hover:${nextConf.activeBg}`}
                                title={`Passer à "${nextConf.label}"`}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            );
                          })}
                        <button
                          onClick={() =>
                            setExpandedId(
                              isExpanded ? null : app.id_application,
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {pipelineIdx >= 0 && (
                    <div className="mt-3 ml-16 hidden sm:flex items-center gap-1">
                      {PIPELINE.slice(0, 5).map((step, i) => (
                        <div key={step.key} className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full transition ${
                              i <= pipelineIdx
                                ? "bg-indigo-500"
                                : "bg-gray-200"
                            }`}
                          />
                          {i < 4 && (
                            <div
                              className={`w-6 h-0.5 transition ${
                                i < pipelineIdx
                                  ? "bg-indigo-400"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 pt-4 border-t border-gray-100 space-y-4"
                    >
                      {app.motivation && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                            Lettre de motivation
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {app.motivation}
                          </p>
                        </div>
                      )}

                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <StickyNote className="w-3 h-3" />
                            Notes du recruteur
                          </p>
                          {editingNotes !== app.id_application && (
                            <button
                              onClick={() => {
                                setEditingNotes(app.id_application);
                                setNotesDraft(
                                  notesMap[app.id_application] || "",
                                );
                              }}
                              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                            >
                              <PenLine className="w-3 h-3" />
                              {notesMap[app.id_application]
                                ? "Modifier"
                                : "Ajouter"}
                            </button>
                          )}
                        </div>
                        {editingNotes === app.id_application ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              placeholder="Ajouter des notes sur ce candidat..."
                              rows={3}
                              className="w-full text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveNotes(app.id_application)}
                                disabled={savingNotes}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                              >
                                {savingNotes ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                Sauvegarder
                              </button>
                              <button
                                onClick={() => setEditingNotes(null)}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-amber-800">
                            {notesMap[app.id_application] || (
                              <span className="italic text-amber-400">
                                Aucune note
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openProfile(app.student.id_student)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 border border-gray-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Voir profil complet
                        </button>
                        {app.student.cv_url && (
                          <a
                            href={app.student.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 border border-blue-200 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            CV
                          </a>
                        )}
                        {app.status === "ACCEPTEE" && (
                          <Link
                            href="/company/messages"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 border border-indigo-200 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Contacter
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {confirmModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmModal((p) => ({ ...p, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const actionConf = getStatusConf(confirmModal.action);
                const isReject = confirmModal.action === "REFUSEE";
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isReject ? "bg-red-50" : actionConf.bg
                        }`}
                      >
                        {isReject ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <ArrowRight
                            className={`w-5 h-5 ${actionConf.color}`}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {isReject ? "Refuser la candidature" : "Changer le statut"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {confirmModal.studentName}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                      {isReject
                        ? "Voulez-vous refuser cette candidature ? Le candidat sera notifié."
                        : `Passer la candidature au statut "${actionConf.label}" ? Le candidat sera notifié.`}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setConfirmModal((p) => ({ ...p, open: false }))
                        }
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            confirmModal.applicationId,
                            confirmModal.action,
                          )
                        }
                        disabled={updating !== null}
                        className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition disabled:opacity-50 ${
                          isReject
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {updating !== null ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : isReject ? (
                          "Refuser"
                        ) : (
                          "Confirmer"
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() =>
              setProfileModal({ open: false, student: null, loading: false })
            }
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {profileModal.loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : profileModal.student ? (
                <>
                  <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-t-2xl p-6 text-white">
                    <button
                      onClick={() =>
                        setProfileModal({
                          open: false,
                          student: null,
                          loading: false,
                        })
                      }
                      className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {profileModal.student.user.prenom.charAt(0)}
                        {profileModal.student.user.nom.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {profileModal.student.user.prenom}{" "}
                          {profileModal.student.user.nom}
                        </h2>
                        <p className="text-indigo-200 text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {profileModal.student.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      {profileModal.student.university && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                            Université
                          </p>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                            {profileModal.student.university}
                          </p>
                        </div>
                      )}
                      {profileModal.student.level && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                            Niveau
                          </p>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                            {profileModal.student.level}
                          </p>
                        </div>
                      )}
                      {profileModal.student.phone && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                            Téléphone
                          </p>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {profileModal.student.phone}
                          </p>
                        </div>
                      )}
                      {profileModal.student.address && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                            Adresse
                          </p>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {profileModal.student.address}
                          </p>
                        </div>
                      )}
                    </div>

                    {profileModal.student.skills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                          Compétences
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profileModal.student.skills.map((s) => (
                            <span
                              key={s.skill.id_skill}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg border border-indigo-100"
                            >
                              {s.skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileModal.student.cv_url && (
                      <a
                        href={profileModal.student.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-200"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Voir le CV
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                      </a>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CompanyApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <CompanyApplicationsContent />
    </Suspense>
  );
}
