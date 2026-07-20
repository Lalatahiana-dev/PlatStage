"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import api from "@/lib/axios";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminAvatar from "@/components/AdminAvatar";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  UserPlus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Trash2,
  Ban,
  Filter,
  X,
  AlertTriangle,
  RefreshCw,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  MapPin,
  Mail,
  Briefcase,
  ExternalLink,
  Settings,
  Star,
  Phone,
  StickyNote,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */

type AppStatus =
  | "EN_ATTENTE"
  | "REVIEWING"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "ACCEPTEE"
  | "REFUSEE";

interface AppStudent {
  id_student: number;
  university: string | null;
  level: string | null;
  photo_url: string | null;
  user: { nom: string; prenom: string; email: string };
}

interface AppCompany {
  id_company: number;
  company_name: string;
  logo_url: string | null;
  sector: string | null;
}

interface AppOffer {
  id_offer: number;
  title: string;
  location: string | null;
  company: AppCompany;
}

interface AppInterview {
  id_interview: number;
  scheduled_at: string;
  status: string;
  type: string;
}

interface Application {
  id_application: number;
  motivation: string | null;
  notes: string | null;
  status: AppStatus;
  applied_at: string;
  updated_at: string;
  student: AppStudent;
  offer: AppOffer;
  interview: AppInterview | null;
}

interface DetailedApplication extends Application {
  student: AppStudent & {
    cv_url: string | null;
    phone: string | null;
    address: string | null;
    skills: { skill: { id_skill: number; name: string } }[];
  };
  offer: AppOffer & { description: string };
  interview: {
    id_interview: number;
    scheduled_at: string;
    location: string | null;
    type: string;
    status: string;
    completed_at: string | null;
    rating: number | null;
    strengths: string | null;
    weaknesses: string | null;
    feedback_notes: string | null;
    final_decision: string | null;
  } | null;
}

type SortField = "applied_at" | "student" | "company" | "offer" | "status";
type SortDir = "asc" | "desc";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  EN_ATTENTE: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  REVIEWING: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  SHORTLISTED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-400" },
  INTERVIEW_SCHEDULED: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-400" },
  ACCEPTEE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  REFUSEE: { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-400" },
};

const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  REVIEWING: "En revue",
  SHORTLISTED: "Présélectionnée",
  INTERVIEW_SCHEDULED: "Entretien prévu",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

const PAGE_SIZES = [10, 25, 50, 100];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const interviewTypeLabels: Record<string, string> = {
  ONLINE: "En ligne",
  ON_SITE: "Sur site",
};

const interviewStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
};

/* ── Animated Counter ────────────────────────────────────────────────────── */

function AnimatedCounter({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display.toLocaleString("fr-FR")}</>;
}

/* ── Skeletons ───────────────────────────────────────────────────────────── */

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg" />
            <div className="h-2 bg-gray-100 rounded w-16" />
          </div>
          <div className="h-7 bg-gray-100 rounded w-10 mb-1" />
          <div className="h-2 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 bg-gray-100 rounded-lg flex-1" />
          <div className="h-10 bg-gray-100 rounded-lg w-32" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 animate-pulse">
          <div className="w-5 h-5 bg-gray-100 rounded" />
          <div className="w-10 h-10 bg-gray-100 rounded-full" />
          <div className="flex-1">
            <div className="h-3 bg-gray-100 rounded w-32 mb-2" />
            <div className="h-2 bg-gray-100 rounded w-48" />
          </div>
          <div className="h-6 bg-gray-100 rounded-full w-16" />
          <div className="h-3 bg-gray-100 rounded w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
    rose: { bg: "bg-rose-50", icon: "text-rose-600", ring: "ring-rose-100" },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}>
          <Icon className={`w-4.5 h-4.5 ${c.icon}`} strokeWidth={1.8} />
        </div>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">
        <AnimatedCounter value={value} />
      </div>
      {description && <p className="text-[11px] text-gray-400 mt-1">{description}</p>}
    </div>
  );
}

/* ── Sort Icon ──────────────────────────────────────────────────────────── */

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
  return sortDir === "asc" ? (
    <ArrowUp className="w-3 h-3 text-indigo-500" />
  ) : (
    <ArrowDown className="w-3 h-3 text-indigo-500" />
  );
}

/* ── Actions Dropdown ────────────────────────────────────────────────────── */

function ActionsDropdown({
  onView,
  onChangeStatus,
  onDelete,
}: {
  onView: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-40 animate-[scaleIn_0.1s_ease-out]">
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <Eye className="w-4 h-4 text-gray-400" /> Voir les détails
          </button>
          <button
            onClick={() => {
              onChangeStatus();
              setOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <StickyNote className="w-4 h-4 text-gray-400" /> Changer le statut
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

/* ── View Details Modal ──────────────────────────────────────────────────── */

function ViewModal({
  application,
  open,
  onClose,
}: {
  application: DetailedApplication | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !application) return null;
  const sc = statusColors[application.status] || statusColors.EN_ATTENTE;
  const student = application.student;
  const offer = application.offer;
  const company = offer.company;
  const interview = application.interview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-[scaleIn_0.15s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Student header */}
          <div className="flex items-start gap-4 mb-6">
            <AdminAvatar
              src={student.photo_url}
              name={`${student.user.prenom} ${student.user.nom}`}
              size={56}
              className="rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {student.user.prenom} {student.user.nom}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                  />
                  {statusLabels[application.status]}
                </span>
                {student.university && (
                  <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-blue-50 text-blue-600">
                    {student.university}
                  </span>
                )}
                {student.level && (
                  <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-gray-100 text-gray-600">
                    {student.level}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{student.user.email}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{student.phone}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{student.address}</span>
              </div>
            )}
            {student.cv_url && (
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <a
                  href={student.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Voir le CV <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Compétences
              </h4>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((s) => (
                  <span
                    key={s.skill.id_skill}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium bg-purple-50 text-purple-600"
                  >
                    {s.skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover letter */}
          {application.motivation && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Lettre de motivation
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">
                {application.motivation}
              </p>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Notes internes
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 rounded-xl p-4 whitespace-pre-wrap">
                {application.notes}
              </p>
            </div>
          )}

          {/* Offer info */}
          <div className="mb-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Offre de stage
            </h4>
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <AdminAvatar
                src={company.logo_url}
                name={company.company_name}
                size={40}
                className="rounded-xl"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {offer.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {company.company_name}
                  </span>
                  {company.sector && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">
                      {company.sector}
                    </span>
                  )}
                  {offer.location && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {offer.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interview */}
          {interview && (
            <div className="mb-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                Entretien
              </h4>
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarCheck className="w-4 h-4 text-indigo-500" />
                  <span className="text-gray-700">
                    {new Date(interview.scheduled_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {interview.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{interview.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {interviewTypeLabels[interview.type] || interview.type} —{" "}
                    {interviewStatusLabels[interview.status] || interview.status}
                  </span>
                </div>
                {interview.rating != null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-600">
                      Note : {interview.rating}/5
                    </span>
                  </div>
                )}
                {interview.strengths && (
                  <div className="text-sm mt-2">
                    <span className="font-medium text-emerald-700">
                      Points forts :{" "}
                    </span>
                    <span className="text-gray-600">
                      {interview.strengths}
                    </span>
                  </div>
                )}
                {interview.weaknesses && (
                  <div className="text-sm">
                    <span className="font-medium text-red-600">
                      Points faibles :{" "}
                    </span>
                    <span className="text-gray-600">
                      {interview.weaknesses}
                    </span>
                  </div>
                )}
                {interview.feedback_notes && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Retour :{" "}
                    </span>
                    <span className="text-gray-600">
                      {interview.feedback_notes}
                    </span>
                  </div>
                )}
                {interview.final_decision && (
                  <div className="text-sm font-medium text-indigo-700 mt-1">
                    Décision : {interview.final_decision}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span>
              Candidature :{" "}
              {new Date(application.applied_at).toLocaleDateString("fr-FR")}
            </span>
            <span>Mise à jour : {timeAgo(application.updated_at)}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Status Change Modal ─────────────────────────────────────────────────── */

function StatusChangeModal({
  application,
  open,
  onClose,
  onConfirm,
}: {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: number, status: AppStatus) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<AppStatus>(application?.status ?? "EN_ATTENTE");
  const [saving, setSaving] = useState(false);

  if (!open || !application) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put(`/applications/${application.id_application}/status`, {
        status: selectedStatus,
      });
      onConfirm(application.id_application, selectedStatus);
      showToast("success", "Statut mis à jour");
      onClose();
    } catch {
      showToast("error", "Erreur lors de la mise à jour du statut");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[scaleIn_0.15s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Changer le statut
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Candidature de {application.student.user.prenom}{" "}
          {application.student.user.nom}
        </p>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as AppStatus)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
        >
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || selectedStatus === application.status}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>("applied_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [viewApp, setViewApp] = useState<DetailedApplication | null>(null);
  const [statusTarget, setStatusTarget] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [bulkAction, setBulkAction] = useState<
    "approve" | "reject" | "delete" | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await api.get("/applications", { signal: controller.signal });
        if (!controller.signal.aborted) setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  /* ── Stats ─────────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "EN_ATTENTE").length;
    const accepted = applications.filter((a) => a.status === "ACCEPTEE").length;
    const rejected = applications.filter((a) => a.status === "REFUSEE").length;
    const interviewScheduled = applications.filter(
      (a) => a.status === "INTERVIEW_SCHEDULED",
    ).length;
    const thisMonth = applications.filter((a) => isThisMonth(a.applied_at)).length;
    return { total, pending, accepted, rejected, interviewScheduled, thisMonth };
  }, [applications]);

  const companies = useMemo(() => {
    const map = new Map<number, string>();
    applications.forEach((a) =>
      map.set(a.offer.company.id_company, a.offer.company.company_name),
    );
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], "fr"),
    );
  }, [applications]);

  /* ── Filter + Sort + Paginate ──────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = [...applications];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          `${a.student.user.prenom} ${a.student.user.nom}`
            .toLowerCase()
            .includes(q) ||
          a.student.user.email.toLowerCase().includes(q) ||
          a.offer.title.toLowerCase().includes(q) ||
          a.offer.company.company_name.toLowerCase().includes(q) ||
          a.student.university?.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (companyFilter !== "ALL") {
      result = result.filter(
        (a) => a.offer.company.id_company === Number(companyFilter),
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "applied_at":
          cmp =
            new Date(a.applied_at).getTime() -
            new Date(b.applied_at).getTime();
          break;
        case "student":
          cmp = `${a.student.user.prenom} ${a.student.user.nom}`.localeCompare(
            `${b.student.user.prenom} ${b.student.user.nom}`,
            "fr",
          );
          break;
        case "company":
          cmp = a.offer.company.company_name.localeCompare(
            b.offer.company.company_name,
            "fr",
          );
          break;
        case "offer":
          cmp = a.offer.title.localeCompare(b.offer.title, "fr");
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [applications, search, statusFilter, companyFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const setSearchValue = useCallback(
    (v: string) => {
      setSearch(v);
      setPage(1);
    },
    [],
  );
  const setStatusFilterValue = useCallback(
    (v: string) => {
      setStatusFilter(v);
      setPage(1);
    },
    [],
  );
  const setCompanyFilterValue = useCallback(
    (v: string) => {
      setCompanyFilter(v);
      setPage(1);
    },
    [],
  );
  const setPageSizeValue = useCallback(
    (v: number) => {
      setPageSize(v);
      setPage(1);
    },
    [],
  );

  /* ── Selection ─────────────────────────────────────────────────────────── */

  const allOnPageSelected =
    paginated.length > 0 &&
    paginated.every((a) => selected.has(a.id_application));
  const someOnPageSelected = paginated.some((a) =>
    selected.has(a.id_application),
  );

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const n = new Set(prev);
        paginated.forEach((a) => n.delete(a.id_application));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        paginated.forEach((a) => n.add(a.id_application));
        return n;
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const handleStatusChange = async (id: number, status: AppStatus) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id_application === id ? { ...a, status } : a,
      ),
    );
  };

  const handleDelete = async (app: Application) => {
    try {
      await api.delete(`/applications/${app.id_application}`);
      setApplications((prev) =>
        prev.filter((a) => a.id_application !== app.id_application),
      );
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(app.id_application);
        return n;
      });
      showToast("success", "Candidature supprimée");
    } catch {
      showToast("error", "Erreur lors de la suppression");
    }
  };

  const handleViewDetails = async (app: Application) => {
    try {
      const res = await api.get(`/applications/${app.id_application}`);
      setViewApp(res.data);
    } catch {
      showToast("error", "Erreur lors du chargement des détails");
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selected.size === 0) {
      showToast("error", "Aucune candidature sélectionnée");
      setBulkAction(null);
      return;
    }
    const ids = Array.from(selected);

    if (bulkAction === "delete") {
      try {
        await Promise.all(
          ids.map((id) => api.delete(`/applications/${id}`)),
        );
        setApplications((prev) =>
          prev.filter((a) => !selected.has(a.id_application)),
        );
        setSelected(new Set());
        showToast("success", `${ids.length} candidature(s) supprimée(s)`);
      } catch {
        showToast("error", "Erreur lors de la suppression groupée");
      }
    } else {
      const newStatus: AppStatus =
        bulkAction === "approve" ? "ACCEPTEE" : "REFUSEE";
      try {
        await Promise.all(
          ids.map((id) =>
            api.put(`/applications/${id}/status`, { status: newStatus }),
          ),
        );
        setApplications((prev) =>
          prev.map((a) =>
            selected.has(a.id_application) ? { ...a, status: newStatus } : a,
          ),
        );
        setSelected(new Set());
        showToast(
          "success",
          `${ids.length} candidature(s) ${bulkAction === "approve" ? "acceptée(s)" : "refusée(s)"}`,
        );
      } catch {
        showToast("error", "Erreur lors de l'action groupée");
      }
    }
    setBulkAction(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Étudiant",
      "Email",
      "Université",
      "Entreprise",
      "Offre",
      "Statut",
      "Date",
    ];
    const rows = filtered.map((a) => [
      a.id_application,
      `${a.student.user.prenom} ${a.student.user.nom}`,
      a.student.user.email,
      a.student.university || "",
      a.offer.company.company_name,
      a.offer.title,
      statusLabels[a.status],
      new Date(a.applied_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidatures.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export CSV téléchargé");
  };

  const activeFilters =
    (statusFilter !== "ALL" ? 1 : 0) + (companyFilter !== "ALL" ? 1 : 0);

  /* ── Loading / Error ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
        </div>
        <SkeletonStats />
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Erreur de chargement
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Impossible de charger les candidatures.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            setError(false);
            try {
              const res = await api.get("/applications");
              setApplications(Array.isArray(res.data) ? res.data : res.data.data || []);
            } catch {
              setError(true);
            } finally {
              setLoading(false);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Candidatures
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez toutes les candidatures reçues par les entreprises.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition self-start"
        >
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={FileText}
          color="indigo"
          description="Toutes les candidatures"
        />
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={Clock}
          color="amber"
          description="À traiter"
        />
        <StatCard
          label="Acceptées"
          value={stats.accepted}
          icon={CheckCircle2}
          color="emerald"
          description="Candidatures retenues"
        />
        <StatCard
          label="Refusées"
          value={stats.rejected}
          icon={XCircle}
          color="rose"
          description="Candidatures refusées"
        />
        <StatCard
          label="Entretiens"
          value={stats.interviewScheduled}
          icon={CalendarCheck}
          color="blue"
          description="Entretiens planifiés"
        />
        <StatCard
          label="Ce mois"
          value={stats.thisMonth}
          icon={UserPlus}
          color="purple"
          description="Nouvelles ce mois"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Rechercher par étudiant, email, offre, entreprise, université..."
                value={search}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
              />
              {search && (
                <button
                  onClick={() => setSearchValue("")}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                  showFilters || activeFilters > 0
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" /> Filtres
                {activeFilters > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSizeValue(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} / page
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Statut:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilterValue(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer"
                >
                  <option value="ALL">Tous</option>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Entreprise:</span>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilterValue(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer"
                >
                  <option value="ALL">Toutes</option>
                  {companies.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setStatusFilterValue("ALL");
                    setCompanyFilterValue("ALL");
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
            <span className="text-sm font-medium text-indigo-700">
              {selected.size} sélectionnée(s)
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button
                onClick={() => setBulkAction("approve")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Accepter
              </button>
              <button
                onClick={() => setBulkAction("reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <Ban className="w-3.5 h-3.5" /> Refuser
              </button>
              <button
                onClick={() => setBulkAction("delete")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
              <button
                onClick={() => {
                  const ids = Array.from(selected);
                  const rows = applications
                    .filter((a) => ids.includes(a.id_application))
                    .map(
                      (a) =>
                        `${a.student.user.prenom} ${a.student.user.nom},${a.student.user.email},${a.offer.company.company_name},${a.offer.title},${statusLabels[a.status]},${new Date(a.applied_at).toLocaleDateString("fr-FR")}`,
                    );
                  const csv = ["Nom,Email,Entreprise,Offre,Statut,Date", ...rows].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const el = document.createElement("a");
                  el.href = url;
                  el.download = "candidatures-selection.csv";
                  el.click();
                  URL.revokeObjectURL(url);
                  showToast("success", "Export de la sélection téléchargé");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
              >
                <Download className="w-3.5 h-3.5" /> Exporter
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-1 transition"
              >
                Désélectionner
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">
              {search || activeFilters > 0
                ? "Aucune candidature trouvée"
                : "Aucune candidature"}
            </p>
            <p className="text-xs text-gray-400">
              {search || activeFilters > 0
                ? "Essayez de modifier vos critères de recherche"
                : "Les candidatures apparaîtront ici une fois reçues"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <button
                        onClick={toggleSelectAll}
                        className="text-gray-400 hover:text-indigo-600 transition"
                      >
                        {allOnPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : someOnPageSelected ? (
                          <MinusSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        onClick={() => handleSort("student")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Étudiant{" "}
                        <SortIcon
                          field="student"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => handleSort("company")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Entreprise{" "}
                        <SortIcon
                          field="company"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleSort("offer")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Offre{" "}
                        <SortIcon
                          field="offer"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <button
                        onClick={() => handleSort("applied_at")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Date{" "}
                        <SortIcon
                          field="applied_at"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Statut{" "}
                        <SortIcon
                          field="status"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </button>
                    </th>
                    <th className="w-10 px-4 py-3">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((app) => {
                    const sc =
                      statusColors[app.status] || statusColors.EN_ATTENTE;
                    const isSelected = selected.has(app.id_application);
                    return (
                      <tr
                        key={app.id_application}
                        className={`border-b border-gray-50 transition ${isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelect(app.id_application)}
                            className="text-gray-400 hover:text-indigo-600 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AdminAvatar
                              src={app.student.photo_url}
                              name={`${app.student.user.prenom} ${app.student.user.nom}`}
                              size={40}
                              className="rounded-full"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {app.student.user.prenom}{" "}
                                {app.student.user.nom}
                              </div>
                              <div className="text-xs text-gray-400 truncate md:hidden">
                                {app.offer.company.company_name}
                              </div>
                              {app.student.university && (
                                <div className="text-[11px] text-gray-400 truncate hidden sm:block">
                                  {app.student.university}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <AdminAvatar
                              src={app.offer.company.logo_url}
                              name={app.offer.company.company_name}
                              size={28}
                              className="rounded-lg"
                            />
                            <span className="text-sm text-gray-600 truncate block max-w-[140px]">
                              {app.offer.company.company_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-600 truncate block max-w-[180px]">
                            {app.offer.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">
                          {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                            />
                            {statusLabels[app.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ActionsDropdown
                            onView={() => handleViewDetails(app)}
                            onChangeStatus={() => setStatusTarget(app)}
                            onDelete={() => setDeleteTarget(app)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {filtered.length} résultat(s) — Page {page}/{totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition ${page === pageNum ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ViewModal
        application={viewApp}
        open={!!viewApp}
        onClose={() => setViewApp(null)}
      />

      <StatusChangeModal
        key={statusTarget?.id_application ?? "none"}
        application={statusTarget}
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusChange}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la candidature"
        message={`Êtes-vous sûr de vouloir supprimer la candidature de ${deleteTarget?.student.user.prenom} ${deleteTarget?.student.user.nom} pour « ${deleteTarget?.offer.title} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkAction !== null}
        title={
          bulkAction === "delete"
            ? "Suppression groupée"
            : bulkAction === "approve"
              ? "Acceptation groupée"
              : "Refus groupé"
        }
        message={
          bulkAction === "delete"
            ? `Êtes-vous sûr de vouloir supprimer ${selected.size} candidature(s) ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir ${bulkAction === "approve" ? "accepter" : "refuser"} ${selected.size} candidature(s) ?`
        }
        confirmLabel={bulkAction === "delete" ? "Supprimer" : "Confirmer"}
        variant={bulkAction === "delete" ? "danger" : "warning"}
        onConfirm={handleBulk}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
