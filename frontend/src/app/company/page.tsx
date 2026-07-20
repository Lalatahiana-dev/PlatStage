"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  MessageCircle,
  Building2,
  Bell,
  TrendingUp,
  TrendingDown,
  Loader2,
  CalendarClock,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  ChevronRight,
  Video,
  Play,
  UserCheck,
  Inbox,
} from "lucide-react";

interface Company {
  id_company: number;
  company_name: string;
  logo_url?: string;
  sector?: string;
  description?: string;
}

interface Offer {
  id_offer: number;
  title: string;
  description: string;
  location?: string;
  status: string;
  created_at: string;
  deadline?: string;
}

interface Application {
  id_application: number;
  motivation?: string;
  status: string;
  applied_at: string;
  student: {
    id_student: number;
    university?: string;
    level?: string;
    photo_url?: string;
    cv_url?: string;
    user: { nom: string; prenom: string; email: string };
    skills: { skill: { id_skill: number; name: string } }[];
  };
  offer: { id_offer: number; title: string };
  interview?: { id_interview: number; status: string } | null;
}

interface Interview {
  id_interview: number;
  scheduled_at: string;
  location?: string;
  type: "ONLINE" | "ON_SITE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  application: {
    id_application: number;
    offer: { title: string };
    student: {
      user: { nom: string; prenom: string; email: string };
    };
  };
}

interface Conversation {
  id_conversation: number;
  updated_at: string;
  offer: { title: string };
  student: {
    id_student: number;
    user: { nom: string; prenom: string };
  };
  messages: { content: string; sent_at: string; is_read: boolean; id_sender: number }[];
}

interface Notification {
  id_notification: number;
  title?: string;
  content: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50" },
  REVIEWING: { label: "En review", color: "text-blue-600", bg: "bg-blue-50" },
  SHORTLISTED: { label: "Présélection", color: "text-purple-600", bg: "bg-purple-50" },
  INTERVIEW_SCHEDULED: { label: "Entretien", color: "text-indigo-600", bg: "bg-indigo-50" },
  ACCEPTEE: { label: "Acceptée", color: "text-emerald-600", bg: "bg-emerald-50" },
  REFUSEE: { label: "Refusée", color: "text-red-500", bg: "bg-red-50" },
};

const NOTIF_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  NEW_APPLICATION: { icon: <FileText className="w-4 h-4" />, color: "text-blue-500 bg-blue-50" },
  ACCEPTED: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500 bg-emerald-50" },
  REFUSED: { icon: <XCircle className="w-4 h-4" />, color: "text-red-500 bg-red-50" },
  NEW_MESSAGE: { icon: <MessageCircle className="w-4 h-4" />, color: "text-indigo-500 bg-indigo-50" },
  INTERVIEW_SCHEDULED: { icon: <Calendar className="w-4 h-4" />, color: "text-amber-500 bg-amber-50" },
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
          <div className="h-5 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
        <div className="h-2.5 bg-gray-200 rounded w-48" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-16" />
    </div>
  );
}

export default function CompanyPage() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyNotFound, setCompanyNotFound] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const companyRes = await api.get(`/companies/user/${user.userId}`);
        const cid = companyRes.data.id_company;
        setCompany(companyRes.data);

        const [offersRes, interviewsRes, convsRes, notifsRes] =
          await Promise.all([
            api.get(`/offers/company/${cid}`),
            api.get(`/interviews/company/${cid}`).catch(() => ({ data: [] })),
            api.get(`/conversations/company/${cid}`).catch(() => ({ data: [] })),
            api.get(`/notifications/user/${user.userId}`).catch(() => ({ data: [] })),
          ]);

        setOffers(offersRes.data);
        setInterviews(interviewsRes.data);
        setConversations(convsRes.data);
        setNotifications(notifsRes.data);

        const appResults = await Promise.all(
          offersRes.data.map((o: Offer) =>
            api
              .get(`/applications/offer/${o.id_offer}`)
              .then((r) => r.data)
              .catch(() => []),
          ),
        );
        setAllApplications(appResults.flat());
      } catch {
        setCompanyNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const markNotifRead = async (id: number) => {
    setMarkingRead(id);
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id_notification === id ? { ...n, is_read: true } : n)),
      );
    } catch {} finally {
      setMarkingRead(null);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await api.put(`/notifications/user/${user.userId}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const stats = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekApps = allApplications.filter(
      (a) => new Date(a.applied_at) >= weekAgo,
    ).length;
    const lastWeekApps = allApplications.filter(
      (a) => new Date(a.applied_at) >= twoWeeksAgo && new Date(a.applied_at) < weekAgo,
    ).length;
    const appTrend =
      lastWeekApps > 0
        ? Math.round(((thisWeekApps - lastWeekApps) / lastWeekApps) * 100)
        : thisWeekApps > 0
          ? 100
          : 0;

    const activeOffers = offers.filter((o) => o.status === "PUBLISHED").length;
    const publishedThisWeek = offers.filter(
      (o) => new Date(o.created_at) >= weekAgo,
    ).length;
    const publishedLastWeek = offers.filter(
      (o) => new Date(o.created_at) >= twoWeeksAgo && new Date(o.created_at) < weekAgo,
    ).length;
    const offerTrend =
      publishedLastWeek > 0
        ? Math.round(((publishedThisWeek - publishedLastWeek) / publishedLastWeek) * 100)
        : publishedThisWeek > 0
          ? 100
          : 0;

    const newToday = allApplications.filter(
      (a) => new Date(a.applied_at) >= today,
    ).length;

    const scheduledInterviews = interviews.filter(
      (i) => i.status !== "CANCELLED" && new Date(i.scheduled_at) > now,
    ).length;

    const accepted = allApplications.filter((a) => a.status === "ACCEPTEE").length;
    const pending = allApplications.filter(
      (a) => a.status === "EN_ATTENTE" || a.status === "REVIEWING",
    ).length;

    return {
      totalOffers: offers.length,
      activeOffers,
      totalApps: allApplications.length,
      newToday,
      scheduledInterviews,
      accepted,
      pending,
      appTrend,
      offerTrend,
    };
  }, [offers, allApplications, interviews, now]);

  const latestApps = useMemo(
    () =>
      [...allApplications]
        .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
        .slice(0, 5),
    [allApplications],
  );

  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter(
          (i) =>
            new Date(i.scheduled_at) > now && i.status !== "CANCELLED",
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        )
        .slice(0, 5),
    [interviews, now],
  );

  const recentNotifs = useMemo(
    () => notifications.slice(0, 8),
    [notifications],
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const monthlyApps = useMemo(() => {
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = allApplications.filter(
        (a) => {
          const ad = new Date(a.applied_at);
          return ad >= d && ad < next;
        },
      ).length;
      months.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }),
        count,
      });
    }
    return months;
  }, [allApplications, now]);

  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    allApplications.forEach((a) => {
      dist[a.status] = (dist[a.status] || 0) + 1;
    });
    return dist;
  }, [allApplications]);

  const acceptanceRate = allApplications.length
    ? Math.round((stats.accepted / allApplications.length) * 100)
    : 0;

  const interviewConversion = allApplications.length
    ? Math.round(
        (interviews.filter((i) => i.status !== "CANCELLED").length /
          allApplications.length) *
          100,
      )
    : 0;

  const greeting =
    now.getHours() < 12
      ? "Bonjour"
      : now.getHours() < 18
        ? "Bon après-midi"
        : "Bonsoir";

  const hasOffers = offers.length > 0;
  const hasApps = allApplications.length > 0;

  if (companyNotFound) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Profil entreprise non trouvé
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Créez votre profil entreprise pour accéder au tableau de bord et
            commencer à recruter.
          </p>
          <Link
            href="/company/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Créer mon profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {company?.company_name || user?.email.split("@")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Voici un aperçu de votre activité de recrutement.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            {
              label: "Total offres",
              value: stats.totalOffers,
              icon: <Briefcase className="w-5 h-5" />,
              color: "bg-indigo-50 text-indigo-600",
              trend: stats.offerTrend,
            },
            {
              label: "Offres actives",
              value: stats.activeOffers,
              icon: <Play className="w-5 h-5" />,
              color: "bg-emerald-50 text-emerald-600",
              trend: null,
            },
            {
              label: "Candidatures",
              value: stats.totalApps,
              icon: <FileText className="w-5 h-5" />,
              color: "bg-blue-50 text-blue-600",
              trend: stats.appTrend,
            },
            {
              label: "Nouvelles aujourd'hui",
              value: stats.newToday,
              icon: <Zap className="w-5 h-5" />,
              color: "bg-amber-50 text-amber-600",
              trend: null,
            },
            {
              label: "Entretiens à venir",
              value: stats.scheduledInterviews,
              icon: <CalendarClock className="w-5 h-5" />,
              color: "bg-purple-50 text-purple-600",
              trend: null,
            },
            {
              label: "Acceptés",
              value: stats.accepted,
              icon: <UserCheck className="w-5 h-5" />,
              color: "bg-teal-50 text-teal-600",
              trend: null,
            },
            {
              label: "En attente",
              value: stats.pending,
              icon: <Clock className="w-5 h-5" />,
              color: "bg-orange-50 text-orange-600",
              trend: null,
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}
                >
                  {card.icon}
                </div>
                {card.trend !== null && card.trend !== undefined && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                      card.trend >= 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {card.trend >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {card.trend >= 0 ? "+" : ""}
                    {card.trend}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{card.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: "Créer une offre",
              desc: "Publier une nouvelle offre de stage",
              icon: <Plus className="w-5 h-5" />,
              href: "/company/offers",
              color: "from-indigo-500 to-indigo-600",
              ring: "ring-indigo-100",
            },
            {
              label: "Candidatures",
              desc: "Consulter les candidatures reçues",
              icon: <Users className="w-5 h-5" />,
              href: "/company/applications",
              color: "from-blue-500 to-blue-600",
              ring: "ring-blue-100",
            },
            {
              label: "Entretiens",
              desc: "Gérer les entretiens planifiés",
              icon: <Calendar className="w-5 h-5" />,
              href: "/company/interviews",
              color: "from-purple-500 to-purple-600",
              ring: "ring-purple-100",
            },
            {
              label: "Messages",
              desc: "Communiquer avec les candidats",
              icon: <MessageCircle className="w-5 h-5" />,
              href: "/company/messages",
              color: "from-emerald-500 to-emerald-600",
              ring: "ring-emerald-100",
            },
            {
              label: "Profil entreprise",
              desc: "Mettre à jour votre profil",
              icon: <Building2 className="w-5 h-5" />,
              href: "/company/profile",
              color: "from-amber-500 to-amber-600",
              ring: "ring-amber-100",
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
              >
                {action.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{action.label}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty State for no offers */}
      {!loading && !hasOffers && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 p-8 text-center"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Commencez votre recrutement
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Créez votre première offre de stage pour commencer à recevoir des
            candidatures et trouver les meilleurs talents.
          </p>
          <Link
            href="/company/offers"
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Créer une offre de stage
          </Link>
        </motion.div>
      )}

      {/* Main Content Grid */}
      {hasOffers && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Latest Applications + Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Applications */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Dernières candidatures
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Les candidatures les plus récentes
                  </p>
                </div>
                <Link
                  href="/company/applications"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : !hasApps ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Aucune candidature pour le moment
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les candidatures apparaîtront ici une fois reçues.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {latestApps.map((app) => {
                    const sc = STATUS_COLORS[app.status] || STATUS_COLORS.EN_ATTENTE;
                    return (
                      <div
                        key={app.id_application}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {app.student.user.prenom.charAt(0)}
                          {app.student.user.nom.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {app.student.user.prenom} {app.student.user.nom}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {app.offer.title}
                            {app.student.university && ` · ${app.student.university}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400 hidden sm:block">
                            {new Date(app.applied_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${sc.bg} ${sc.color}`}
                          >
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Application Status Distribution */}
            {!loading && hasApps && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Répartition des candidatures
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Donut */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      {(() => {
                        const total = allApplications.length;
                        if (total === 0)
                          return (
                            <circle
                              cx="18"
                              cy="18"
                              r="15.9"
                              fill="none"
                              stroke="#f3f4f6"
                              strokeWidth="3"
                            />
                          );
                        const colors = [
                          { status: "EN_ATTENTE", color: "#f59e0b" },
                          { status: "REVIEWING", color: "#3b82f6" },
                          { status: "SHORTLISTED", color: "#8b5cf6" },
                          { status: "INTERVIEW_SCHEDULED", color: "#6366f1" },
                          { status: "ACCEPTEE", color: "#10b981" },
                          { status: "REFUSEE", color: "#ef4444" },
                        ];
                        let cumPercent = 0;
                        return colors
                          .filter((c) => (statusDistribution[c.status] || 0) > 0)
                          .map((c) => {
                            const count = statusDistribution[c.status] || 0;
                            const pct = (count / total) * 100;
                            const offset = cumPercent;
                            cumPercent += pct;
                            return (
                              <circle
                                key={c.status}
                                cx="18"
                                cy="18"
                                r="15.9"
                                fill="none"
                                stroke={c.color}
                                strokeWidth="3"
                                strokeDasharray={`${pct} ${100 - pct}`}
                                strokeDashoffset={`${-offset}`}
                                className="transition-all duration-500"
                              />
                            );
                          });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {allApplications.length}
                      </span>
                      <span className="text-[9px] text-gray-400">total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {[
                      { key: "EN_ATTENTE", label: "En attente", color: "bg-amber-500" },
                      { key: "REVIEWING", label: "En review", color: "bg-blue-500" },
                      { key: "SHORTLISTED", label: "Présélection", color: "bg-purple-500" },
                      { key: "INTERVIEW_SCHEDULED", label: "Entretien", color: "bg-indigo-500" },
                      { key: "ACCEPTEE", label: "Acceptées", color: "bg-emerald-500" },
                      { key: "REFUSEE", label: "Refusées", color: "bg-red-500" },
                    ]
                      .filter((s) => (statusDistribution[s.key] || 0) > 0)
                      .map((s) => (
                        <div key={s.key} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                          <span className="text-xs text-gray-600">{s.label}</span>
                          <span className="text-xs font-semibold text-gray-900 ml-auto">
                            {statusDistribution[s.key]}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Applications Bar Chart */}
            {!loading && hasApps && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Candidatures par mois
                </h2>
                <div className="flex items-end gap-2 h-36">
                  {monthlyApps.map((m) => {
                    const maxCount = Math.max(...monthlyApps.map((x) => x.count), 1);
                    const height = (m.count / maxCount) * 100;
                    return (
                      <div
                        key={m.label}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-[10px] font-semibold text-gray-600">
                          {m.count}
                        </span>
                        <div className="w-full relative" style={{ height: "80px" }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 4)}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md"
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {!loading && hasApps && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Taux d'acceptation",
                    value: `${acceptanceRate}%`,
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    color: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    label: "Taux de conversion entretien",
                    value: `${interviewConversion}%`,
                    icon: <Target className="w-5 h-5" />,
                    color: "text-indigo-600 bg-indigo-50",
                  },
                  {
                    label: "Offres actives",
                    value: `${stats.activeOffers}/${stats.totalOffers}`,
                    icon: <BarChart3 className="w-5 h-5" />,
                    color: "text-blue-600 bg-blue-50",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-white rounded-xl border border-gray-100 p-4 text-center"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${m.color}`}
                    >
                      {m.icon}
                    </div>
                    <div className="text-xl font-bold text-gray-900">{m.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Upcoming Interviews + Activity + Notifications */}
          <div className="space-y-6">
            {/* Upcoming Interviews */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Entretiens à venir
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Prochains entretiens planifiés
                  </p>
                </div>
                <Link
                  href="/company/interviews"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : upcomingInterviews.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CalendarClock className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Aucun entretien à venir
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {upcomingInterviews.map((iv) => {
                    const d = new Date(iv.scheduled_at);
                    const daysUntil = Math.ceil(
                      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <div
                        key={iv.id_interview}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                          {iv.type === "ONLINE" ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {iv.application.student.user.prenom}{" "}
                            {iv.application.student.user.nom}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {iv.application.offer.title}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-medium text-gray-700">
                            {d.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {d.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                              daysUntil <= 1
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {daysUntil <= 0
                              ? "Aujourd'hui"
                              : daysUntil === 1
                                ? "Demain"
                                : `Dans ${daysUntil}j`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 pb-0">
                <h2 className="text-sm font-semibold text-gray-900">
                  Activité récente
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Dernières notifications
                </p>
              </div>

              {loading ? (
                <div className="p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : recentNotifs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune activité récente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentNotifs.map((n) => {
                    const iconConf = NOTIF_ICONS[n.type || ""] || {
                      icon: <Bell className="w-4 h-4" />,
                      color: "text-gray-500 bg-gray-50",
                    };
                    const timeAgo = getTimeAgo(n.created_at, now);
                    return (
                      <div
                        key={n.id_notification}
                        className={`flex items-start gap-3 px-5 py-3 transition ${
                          !n.is_read
                            ? "bg-indigo-50/50 hover:bg-indigo-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconConf.color}`}
                        >
                          {iconConf.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs leading-relaxed ${
                              !n.is_read ? "text-gray-900 font-medium" : "text-gray-600"
                            }`}
                          >
                            {n.content}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {timeAgo}
                          </span>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() => markNotifRead(n.id_notification)}
                            disabled={markingRead === n.id_notification}
                            className="mt-1 p-1 text-gray-400 hover:text-indigo-600 rounded transition flex-shrink-0"
                            title="Marquer comme lu"
                          >
                            {markingRead === n.id_notification ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {unreadCount > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={markAllRead}
                    className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1"
                  >
                    Tout marquer comme lu ({unreadCount})
                  </button>
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Messages récents
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Dernières conversations
                  </p>
                </div>
                <Link
                  href="/company/messages"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune conversation</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {conversations.slice(0, 5).map((conv) => {
                    const lastMsg = conv.messages[0];
                    const hasUnread =
                      lastMsg && !lastMsg.is_read && lastMsg.id_sender !== user?.userId;
                    return (
                      <Link
                        key={conv.id_conversation}
                        href="/company/messages"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {conv.student.user.prenom.charAt(0)}
                          {conv.student.user.nom.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-xs truncate ${
                                hasUnread
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {conv.student.user.prenom} {conv.student.user.nom}
                            </p>
                            <span className="text-[10px] text-gray-400">
                              · {conv.offer.title}
                            </span>
                          </div>
                          {lastMsg && (
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                hasUnread ? "text-gray-700 font-medium" : "text-gray-400"
                              }`}
                            >
                              {lastMsg.content}
                            </p>
                          )}
                        </div>
                        {hasUnread && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string, now: Date): string {
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
