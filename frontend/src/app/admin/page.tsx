"use client";

import { useAuthStore } from "@/store/auth.store";
import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  UserPlus,
  Users,
  Tag,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface User {
  id_user: number;
  email: string;
  nom: string;
  prenom: string;
  created_at: string;
  user_roles: { role: { name: string } }[];
}

interface Company {
  id_company: number;
  company_name: string;
  id_user: number;
  user?: User;
}

interface Student {
  id_student: number;
  id_user: number;
  user?: User;
}

interface Offer {
  id_offer: number;
  title: string;
  status: string;
  created_at: string;
  id_company: number;
  company?: Company;
}

interface Application {
  id_application: number;
  status: string;
  applied_at: string;
  id_student: number;
  id_offer: number;
  offer?: Offer;
  student?: Student;
}

interface Interview {
  id_interview: number;
  scheduled_at: string;
  status: string;
  rating?: number;
  id_application: number;
  application?: Application;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const MONTHS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  return `Il y a ${Math.floor(days / 7)}sem`;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS_FR[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function getLast6Months(): string[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function countByMonth(
  items: { created_at?: string; applied_at?: string }[],
  keys: string[],
): Record<string, number> {
  const map: Record<string, number> = {};
  keys.forEach((k) => (map[k] = 0));
  items.forEach((item) => {
    const dateStr = item.created_at || item.applied_at;
    if (!dateStr) return;
    const k = getMonthKey(dateStr);
    if (k in map) map[k]++;
  });
  return map;
}

function isToday(dateStr: string): boolean {
  return dateStr.startsWith(new Date().toISOString().split("T")[0]);
}

/* ── Animated Counter ────────────────────────────────────────────────────── */

function AnimatedCounter({
  value,
  duration = 800,
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

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
      <div className="h-2 bg-gray-100 rounded w-24" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-40 mb-6" />
      <div className="h-56 bg-gray-50 rounded-xl" />
    </div>
  );
}

function SkeletonActivity() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-gray-100 rounded-lg" />
          <div className="flex-1">
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
            <div className="h-2 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */

const colorMap: Record<
  string,
  { bg: string; icon: string; ring: string; soft: string }
> = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100", soft: "bg-indigo-50/60 border-indigo-100" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100", soft: "bg-blue-50/60 border-blue-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100", soft: "bg-emerald-50/60 border-emerald-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100", soft: "bg-amber-50/60 border-amber-100" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", ring: "ring-rose-100", soft: "bg-rose-50/60 border-rose-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100", soft: "bg-purple-50/60 border-purple-100" },
  cyan: { bg: "bg-cyan-50", icon: "text-cyan-600", ring: "ring-cyan-100", soft: "bg-cyan-50/60 border-cyan-100" },
  sky: { bg: "bg-sky-50", icon: "text-sky-600", ring: "ring-sky-100", soft: "bg-sky-50/60 border-sky-100" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  href?: string;
}) {
  const c = colorMap[color] || colorMap.indigo;
  const card = (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} strokeWidth={1.8} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight mb-0.5">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-xs text-gray-400 font-medium">{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }
  return card;
}

/* ── Chart Tooltip ───────────────────────────────────────────────────────── */

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-500">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{" "}
          <span className="font-semibold text-gray-800">
            {p.value.toLocaleString("fr-FR")}
          </span>
        </p>
      ))}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */

export default function AdminPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/users"),
        api.get("/companies"),
        api.get("/students"),
        api.get("/offers"),
        api.get("/applications"),
        api.get("/interviews"),
      ]);

      const get = <T,>(idx: number, fallback: T[] = []): T[] => {
        if (results[idx].status !== "fulfilled") return fallback;
        const res = results[idx] as PromiseFulfilledResult<{ data: T[] }>;
        return Array.isArray(res.value?.data) ? res.value.data : fallback;
      };

      setUsers(get(0));
      setCompanies(get(1));
      setStudents(get(2));
      setOffers(get(3));
      setApplications(get(4));
      setInterviews(get(5));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Computed Stats ───────────────────────────────────────────────────── */

  const totalStudents = students.length;
  const totalCompanies = companies.length;
  const totalOffers = offers.length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter((a) => a.status === "EN_ATTENTE").length;
  const acceptedApplications = applications.filter((a) => a.status === "ACCEPTEE").length;
  const rejectedApplications = applications.filter((a) => a.status === "REFUSEE").length;
  const scheduledInterviews = interviews.filter(
    (i) => i.status === "PENDING" || i.status === "CONFIRMED",
  ).length;

  const newUsersToday = users.filter((u) => isToday(u.created_at)).length;
  const newOffersToday = offers.filter((o) => isToday(o.created_at)).length;
  const newAppsToday = applications.filter((a) => isToday(a.applied_at)).length;
  const interviewsToday = interviews.filter((i) => isToday(i.scheduled_at)).length;

  /* ── Chart Data ───────────────────────────────────────────────────────── */

  const last6 = getLast6Months();

  const appsByMonth = countByMonth(applications, last6);
  const appsChartData = last6.map((m) => ({
    month: getMonthLabel(m),
    Candidatures: appsByMonth[m],
  }));

  const studentUsers = users.filter((u) =>
    u.user_roles?.some((ur) => ur.role.name === "STUDENT"),
  );
  const companyUsers = users.filter((u) =>
    u.user_roles?.some((ur) => ur.role.name === "COMPANY"),
  );
  const studentRegs = countByMonth(studentUsers, last6);
  const companyRegs = countByMonth(companyUsers, last6);
  const regsChartData = last6.map((m) => ({
    month: getMonthLabel(m),
    Étudiants: studentRegs[m],
    Entreprises: companyRegs[m],
  }));

  const statusColors: Record<string, string> = {
    EN_ATTENTE: "#F59E0B",
    REVIEWING: "#6366F1",
    SHORTLISTED: "#8B5CF6",
    INTERVIEW_SCHEDULED: "#3B82F6",
    ACCEPTEE: "#10B981",
    REFUSEE: "#EF4444",
  };
  const statusLabels: Record<string, string> = {
    EN_ATTENTE: "En attente",
    REVIEWING: "En cours",
    SHORTLISTED: "Présélectionnée",
    INTERVIEW_SCHEDULED: "Entretien prévu",
    ACCEPTEE: "Acceptée",
    REFUSEE: "Refusée",
  };

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts)
    .map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || "#9CA3AF",
    }))
    .filter((d) => d.value > 0);

  /* ── Recent Activity ──────────────────────────────────────────────────── */

  type ActivityType = "student" | "company" | "offer" | "application";

  interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    subtitle: string;
    time: string;
  }

  const activityConfig: Record<
    ActivityType,
    { icon: LucideIcon; bg: string; text: string; label: string }
  > = {
    student: { icon: GraduationCap, bg: "bg-indigo-50", text: "text-indigo-600", label: "Étudiant" },
    company: { icon: Building2, bg: "bg-purple-50", text: "text-purple-600", label: "Entreprise" },
    offer: { icon: Briefcase, bg: "bg-emerald-50", text: "text-emerald-600", label: "Offre" },
    application: { icon: FileText, bg: "bg-amber-50", text: "text-amber-600", label: "Candidature" },
  };

  const recentActivity: ActivityItem[] = [
    ...studentUsers
      .slice(-4)
      .map((u) => ({
        id: `s-${u.id_user}`,
        type: "student" as const,
        title: `${u.prenom} ${u.nom}`,
        subtitle: "Nouvel étudiant inscrit",
        time: u.created_at,
      })),
    ...companyUsers
      .slice(-3)
      .map((u) => ({
        id: `c-${u.id_user}`,
        type: "company" as const,
        title: u.email.split("@")[0],
        subtitle: "Nouvelle entreprise inscrite",
        time: u.created_at,
      })),
    ...offers
      .slice(-4)
      .map((o) => ({
        id: `o-${o.id_offer}`,
        type: "offer" as const,
        title: o.title,
        subtitle: "Offre publiée",
        time: o.created_at,
      })),
    ...applications
      .slice(-4)
      .map((a) => ({
        id: `a-${a.id_application}`,
        type: "application" as const,
        title: `Candidature #${a.id_application}`,
        subtitle: statusLabels[a.status] || a.status,
        time: a.applied_at,
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  /* ── Quick Actions ────────────────────────────────────────────────────── */

  const quickActions: {
    href: string;
    icon: LucideIcon;
    label: string;
    desc: string;
    color: string;
  }[] = [
    { href: "/admin/users", icon: Users, label: "Étudiants", desc: "Gérer les comptes", color: "indigo" },
    { href: "/admin/companies", icon: Building2, label: "Entreprises", desc: "Gérer les entreprises", color: "purple" },
    { href: "/admin/offers", icon: Briefcase, label: "Offres", desc: "Gérer les offres", color: "emerald" },
    { href: "/admin/applications", icon: FileText, label: "Candidatures", desc: "Suivi des candidatures", color: "sky" },
    { href: "/admin/categories", icon: Tag, label: "Catégories", desc: "Référentiels", color: "amber" },
  ];

  /* ── Loading State ────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl" />
            <div>
              <div className="h-5 bg-white/20 rounded w-48 mb-2" />
              <div className="h-3 bg-white/20 rounded w-72" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 rounded w-12 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><SkeletonActivity /></div>
          <SkeletonChart />
        </div>
      </div>
    );
  }

  /* ── Error State ──────────────────────────────────────────────────────── */

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
          Impossible de charger les données du tableau de bord.
        </p>
        <button
          onClick={() => {
            setLoading(true);
            setError(false);
            fetchAll();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white rounded-full blur-3xl" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white rounded-full blur-2xl" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Bonjour, {user?.email?.split("@")[0]}
            </h1>
            <p className="text-indigo-100 text-sm">
              Voici un aperçu de la plateforme e-Stage aujourd&apos;hui.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-indigo-100">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center flex-shrink-0 backdrop-blur-sm ring-2 ring-white/30">
            <span className="text-xl font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() ?? "A"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Today's Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Nouvelles inscriptions",
            value: newUsersToday,
            icon: UserPlus,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Offres publiées",
            value: newOffersToday,
            icon: Briefcase,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Nouvelles candidatures",
            value: newAppsToday,
            icon: FileText,
            color: "bg-amber-50 text-amber-600",
          },
          {
            label: "Entretiens aujourd'hui",
            value: interviewsToday,
            icon: CalendarDays,
            color: "bg-sky-50 text-sky-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-all duration-200"
          >
            <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                <AnimatedCounter value={item.value} duration={600} />
              </div>
              <div className="text-[11px] text-gray-400 font-medium leading-tight">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Statistics Cards ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Statistiques</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Étudiants" value={totalStudents} icon={GraduationCap} color="indigo" href="/admin/users" />
          <StatCard label="Entreprises" value={totalCompanies} icon={Building2} color="purple" href="/admin/companies" />
          <StatCard label="Offres de stage" value={totalOffers} icon={Briefcase} color="emerald" href="/admin/offers" />
          <StatCard label="Candidatures" value={totalApplications} icon={FileText} color="amber" href="/admin/applications" />
          <StatCard label="En attente" value={pendingApplications} icon={Clock} color="sky" href="/admin/applications" />
          <StatCard label="Acceptées" value={acceptedApplications} icon={CheckCircle2} color="emerald" href="/admin/applications" />
          <StatCard label="Refusées" value={rejectedApplications} icon={XCircle} color="rose" href="/admin/applications" />
          <StatCard label="Entretiens planifiés" value={scheduledInterviews} icon={CalendarDays} color="blue" href="/admin/interviews" />
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications per month */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Candidatures par mois</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appsChartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Candidatures" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Statut des candidatures</h2>
          </div>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* ── Student vs Company Registrations ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Inscriptions — Étudiants vs Entreprises</h2>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regsChartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Étudiants" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Entreprises" fill="#A78BFA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Activity + Quick Actions ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Activité récente</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition"
            >
              Tout voir →
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.map((item) => {
                const cfg = activityConfig[item.type];
                const IconComp = cfg.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <IconComp className={`w-4 h-4 ${cfg.text}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {timeAgo(item.time)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Activity className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune activité récente</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Actions rapides</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const c = colorMap[action.color] || colorMap.indigo;
              const IconComp = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${c.soft} hover:shadow-sm transition-all duration-200 text-center`}
                >
                  <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <IconComp className={`w-4.5 h-4.5 ${c.icon}`} strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block leading-tight">
                      {action.label}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-tight">
                      {action.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
