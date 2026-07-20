"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Video,
  Building2,
  MapPin,
  Loader2,
  Plus,
  X,
  Users,
  CalendarCheck,
  CalendarClock,
  Star,
  Edit3,
  ExternalLink,
  AlertCircle,
  Save,
  Trash2,
} from "lucide-react";

interface Interview {
  id_interview: number;
  scheduled_at: string;
  location?: string;
  type: "ONLINE" | "ON_SITE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  completed_at?: string;
  rating?: number;
  strengths?: string;
  weaknesses?: string;
  feedback_notes?: string;
  final_decision?: string;
  created_at: string;
  application: {
    id_application: number;
    offer: { title: string; company: { company_name: string } };
    student: {
      id_student: number;
      photo_url?: string;
      university?: string;
      level?: string;
      user: { nom: string; prenom: string; email: string };
      skills: { skill: { id_skill: number; name: string } }[];
    };
  };
}

interface AcceptedApplication {
  id_application: number;
  student: { user: { nom: string; prenom: string; email: string } };
  offer: { title: string };
}

const statusConf: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING: { label: "Planifié", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  CONFIRMED: { label: "Confirmé", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { label: "Annulé", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

export default function CompanyInterviewsPage() {
  const { user } = useAuthStore();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyNotFound, setCompanyNotFound] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [acceptedApps, setAcceptedApps] = useState<AcceptedApplication[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    id_application: "",
    scheduled_at: "",
    type: "ONLINE" as "ONLINE" | "ON_SITE",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [editModal, setEditModal] = useState<{
    open: boolean;
    interview: Interview | null;
    form: { scheduled_at: string; type: "ONLINE" | "ON_SITE"; location: string };
  }>({
    open: false,
    interview: null,
    form: { scheduled_at: "", type: "ONLINE", location: "" },
  });

  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    interview: Interview | null;
    form: {
      rating: number;
      strengths: string;
      weaknesses: string;
      feedback_notes: string;
      final_decision: string;
    };
  }>({
    open: false,
    interview: null,
    form: { rating: 0, strengths: "", weaknesses: "", feedback_notes: "", final_decision: "" },
  });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    interviewId: number;
    action: "CONFIRMED" | "CANCELLED" | "DELETE";
    label: string;
  }>({ open: false, interviewId: 0, action: "CONFIRMED", label: "" });

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get(`/companies/user/${user.userId}`).then((r) => setCompanyId(r.data?.id_company ?? null)).catch(() => {
      setCompanyNotFound(true);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!companyId) return;
    api.get(`/interviews/company/${companyId}`).then((r) => setInterviews(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [companyId]);

  const openScheduleModal = async () => {
    if (!companyId) return;
    try {
      const offersRes = await api.get(`/offers/company/${companyId}`);
      const apps: AcceptedApplication[] = [];
      for (const offer of offersRes.data) {
        try {
          const r = await api.get(`/applications/offer/${offer.id_offer}`);
          const accepted = r.data.filter(
            (a: { status: string; id_application: number }) =>
              a.status === "ACCEPTEE" &&
              !interviews.some((i) => i.application.id_application === a.id_application),
          );
          apps.push(...accepted);
        } catch {}
      }
      setAcceptedApps(apps);
      setScheduleForm({ id_application: "", scheduled_at: "", type: "ONLINE", location: "" });
      setShowScheduleModal(true);
    } catch {}
  };

  const handleSchedule = async () => {
    if (!scheduleForm.id_application || !scheduleForm.scheduled_at) return;
    setSubmitting(true);
    try {
      const res = await api.post("/interviews", {
        id_application: Number(scheduleForm.id_application),
        scheduled_at: scheduleForm.scheduled_at,
        type: scheduleForm.type,
        location: scheduleForm.location || undefined,
      });
      setInterviews((prev) => [res.data, ...prev]);
      setShowScheduleModal(false);
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await api.put(`/interviews/${id}`, { status });
      setInterviews((prev) =>
        prev.map((i) => (i.id_interview === id ? { ...i, status: status as Interview["status"] } : i)),
      );
    } catch {} finally {
      setUpdating(null);
      setConfirmModal((p) => ({ ...p, open: false }));
    }
  };

  const handleComplete = async (id: number) => {
    setUpdating(id);
    try {
      const res = await api.patch(`/interviews/${id}/complete`);
      setInterviews((prev) =>
        prev.map((i) => (i.id_interview === id ? { ...i, status: "CONFIRMED", completed_at: res.data.completed_at } : i)),
      );
    } catch {} finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    setUpdating(id);
    try {
      await api.delete(`/interviews/${id}`);
      setInterviews((prev) => prev.filter((i) => i.id_interview !== id));
    } catch {} finally {
      setUpdating(null);
      setConfirmModal((p) => ({ ...p, open: false }));
    }
  };

  const handleEdit = async () => {
    if (!editModal.interview) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/interviews/${editModal.interview.id_interview}`, {
        scheduled_at: editModal.form.scheduled_at,
        type: editModal.form.type,
        location: editModal.form.location || undefined,
      });
      setInterviews((prev) =>
        prev.map((i) => (i.id_interview === res.data.id_interview ? { ...i, ...res.data } : i)),
      );
      setEditModal({ open: false, interview: null, form: { scheduled_at: "", type: "ONLINE", location: "" } });
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async () => {
    if (!feedbackModal.interview) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/interviews/${feedbackModal.interview.id_interview}/feedback`, feedbackModal.form);
      setInterviews((prev) =>
        prev.map((i) => (i.id_interview === res.data.id_interview ? { ...i, ...res.data } : i)),
      );
      setFeedbackModal({ open: false, interview: null, form: { rating: 0, strengths: "", weaknesses: "", feedback_notes: "", final_decision: "" } });
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const filtered = interviews.filter((i) => statusFilter === "ALL" || i.status === statusFilter);

  const stats = [
    { label: "Total", value: interviews.length, icon: <Calendar className="w-5 h-5" />, color: "bg-indigo-50 text-indigo-600" },
    { label: "Planifiés", value: interviews.filter((i) => i.status === "PENDING").length, icon: <CalendarClock className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
    { label: "Confirmés", value: interviews.filter((i) => i.status === "CONFIRMED").length, icon: <CalendarCheck className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
    { label: "Avis donnés", value: interviews.filter((i) => i.rating).length, icon: <Star className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const upcoming = filtered.filter((i) => new Date(i.scheduled_at) > new Date() && i.status !== "CANCELLED").sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = filtered.filter((i) => new Date(i.scheduled_at) <= new Date() || i.status === "CANCELLED").sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  if (companyNotFound) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Calendar className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Profil entreprise non trouvé
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Créez votre profil entreprise pour planifier des entretiens.
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
          <h1 className="text-2xl font-bold text-gray-900">Entretiens</h1>
          <p className="text-sm text-gray-500 mt-1">Planifiez et gérez les entretiens de recrutement.</p>
        </div>
        <button onClick={openScheduleModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm">
          <Plus className="w-4 h-4" />
          Planifier
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ key: "ALL", label: "Tous" }, { key: "PENDING", label: "Planifiés" }, { key: "CONFIRMED", label: "Confirmés" }, { key: "CANCELLED", label: "Annulés" }].map((t) => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${statusFilter === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-gray-300" /></div>
          <p className="text-gray-500 font-medium">Aucun entretien trouvé</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">À venir ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map((iv, idx) => {
                  const st = statusConf[iv.status];
                  const d = new Date(iv.scheduled_at);
                  const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <motion.div key={iv.id_interview} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all overflow-hidden">
                      <div className="flex">
                        <div className="hidden sm:flex w-20 flex-shrink-0 flex-col items-center justify-center bg-gray-50 border-r border-gray-100 py-4">
                          <span className="text-2xl font-bold text-gray-800">{d.getDate()}</span>
                          <span className="text-xs text-gray-400 uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
                        </div>
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {iv.application.student.user.prenom.charAt(0)}{iv.application.student.user.nom.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{iv.application.student.user.prenom} {iv.application.student.user.nom}</h3>
                                <p className="text-xs text-gray-400 truncate">{iv.application.offer.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${iv.type === "ONLINE" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"}`}>
                                    {iv.type === "ONLINE" ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                    {iv.type === "ONLINE" ? "En ligne" : "Sur site"}
                                  </span>
                                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(iv.scheduled_at)}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${daysUntil <= 2 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-indigo-50 text-indigo-600 border border-indigo-200"}`}>
                                    {daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? "Demain" : `Dans ${daysUntil}j`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap ml-[60px] sm:ml-0">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                              {iv.status === "PENDING" && (
                                <>
                                  <button onClick={() => handleComplete(iv.id_interview)} disabled={updating === iv.id_interview} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Marquer complété"><CheckCircle2 className="w-4 h-4" /></button>
                                  <button onClick={() => setEditModal({ open: true, interview: iv, form: { scheduled_at: iv.scheduled_at.slice(0, 16), type: iv.type, location: iv.location || "" } })} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Modifier"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => setConfirmModal({ open: true, interviewId: iv.id_interview, action: "CANCELLED", label: "Annuler cet entretien" })} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Annuler"><XCircle className="w-4 h-4" /></button>
                                </>
                              )}
                              {iv.status === "CONFIRMED" && !iv.rating && (
                                <button onClick={() => setFeedbackModal({ open: true, interview: iv, form: { rating: iv.rating || 0, strengths: iv.strengths || "", weaknesses: iv.weaknesses || "", feedback_notes: iv.feedback_notes || "", final_decision: iv.final_decision || "" } })} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Ajouter un avis"><Star className="w-4 h-4" /></button>
                              )}
                            </div>
                          </div>
                          {iv.location && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {iv.type === "ONLINE" ? <a href={iv.location} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1">Rejoindre <ExternalLink className="w-3 h-3" /></a> : iv.location}
                            </div>
                          )}
                          {iv.rating && (
                            <div className="mt-3 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= (iv.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                                <span className="text-xs text-gray-500 ml-1">{iv.rating}/5</span>
                              </div>
                              {iv.final_decision && <span className={`text-xs font-medium ${iv.final_decision === "ACCEPTED" ? "text-emerald-600" : iv.final_decision === "REJECTED" ? "text-red-500" : "text-gray-500"}`}>{iv.final_decision === "ACCEPTED" ? "Recommandé" : iv.final_decision === "REJECTED" ? "Non recommandé" : "En attente"}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Passés ({past.length})</h2>
              <div className="space-y-3">
                {past.map((iv, idx) => {
                  const st = statusConf[iv.status];
                  const d = new Date(iv.scheduled_at);
                  return (
                    <motion.div key={iv.id_interview} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all overflow-hidden opacity-80">
                      <div className="flex">
                        <div className="hidden sm:flex w-20 flex-shrink-0 flex-col items-center justify-center bg-gray-50 border-r border-gray-100 py-4">
                          <span className="text-2xl font-bold text-gray-500">{d.getDate()}</span>
                          <span className="text-xs text-gray-400 uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
                        </div>
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 font-bold text-sm">
                                {iv.application.student.user.prenom.charAt(0)}{iv.application.student.user.nom.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-700 truncate">{iv.application.student.user.prenom} {iv.application.student.user.nom}</h3>
                                <p className="text-xs text-gray-400 truncate">{iv.application.offer.title}</p>
                                <span className="text-xs text-gray-400">{formatDate(iv.scheduled_at)} · {formatTime(iv.scheduled_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 ml-[60px] sm:ml-0">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                              {iv.status === "CONFIRMED" && !iv.rating && (
                                <button onClick={() => setFeedbackModal({ open: true, interview: iv, form: { rating: 0, strengths: "", weaknesses: "", feedback_notes: "", final_decision: "" } })} className="inline-flex items-center gap-1 px-2 py-1.5 text-purple-600 text-xs font-medium rounded-lg hover:bg-purple-50 border border-purple-200 transition">
                                  <Star className="w-3 h-3" /> Avis
                                </button>
                              )}
                              {iv.rating && (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= (iv.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                                </div>
                              )}
                              {iv.status === "PENDING" && (
                                <button onClick={() => setConfirmModal({ open: true, interviewId: iv.id_interview, action: "DELETE", label: "Supprimer cet entretien" })} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal((p) => ({ ...p, open: false }))}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmModal.action === "CONFIRMED" ? "bg-emerald-50" : confirmModal.action === "DELETE" ? "bg-red-50" : "bg-red-50"}`}>
                  {confirmModal.action === "CONFIRMED" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
                <h3 className="font-semibold text-gray-900">{confirmModal.label}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                {confirmModal.action === "CONFIRMED" ? "Confirmer cet entretien ? Le candidat sera notifié." : confirmModal.action === "DELETE" ? "Voulez-vous vraiment supprimer cet entretien ?" : "Voulez-vous annuler cet entretien ? Le candidat sera notifié."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal((p) => ({ ...p, open: false }))} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Non</button>
                <button onClick={() => {
                  if (confirmModal.action === "DELETE") handleDelete(confirmModal.interviewId);
                  else handleStatusChange(confirmModal.interviewId, confirmModal.action);
                }} disabled={updating !== null} className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition disabled:opacity-50 ${confirmModal.action === "CONFIRMED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"}`}>
                  {updating !== null ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal.open && editModal.interview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModal((p) => ({ ...p, open: false }))}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Modifier l&apos;entretien</h2>
                <button onClick={() => setEditModal((p) => ({ ...p, open: false }))} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Date et heure</label>
                  <input type="datetime-local" value={editModal.form.scheduled_at} onChange={(e) => setEditModal((p) => ({ ...p, form: { ...p.form, scheduled_at: e.target.value } }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Type</label>
                  <div className="flex gap-3">
                    {([ { key: "ONLINE" as const, label: "En ligne", icon: Video }, { key: "ON_SITE" as const, label: "Sur site", icon: Building2 } ]).map((t) => (
                      <button key={t.key} onClick={() => setEditModal((p) => ({ ...p, form: { ...p.form, type: t.key } }))} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition font-medium ${editModal.form.type === t.key ? "bg-indigo-50 border-indigo-300 text-indigo-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                        <t.icon className="w-4 h-4" />{t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Lieu / Lien <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                  <input type="text" value={editModal.form.location} onChange={(e) => setEditModal((p) => ({ ...p, form: { ...p.form, location: e.target.value } }))} placeholder={editModal.form.type === "ONLINE" ? "Lien de visioconférence" : "Adresse"} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition" />
                </div>
                <button onClick={handleEdit} disabled={submitting || !editModal.form.scheduled_at} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal.open && feedbackModal.interview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFeedbackModal((p) => ({ ...p, open: false }))}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Avis d&apos;entretien</h2>
                  <p className="text-xs text-gray-400">{feedbackModal.interview.application.student.user.prenom} {feedbackModal.interview.application.student.user.nom}</p>
                </div>
                <button onClick={() => setFeedbackModal((p) => ({ ...p, open: false }))} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Note</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setFeedbackModal((p) => ({ ...p, form: { ...p.form, rating: s } }))} className="p-0.5 transition hover:scale-110">
                        <Star className={`w-7 h-7 ${s <= feedbackModal.form.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Points forts</label>
                  <textarea value={feedbackModal.form.strengths} onChange={(e) => setFeedbackModal((p) => ({ ...p, form: { ...p.form, strengths: e.target.value } }))} placeholder="Compétences techniques, communication..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Points à améliorer</label>
                  <textarea value={feedbackModal.form.weaknesses} onChange={(e) => setFeedbackModal((p) => ({ ...p, form: { ...p.form, weaknesses: e.target.value } }))} placeholder="Axes d'amélioration..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Commentaires</label>
                  <textarea value={feedbackModal.form.feedback_notes} onChange={(e) => setFeedbackModal((p) => ({ ...p, form: { ...p.form, feedback_notes: e.target.value } }))} placeholder="Notes complémentaires..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Décision finale</label>
                  <div className="flex gap-2">
                    {[ { key: "ACCEPTED", label: "Recommandé", color: "bg-emerald-50 border-emerald-200 text-emerald-700" }, { key: "PENDING", label: "En attente", color: "bg-gray-50 border-gray-200 text-gray-600" }, { key: "REJECTED", label: "Non recommandé", color: "bg-red-50 border-red-200 text-red-600" } ].map((d) => (
                      <button key={d.key} onClick={() => setFeedbackModal((p) => ({ ...p, form: { ...p.form, final_decision: d.key } }))} className={`flex-1 px-3 py-2 text-xs font-medium rounded-xl border transition ${feedbackModal.form.final_decision === d.key ? d.color : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleFeedback} disabled={submitting || !feedbackModal.form.rating} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  {submitting ? "Envoi..." : "Envoyer l'avis"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Planifier un entretien</h2>
                <button onClick={() => setShowScheduleModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
              </div>
              {acceptedApps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Users className="w-7 h-7 text-gray-300" /></div>
                  <p className="text-sm text-gray-500">Aucune candidature acceptée disponible.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Candidat</label>
                    <select value={scheduleForm.id_application} onChange={(e) => setScheduleForm({ ...scheduleForm, id_application: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition bg-white">
                      <option value="">Sélectionner un candidat</option>
                      {acceptedApps.map((app) => (
                        <option key={app.id_application} value={app.id_application}>{app.student.user.prenom} {app.student.user.nom} — {app.offer.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Date et heure</label>
                    <input type="datetime-local" value={scheduleForm.scheduled_at} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Type</label>
                    <div className="flex gap-3">
                      {([ { key: "ONLINE" as const, label: "En ligne", icon: Video }, { key: "ON_SITE" as const, label: "Sur site", icon: Building2 } ]).map((t) => (
                        <button key={t.key} onClick={() => setScheduleForm({ ...scheduleForm, type: t.key })} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition font-medium ${scheduleForm.type === t.key ? "bg-indigo-50 border-indigo-300 text-indigo-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                          <t.icon className="w-4 h-4" />{t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Lieu / Lien <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                    <input type="text" value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder={scheduleForm.type === "ONLINE" ? "Lien de visioconférence" : "Adresse"} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition" />
                  </div>
                  <button onClick={handleSchedule} disabled={submitting || !scheduleForm.id_application || !scheduleForm.scheduled_at} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {submitting ? "Planification..." : "Planifier"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
