"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import api from "@/lib/axios";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminAvatar from "@/components/AdminAvatar";
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarCheck,
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
  ExternalLink,
  Settings,
  Star,
  Video,
  Edit3,
  Save,
  Loader2,
  FileText,
  CalendarClock,
  List,
  Phone,
  User,
  Timer,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface InterviewStudent {
  id_student: number;
  photo_url: string | null;
  university: string | null;
  level: string | null;
  phone: string | null;
  user: { nom: string; prenom: string; email: string };
}

interface InterviewCompany {
  company_name: string;
  logo_url: string | null;
  user: { nom: string; prenom: string; email: string };
}

interface InterviewOffer {
  title: string;
  company: InterviewCompany;
}

interface Interview {
  id_interview: number;
  scheduled_at: string;
  location: string | null;
  type: "ONLINE" | "ON_SITE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  completed_at: string | null;
  rating: number | null;
  strengths: string | null;
  weaknesses: string | null;
  feedback_notes: string | null;
  final_decision: string | null;
  created_at: string;
  updated_at: string;
  application: {
    id_application: number;
    motivation: string | null;
    notes: string | null;
    student: InterviewStudent;
    offer: InterviewOffer;
  };
}

interface DetailedInterview extends Interview {
  application: Interview["application"] & {
    student: InterviewStudent & {
      cv_url: string | null;
      skills: { skill: { id_skill: number; name: string } }[];
    };
  };
}

type SortField =
  | "scheduled_at"
  | "student"
  | "company"
  | "offer"
  | "status"
  | "created_at";
type SortDir = "asc" | "desc";

type ViewMode = "table" | "calendar";
type CalendarMode = "month" | "week" | "day";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Planifié",
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
  },
  RESCHEDULED: {
    label: "Reporté",
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Confirmé",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
  },
  IN_PROGRESS: {
    label: "En cours",
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    dot: "bg-cyan-400",
  },
  COMPLETED: {
    label: "Terminé",
    bg: "bg-purple-50",
    text: "text-purple-600",
    dot: "bg-purple-400",
  },
  CANCELLED: {
    label: "Annulé",
    bg: "bg-red-50",
    text: "text-red-500",
    dot: "bg-red-400",
  },
  CANDIDATE_ABSENT: {
    label: "Candidat absent",
    bg: "bg-orange-50",
    text: "text-orange-600",
    dot: "bg-orange-400",
  },
  RECRUITER_ABSENT: {
    label: "Recruteur absent",
    bg: "bg-rose-50",
    text: "text-rose-600",
    dot: "bg-rose-400",
  },
};

const typeConfig: Record<
  string,
  { label: string; bg: string; text: string; icon: typeof Video }
> = {
  ONLINE: {
    label: "En ligne",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    icon: Video,
  },
  ON_SITE: {
    label: "Sur site",
    bg: "bg-purple-50",
    text: "text-purple-600",
    icon: Building2,
  },
};

const PAGE_SIZES = [10, 25, 50, 100];

function getEffectiveStatus(iv: Interview): string {
  if (iv.status === "CANCELLED") {
    const notes = (iv.application.notes || "").toLowerCase();
    const fb = (iv.feedback_notes || "").toLowerCase();
    if (notes.includes("absent candidat") || fb.includes("absent candidat"))
      return "CANDIDATE_ABSENT";
    if (notes.includes("absent recruteur") || fb.includes("absent recruteur"))
      return "RECRUITER_ABSENT";
    return "CANCELLED";
  }
  if (iv.status === "CONFIRMED" && iv.completed_at) return "COMPLETED";
  if (iv.status === "CONFIRMED" && isToday(iv.scheduled_at)) return "IN_PROGRESS";
  if (
    iv.status === "PENDING" &&
    new Date(iv.updated_at).getTime() -
      new Date(iv.created_at).getTime() >
      60000
  )
    return "RESCHEDULED";
  return iv.status;
}

function computeDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}min` : `${hrs}h`;
}

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

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= startOfWeek && d <= endOfWeek;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ── Animated Counter ────────────────────────────────────────────────────── */

function AnimatedCounter({
  value,
  duration = 700,
}: {
  value: number;
  duration?: number;
}) {
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
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
        >
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
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 animate-pulse"
        >
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
  const colorMap: Record<
    string,
    { bg: string; icon: string; ring: string }
  > = {
    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-600",
      ring: "ring-indigo-100",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      ring: "ring-purple-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      ring: "ring-emerald-100",
    },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      ring: "ring-amber-100",
    },
    rose: { bg: "bg-rose-50", icon: "text-rose-600", ring: "ring-rose-100" },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}
        >
          <Icon className={`w-4.5 h-4.5 ${c.icon}`} strokeWidth={1.8} />
        </div>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">
        <AnimatedCounter value={value} />
      </div>
      {description && (
        <p className="text-[11px] text-gray-400 mt-1">{description}</p>
      )}
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
  onEdit,
  onComplete,
  onCancel,
  onDelete,
  status,
  hasCompletedAt,
}: {
  onView: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
  status: string;
  hasCompletedAt: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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
          {status !== "CANCELLED" && (
            <button
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <Edit3 className="w-4 h-4 text-gray-400" /> Modifier
            </button>
          )}
          {status === "PENDING" && (
            <button
              onClick={() => {
                onComplete();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Marquer terminé
            </button>
          )}
          {status !== "CANCELLED" && status !== "COMPLETED" && (
            <button
              onClick={() => {
                onCancel();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 transition"
            >
              <Ban className="w-4 h-4" /> Annuler
            </button>
          )}
          {status === "PENDING" && !hasCompletedAt && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── View Details Modal ──────────────────────────────────────────────────── */

function ViewModal({
  interview,
  open,
  onClose,
}: {
  interview: DetailedInterview | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !interview) return null;

  const effectiveStatus = getEffectiveStatus(interview);
  const sc = statusConfig[effectiveStatus] || statusConfig.PENDING;
  const tc = typeConfig[interview.type] || typeConfig.ONLINE;
  const TypeIcon = tc.icon;
  const student = interview.application.student;
  const offer = interview.application.offer;
  const company = offer.company;

  const timelineSteps = [
    {
      label: "Candidature soumise",
      date: interview.created_at,
      done: true,
      icon: FileText,
    },
    {
      label: "Entretien planifié",
      date: interview.created_at,
      done: true,
      icon: Calendar,
    },
    {
      label: "Entretien confirmé",
      date: interview.status === "CONFIRMED" || interview.completed_at ? interview.scheduled_at : null,
      done: interview.status === "CONFIRMED" || !!interview.completed_at,
      icon: CheckCircle2,
    },
    {
      label: "Entretien terminé",
      date: interview.completed_at,
      done: !!interview.completed_at,
      icon: CalendarCheck,
    },
    {
      label: "Décision finale",
      date: interview.final_decision ? interview.created_at : null,
      done: !!interview.final_decision,
      icon: Star,
    },
  ];

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
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
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

          {/* Student info */}
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

          {/* Company info */}
          <div className="mb-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Entreprise & Offre
            </h4>
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <AdminAvatar
                src={company.logo_url}
                name={company.company_name}
                size={40}
                className="rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {offer.title}
                </p>
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3" /> {company.company_name}
                </span>
                {company.user && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>
                      {company.user.prenom} {company.user.nom}
                    </span>
                    <span className="text-gray-300">·</span>
                    <a
                      href={`mailto:${company.user.email}`}
                      className="text-indigo-500 hover:text-indigo-600"
                    >
                      {company.user.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interview details */}
          <div className="mb-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Détails de l&apos;entretien
            </h4>
            <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-700">
                  {new Date(interview.scheduled_at).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-700">
                  {new Date(interview.scheduled_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {interview.completed_at && (
                    <span className="text-gray-400 ml-2">
                      — Terminé à{" "}
                      {new Date(interview.completed_at).toLocaleTimeString(
                        "fr-FR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Timer className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Durée :{" "}
                  {computeDuration(
                    interview.scheduled_at,
                    interview.completed_at,
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TypeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{tc.label}</span>
              </div>
              {interview.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {interview.type === "ONLINE" ? (
                    <a
                      href={interview.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      Rejoindre <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-600">{interview.location}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Application notes */}
          {interview.application.motivation && (
            <div className="mb-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Lettre de motivation
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">
                {interview.application.motivation}
              </p>
            </div>
          )}

          {interview.application.notes && (
            <div className="mb-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Notes internes
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 rounded-xl p-4 whitespace-pre-wrap">
                {interview.application.notes}
              </p>
            </div>
          )}

          {/* Outcome */}
          <div className="mb-6 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Résultat
            </h4>
            {interview.final_decision || interview.rating ? (
              <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                {interview.rating != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-600">
                      Note : {interview.rating}/5
                    </span>
                    <div className="flex items-center gap-0.5 ml-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= (interview.rating || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {interview.final_decision && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Décision :{" "}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg font-medium ${
                        interview.final_decision === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-700"
                          : interview.final_decision === "REJECTED"
                            ? "bg-red-100 text-red-600"
                            : interview.final_decision === "ADDITIONAL_INTERVIEW"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {interview.final_decision === "ACCEPTED"
                        ? "Accepté"
                        : interview.final_decision === "REJECTED"
                          ? "Refusé"
                          : interview.final_decision === "ADDITIONAL_INTERVIEW"
                            ? "Entretien supplémentaire requis"
                            : interview.final_decision}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-400 text-center">
                En attente de décision
              </div>
            )}
          </div>

          {/* Feedback */}
          {(interview.strengths ||
            interview.weaknesses ||
            interview.feedback_notes) && (
            <div className="mb-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                Feedback
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {interview.strengths && (
                  <div className="text-sm">
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
                      Points à améliorer :{" "}
                    </span>
                    <span className="text-gray-600">
                      {interview.weaknesses}
                    </span>
                  </div>
                )}
                {interview.feedback_notes && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Commentaires :{" "}
                    </span>
                    <span className="text-gray-600">
                      {interview.feedback_notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Chronologie
            </h4>
            <div className="space-y-0">
              {timelineSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-6 my-1 ${
                            step.done ? "bg-indigo-200" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          step.done ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(step.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span>
              Créé le{" "}
              {new Date(interview.created_at).toLocaleDateString("fr-FR")}
            </span>
            <span>Mis à jour {timeAgo(interview.updated_at)}</span>
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

/* ── Edit / Reschedule Modal ─────────────────────────────────────────────── */

function EditModal({
  interview,
  open,
  onClose,
  onSave,
}: {
  interview: Interview | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: {
    scheduled_at: string;
    type: "ONLINE" | "ON_SITE";
    location: string;
  }) => Promise<void>;
}) {
  const [scheduledAt, setScheduledAt] = useState(
    interview?.scheduled_at?.slice(0, 16) ?? "",
  );
  const [type, setType] = useState<"ONLINE" | "ON_SITE">(
    interview?.type ?? "ONLINE",
  );
  const [location, setLocation] = useState(interview?.location ?? "");
  const [saving, setSaving] = useState(false);

  if (!open || !interview) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(interview.id_interview, {
        scheduled_at: scheduledAt,
        type,
        location,
      });
      onClose();
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
          Modifier l&apos;entretien
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {interview.application.student.user.prenom}{" "}
          {interview.application.student.user.nom}
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Date et heure
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Type
            </label>
            <div className="flex gap-3">
              {(
                [
                  { key: "ONLINE" as const, label: "En ligne", icon: Video },
                  {
                    key: "ON_SITE" as const,
                    label: "Sur site",
                    icon: Building2,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition font-medium ${
                    type === t.key
                      ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Lieu / Lien{" "}
              <span className="text-gray-400 font-normal normal-case">
                (optionnel)
              </span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                type === "ONLINE"
                  ? "Lien de visioconférence"
                  : "Adresse du lieu"
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !scheduledAt}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar View ───────────────────────────────────────────────────────── */

function CalendarView({
  interviews,
  onSelectInterview,
}: {
  interviews: Interview[];
  onSelectInterview: (iv: Interview) => void;
}) {
  const [mode, setMode] = useState<CalendarMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthDays = useMemo(() => {
    if (mode !== "month") return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentDate, mode]);

  const weekDays = useMemo(() => {
    if (mode !== "week") return [];
    const start = new Date(currentDate);
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate, mode]);

  const getInterviewsForDay = useCallback(
    (date: Date) =>
      interviews.filter((iv) => isSameDay(new Date(iv.scheduled_at), date)),
    [interviews],
  );

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (mode === "month") d.setMonth(d.getMonth() - 1);
    else if (mode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (mode === "month") d.setMonth(d.getMonth() + 1);
    else if (mode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const navigateToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (mode === "month")
      return currentDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    if (mode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      if (!start || !end) return "";
      return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [currentDate, mode, weekDays]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Calendar header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrev}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-gray-800 min-w-[200px] text-center">
              {headerLabel}
            </h3>
            <button
              onClick={navigateNext}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={navigateToday}
              className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition ml-2"
            >
              Aujourd&apos;hui
            </button>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(
              [
                { key: "month" as CalendarMode, label: "Mois" },
                { key: "week" as CalendarMode, label: "Semaine" },
                { key: "day" as CalendarMode, label: "Jour" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  mode === m.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Month grid */}
      {mode === "month" && (
        <div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {dayLabels.map((d) => (
              <div
                key={d}
                className="px-2 py-2.5 text-center text-xs font-medium text-gray-400"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const dayInterviews = day ? getInterviewsForDay(day) : [];
              const isCurrentDay =
                day && isSameDay(day, new Date());
              return (
                <div
                  key={idx}
                  className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-gray-50 ${
                    !day ? "bg-gray-50/50" : ""
                  } ${isCurrentDay ? "bg-indigo-50/30" : ""}`}
                >
                  {day && (
                    <>
                      <span
                        className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
                          isCurrentDay
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="space-y-0.5">
                        {dayInterviews.slice(0, 3).map((iv) => {
                          const sc =
                            statusConfig[getEffectiveStatus(iv)] ||
                            statusConfig.PENDING;
                          return (
                            <button
                              key={iv.id_interview}
                              onClick={() => onSelectInterview(iv)}
                              className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate ${sc.bg} ${sc.text} font-medium hover:opacity-80 transition`}
                            >
                              {iv.application.student.user.prenom}{" "}
                              {iv.application.student.user.nom.charAt(0)}.
                            </button>
                          );
                        })}
                        {dayInterviews.length > 3 && (
                          <span className="text-[10px] text-gray-400 px-1">
                            +{dayInterviews.length - 3} de plus
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week grid */}
      {mode === "week" && (
        <div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((day, idx) => {
              const isCurrentDay = isSameDay(day, new Date());
              const dayInterviews = getInterviewsForDay(day);
              return (
                <div
                  key={idx}
                  className={`p-2 text-center border-r border-gray-50 last:border-r-0 ${
                    isCurrentDay ? "bg-indigo-50/30" : ""
                  }`}
                >
                  <span className="text-[10px] text-gray-400 uppercase">
                    {dayLabels[idx]}
                  </span>
                  <div
                    className={`text-lg font-semibold ${
                      isCurrentDay ? "text-indigo-600" : "text-gray-800"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {dayInterviews.length > 0 && (
                    <span className="text-[10px] text-indigo-500 font-medium">
                      {dayInterviews.length} entretien
                      {dayInterviews.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {weekDays.map((day, idx) => {
              const dayInterviews = getInterviewsForDay(day);
              return (
                <div key={idx} className="flex">
                  <div className="w-20 sm:w-24 flex-shrink-0 p-2 text-center border-r border-gray-50">
                    <span className="text-xs text-gray-400">
                      {dayLabels[idx]} {day.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 p-2 space-y-1">
                    {dayInterviews.length === 0 ? (
                      <div className="h-8 flex items-center justify-center text-[10px] text-gray-300">
                        Aucun
                      </div>
                    ) : (
                      dayInterviews.map((iv) => {
                        const sc =
                          statusConfig[getEffectiveStatus(iv)] ||
                          statusConfig.PENDING;
                        return (
                          <button
                            key={iv.id_interview}
                            onClick={() => onSelectInterview(iv)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:opacity-80 transition ${sc.bg} ${sc.text}`}
                          >
                            <Clock className="w-3 h-3" />
                            {new Date(
                              iv.scheduled_at,
                            ).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            — {iv.application.student.user.prenom}{" "}
                            {iv.application.student.user.nom}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {mode === "day" && (
        <div className="max-h-[500px] overflow-y-auto">
          <div className="p-4 space-y-2">
            {getInterviewsForDay(currentDate).length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Aucun entretien ce jour
                </p>
              </div>
            ) : (
              getInterviewsForDay(currentDate).map((iv) => {
                const sc =
                  statusConfig[getEffectiveStatus(iv)] || statusConfig.PENDING;
                const tc = typeConfig[iv.type] || typeConfig.ONLINE;
                const TypeIcon = tc.icon;
                return (
                  <button
                    key={iv.id_interview}
                    onClick={() => onSelectInterview(iv)}
                    className={`w-full text-left p-4 rounded-xl border transition hover:shadow-sm ${sc.bg} border-transparent`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-gray-800 min-w-[50px]">
                        {new Date(iv.scheduled_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {iv.application.student.user.prenom}{" "}
                          {iv.application.student.user.nom}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {iv.application.offer.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${tc.bg} ${tc.text}`}
                        >
                          <TypeIcon className="w-3 h-3" /> {tc.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>("scheduled_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [viewInterview, setViewInterview] =
    useState<DetailedInterview | null>(null);
  const [editInterview, setEditInterview] = useState<Interview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Interview | null>(null);
  const [bulkAction, setBulkAction] = useState<
    "complete" | "cancel" | "delete" | null
  >(null);

  /* ── Data Fetch ────────────────────────────────────────────────────────── */

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await api.get("/interviews", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted)
          setInterviews(
            Array.isArray(res.data) ? res.data : res.data.data || [],
          );
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
    const total = interviews.length;
    const scheduled = interviews.filter((i) => i.status === "PENDING").length;
    const completed = interviews.filter(
      (i) => i.status === "CONFIRMED" && i.completed_at,
    ).length;
    const cancelled = interviews.filter((i) => i.status === "CANCELLED").length;
    const confirmed = interviews.filter(
      (i) => i.status === "CONFIRMED" && !i.completed_at,
    ).length;
    const inProgress = interviews.filter(
      (i) => i.status === "CONFIRMED" && !i.completed_at && isToday(i.scheduled_at),
    ).length;
    const rescheduled = interviews.filter(
      (i) =>
        i.status === "PENDING" &&
        new Date(i.updated_at).getTime() - new Date(i.created_at).getTime() >
          60000,
    ).length;
    const upcomingToday = interviews.filter(
      (i) => isToday(i.scheduled_at) && i.status !== "CANCELLED",
    ).length;
    const upcomingWeek = interviews.filter(
      (i) =>
        isThisWeek(i.scheduled_at) &&
        new Date(i.scheduled_at) >= new Date() &&
        i.status !== "CANCELLED",
    ).length;
    return {
      total,
      scheduled,
      completed,
      cancelled,
      confirmed,
      inProgress,
      rescheduled,
      upcomingToday,
      upcomingWeek,
    };
  }, [interviews]);

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    interviews.forEach((i) =>
      map.set(
        i.application.offer.company.company_name,
        i.application.offer.company.company_name,
      ),
    );
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [interviews]);

  /* ── Filter + Sort + Paginate ──────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = [...interviews];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          `${i.application.student.user.prenom} ${i.application.student.user.nom}`
            .toLowerCase()
            .includes(q) ||
          i.application.student.user.email.toLowerCase().includes(q) ||
          i.application.offer.title.toLowerCase().includes(q) ||
          i.application.offer.company.company_name
            .toLowerCase()
            .includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter(
        (i) => getEffectiveStatus(i) === statusFilter,
      );
    }

    if (typeFilter !== "ALL") {
      result = result.filter((i) => i.type === typeFilter);
    }

    if (companyFilter !== "ALL") {
      result = result.filter(
        (i) => i.application.offer.company.company_name === companyFilter,
      );
    }

    if (dateFilter) {
      result = result.filter((i) => {
        const ivDate = new Date(i.scheduled_at).toISOString().split("T")[0];
        return ivDate === dateFilter;
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "scheduled_at":
          cmp =
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime();
          break;
        case "student":
          cmp = `${a.application.student.user.prenom} ${a.application.student.user.nom}`.localeCompare(
            `${b.application.student.user.prenom} ${b.application.student.user.nom}`,
            "fr",
          );
          break;
        case "company":
          cmp =
            a.application.offer.company.company_name.localeCompare(
              b.application.offer.company.company_name,
              "fr",
            );
          break;
        case "offer":
          cmp = a.application.offer.title.localeCompare(
            b.application.offer.title,
            "fr",
          );
          break;
        case "status":
          cmp = getEffectiveStatus(a).localeCompare(getEffectiveStatus(b));
          break;
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    interviews,
    search,
    statusFilter,
    typeFilter,
    companyFilter,
    dateFilter,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const setSearchValue = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  const setStatusFilterValue = useCallback((v: string) => {
    setStatusFilter(v);
    setPage(1);
  }, []);
  const setTypeFilterValue = useCallback((v: string) => {
    setTypeFilter(v);
    setPage(1);
  }, []);
  const setCompanyFilterValue = useCallback((v: string) => {
    setCompanyFilter(v);
    setPage(1);
  }, []);
  const setDateFilterValue = useCallback((v: string) => {
    setDateFilter(v);
    setPage(1);
  }, []);
  const setPageSizeValue = useCallback((v: number) => {
    setPageSize(v);
    setPage(1);
  }, []);

  /* ── Selection ─────────────────────────────────────────────────────────── */

  const allOnPageSelected =
    paginated.length > 0 &&
    paginated.every((i) => selected.has(i.id_interview));
  const someOnPageSelected = paginated.some((i) =>
    selected.has(i.id_interview),
  );

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const n = new Set(prev);
        paginated.forEach((i) => n.delete(i.id_interview));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        paginated.forEach((i) => n.add(i.id_interview));
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

  const handleViewDetails = async (iv: Interview) => {
    try {
      const res = await api.get(`/interviews/${iv.id_interview}`);
      setViewInterview(res.data);
    } catch {
      showToast("error", "Erreur lors du chargement des détails");
    }
  };

  const handleEditSave = async (
    id: number,
    data: { scheduled_at: string; type: "ONLINE" | "ON_SITE"; location: string },
  ) => {
    try {
      const res = await api.put(`/interviews/${id}`, {
        scheduled_at: data.scheduled_at,
        type: data.type,
        location: data.location || undefined,
      });
      setInterviews((prev) =>
        prev.map((i) =>
          i.id_interview === id ? { ...i, ...res.data } : i,
        ),
      );
      showToast("success", "Entretien mis à jour");
    } catch {
      showToast("error", "Erreur lors de la mise à jour");
      throw new Error("Failed");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const res = await api.patch(`/interviews/${id}/complete`);
      setInterviews((prev) =>
        prev.map((i) =>
          i.id_interview === id
            ? { ...i, status: "CONFIRMED", completed_at: res.data.completed_at }
            : i,
        ),
      );
      showToast("success", "Entretien marqué comme terminé");
    } catch {
      showToast("error", "Erreur lors de la mise à jour");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.put(`/interviews/${id}`, { status: "CANCELLED" });
      setInterviews((prev) =>
        prev.map((i) =>
          i.id_interview === id ? { ...i, status: "CANCELLED" as const } : i,
        ),
      );
      showToast("success", "Entretien annulé");
    } catch {
      showToast("error", "Erreur lors de l'annulation");
    }
  };

  const handleDelete = async (iv: Interview) => {
    try {
      await api.delete(`/interviews/${iv.id_interview}`);
      setInterviews((prev) =>
        prev.filter((i) => i.id_interview !== iv.id_interview),
      );
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(iv.id_interview);
        return n;
      });
      showToast("success", "Entretien supprimé");
    } catch {
      showToast("error", "Erreur lors de la suppression");
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selected.size === 0) {
      showToast("error", "Aucun entretien sélectionné");
      setBulkAction(null);
      return;
    }
    const ids = Array.from(selected);

    if (bulkAction === "delete") {
      try {
        await Promise.all(ids.map((id) => api.delete(`/interviews/${id}`)));
        setInterviews((prev) =>
          prev.filter((i) => !selected.has(i.id_interview)),
        );
        setSelected(new Set());
        showToast("success", `${ids.length} entretien(s) supprimé(s)`);
      } catch {
        showToast("error", "Erreur lors de la suppression groupée");
      }
    } else if (bulkAction === "complete") {
      try {
        await Promise.all(ids.map((id) => api.patch(`/interviews/${id}/complete`)));
        setInterviews((prev) =>
          prev.map((i) =>
            selected.has(i.id_interview)
              ? { ...i, status: "CONFIRMED" as const, completed_at: new Date().toISOString() }
              : i,
          ),
        );
        setSelected(new Set());
        showToast("success", `${ids.length} entretien(s) terminé(s)`);
      } catch {
        showToast("error", "Erreur lors de l'action groupée");
      }
    } else if (bulkAction === "cancel") {
      try {
        await Promise.all(
          ids.map((id) =>
            api.put(`/interviews/${id}`, { status: "CANCELLED" }),
          ),
        );
        setInterviews((prev) =>
          prev.map((i) =>
            selected.has(i.id_interview)
              ? { ...i, status: "CANCELLED" as const }
              : i,
          ),
        );
        setSelected(new Set());
        showToast("success", `${ids.length} entretien(s) annulé(s)`);
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
      "Téléphone",
      "Niveau",
      "Université",
      "Entreprise",
      "Recruteur",
      "Offre",
      "Type",
      "Date",
      "Heure",
      "Lieu",
      "Statut",
      "Créé le",
    ];
    const rows = filtered.map((i) => [
      i.id_interview,
      `${i.application.student.user.prenom} ${i.application.student.user.nom}`,
      i.application.student.user.email,
      i.application.student.phone || "",
      i.application.student.level || "",
      i.application.student.university || "",
      i.application.offer.company.company_name,
      `${i.application.offer.company.user.prenom} ${i.application.offer.company.user.nom}`,
      i.application.offer.title,
      i.type === "ONLINE" ? "En ligne" : "Sur site",
      new Date(i.scheduled_at).toLocaleDateString("fr-FR"),
      new Date(i.scheduled_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      i.location || "",
      statusConfig[getEffectiveStatus(i)]?.label || i.status,
      new Date(i.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "entretiens.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export CSV téléchargé");
  };

  const activeFilters =
    (statusFilter !== "ALL" ? 1 : 0) +
    (typeFilter !== "ALL" ? 1 : 0) +
    (companyFilter !== "ALL" ? 1 : 0) +
    (dateFilter ? 1 : 0);

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
          Impossible de charger les entretiens.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            setError(false);
            try {
              const res = await api.get("/interviews");
              setInterviews(
                Array.isArray(res.data) ? res.data : res.data.data || [],
              );
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
            Entretiens
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez tous les entretiens de recrutement.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Calendar}
          color="indigo"
          description="Tous les entretiens"
        />
        <StatCard
          label="Planifiés"
          value={stats.scheduled}
          icon={CalendarClock}
          color="blue"
          description="En attente"
        />
        <StatCard
          label="Confirmés"
          value={stats.confirmed}
          icon={CheckCircle2}
          color="emerald"
          description="Confirmés"
        />
        <StatCard
          label="En cours"
          value={stats.inProgress}
          icon={Timer}
          color="cyan"
          description="Aujourd'hui"
        />
        <StatCard
          label="Terminés"
          value={stats.completed}
          icon={CalendarCheck}
          color="purple"
          description="Complétés"
        />
        <StatCard
          label="Annulés"
          value={stats.cancelled}
          icon={Ban}
          color="rose"
          description="Annulés"
        />
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <CalendarView
          interviews={filtered}
          onSelectInterview={handleViewDetails}
        />
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher par étudiant, email, offre, entreprise..."
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
                    <option value="PENDING">Planifié</option>
                    <option value="RESCHEDULED">Reporté</option>
                    <option value="CONFIRMED">Confirmé</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                    <option value="CANDIDATE_ABSENT">Candidat absent</option>
                    <option value="RECRUITER_ABSENT">Recruteur absent</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilterValue(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer"
                  >
                    <option value="ALL">Tous</option>
                    <option value="ONLINE">En ligne</option>
                    <option value="ON_SITE">Sur site</option>
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
                    {companies.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Date:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilterValue(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer"
                  />
                </div>
                {activeFilters > 0 && (
                  <button
                    onClick={() => {
                      setStatusFilterValue("ALL");
                      setTypeFilterValue("ALL");
                      setCompanyFilterValue("ALL");
                      setDateFilterValue("");
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
                {selected.size} sélectionné(s)
              </span>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <button
                  onClick={() => setBulkAction("complete")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terminer
                </button>
                <button
                  onClick={() => setBulkAction("cancel")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition"
                >
                  <Ban className="w-3.5 h-3.5" /> Annuler
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
                    const rows = interviews
                      .filter((i) => ids.includes(i.id_interview))
                      .map(
                        (i) =>
                          `${i.application.student.user.prenom} ${i.application.student.user.nom},${i.application.student.user.email},${i.application.offer.company.company_name},${i.application.offer.company.user.prenom} ${i.application.offer.company.user.nom},${i.application.offer.title},${i.type},${new Date(i.scheduled_at).toLocaleDateString("fr-FR")},${statusConfig[getEffectiveStatus(i)]?.label || i.status}`,
                      );
                    const csv = [
                      "Nom,Email,Entreprise,Recruteur,Offre,Type,Date,Statut",
                      ...rows,
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const el = document.createElement("a");
                    el.href = url;
                    el.download = "entretiens-selection.csv";
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
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">
                {search || activeFilters > 0
                  ? "Aucun entretien trouvé"
                  : "Aucun entretien"}
              </p>
              <p className="text-xs text-gray-400">
                {search || activeFilters > 0
                  ? "Essayez de modifier vos critères de recherche"
                  : "Les entretiens apparaîtront ici une fois planifiés"}
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
                        <span className="text-xs font-medium text-gray-500">
                          Type
                        </span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => handleSort("scheduled_at")}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                        >
                          Date / Heure{" "}
                          <SortIcon
                            field="scheduled_at"
                            sortField={sortField}
                            sortDir={sortDir}
                          />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs font-medium text-gray-500">
                          Lieu
                        </span>
                      </th>
                      <th className="text-left px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs font-medium text-gray-500">
                          Recruteur
                        </span>
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
                    {paginated.map((iv) => {
                      const effectiveStatus = getEffectiveStatus(iv);
                      const sc =
                        statusConfig[effectiveStatus] || statusConfig.PENDING;
                      const tc = typeConfig[iv.type] || typeConfig.ONLINE;
                      const TypeIcon = tc.icon;
                      const isSelected = selected.has(iv.id_interview);
                      return (
                        <tr
                          key={iv.id_interview}
                          className={`border-b border-gray-50 transition ${isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleSelect(iv.id_interview)}
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
                                src={iv.application.student.photo_url}
                                name={`${iv.application.student.user.prenom} ${iv.application.student.user.nom}`}
                                size={40}
                                className="rounded-full"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {iv.application.student.user.prenom}{" "}
                                  {iv.application.student.user.nom}
                                </div>
                                <div className="text-xs text-gray-400 truncate md:hidden">
                                  {iv.application.offer.company.company_name}
                                </div>
                                {iv.application.student.university && (
                                  <div className="text-[11px] text-gray-400 truncate hidden sm:block">
                                    {iv.application.student.university}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <AdminAvatar
                                src={iv.application.offer.company.logo_url}
                                name={iv.application.offer.company.company_name}
                                size={28}
                                className="rounded-lg"
                              />
                              <span className="text-sm text-gray-600 truncate block max-w-[140px]">
                                {iv.application.offer.company.company_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-gray-600 truncate block max-w-[180px]">
                              {iv.application.offer.title}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium ${tc.bg} ${tc.text}`}
                            >
                              <TypeIcon className="w-3 h-3" />
                              {tc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700 font-medium">
                              {new Date(
                                iv.scheduled_at,
                              ).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                iv.scheduled_at,
                              ).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            {iv.location ? (
                              <div className="flex items-center gap-1 text-xs text-gray-500 max-w-[160px] truncate">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                {iv.type === "ONLINE" ? (
                                  <a
                                    href={iv.location}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-500 hover:text-indigo-600 truncate"
                                  >
                                    Lien
                                  </a>
                                ) : (
                                  <span className="truncate">
                                    {iv.location}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <div className="text-xs text-gray-600 truncate max-w-[120px]">
                              {iv.application.offer.company.user.prenom}{" "}
                              {iv.application.offer.company.user.nom}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                              />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ActionsDropdown
                              onView={() => handleViewDetails(iv)}
                              onEdit={() => setEditInterview(iv)}
                              onComplete={() => handleComplete(iv.id_interview)}
                              onCancel={() => setCancelTarget(iv)}
                              onDelete={() => setDeleteTarget(iv)}
                              status={effectiveStatus}
                              hasCompletedAt={!!iv.completed_at}
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
                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2)
                        pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                            page === pageNum
                              ? "bg-indigo-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
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
      )}

      {/* Modals */}
      <ViewModal
        interview={viewInterview}
        open={!!viewInterview}
        onClose={() => setViewInterview(null)}
      />

      <EditModal
        key={editInterview?.id_interview ?? "none"}
        interview={editInterview}
        open={!!editInterview}
        onClose={() => setEditInterview(null)}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Annuler l'entretien"
        message={`Êtes-vous sûr de vouloir annuler l'entretien de ${cancelTarget?.application.student.user.prenom} ${cancelTarget?.application.student.user.nom} pour « ${cancelTarget?.application.offer.title} » ? Le candidat sera notifié.`}
        confirmLabel="Annuler l'entretien"
        variant="warning"
        onConfirm={() => {
          if (cancelTarget) handleCancel(cancelTarget.id_interview);
          setCancelTarget(null);
        }}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'entretien"
        message={`Êtes-vous sûr de vouloir supprimer l'entretien de ${deleteTarget?.application.student.user.prenom} ${deleteTarget?.application.student.user.nom} pour « ${deleteTarget?.application.offer.title} » ? Cette action est irréversible.`}
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
            : bulkAction === "complete"
              ? "Terminer les entretiens"
              : "Annulation groupée"
        }
        message={
          bulkAction === "delete"
            ? `Êtes-vous sûr de vouloir supprimer ${selected.size} entretien(s) ? Cette action est irréversible.`
            : bulkAction === "complete"
              ? `Marquer ${selected.size} entretien(s) comme terminé(s) ?`
              : `Annuler ${selected.size} entretien(s) ? Le candidat sera notifié.`
        }
        confirmLabel={bulkAction === "delete" ? "Supprimer" : "Confirmer"}
        variant={bulkAction === "delete" ? "danger" : "warning"}
        onConfirm={handleBulk}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
