"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Video,
  Building2,
  MapPin,
  Loader2,
  CalendarCheck,
  CalendarClock,
  ExternalLink,
  Star,
  MessageSquare,
  Briefcase,
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
    offer: {
      title: string;
      company: { company_name: string; logo_url?: string };
    };
  };
}

const statusConf: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Planifié", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  CONFIRMED: { label: "Confirmé", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { label: "Annulé", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

export default function StudentInterviewsPage() {
  const { user } = useAuthStore();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get(`/students/user/${user.userId}`).then((r) => setStudentId(r.data.id_student)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    api.get(`/interviews/student/${studentId}`).then((r) => setInterviews(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  const stats = [
    { label: "Total", value: interviews.length, icon: <Calendar className="w-5 h-5" />, color: "bg-indigo-50 text-indigo-600" },
    { label: "À venir", value: interviews.filter((i) => new Date(i.scheduled_at) > new Date() && i.status !== "CANCELLED").length, icon: <CalendarClock className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
    { label: "Avis reçus", value: interviews.filter((i) => i.rating).length, icon: <Star className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const upcoming = interviews.filter((i) => new Date(i.scheduled_at) > new Date() && i.status !== "CANCELLED").sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = interviews.filter((i) => new Date(i.scheduled_at) <= new Date() || i.status === "CANCELLED").sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const renderInterviewCard = (iv: Interview, idx: number) => {
    const st = statusConf[iv.status];
    const d = new Date(iv.scheduled_at);
    const daysUntil = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isUpcoming = d > new Date() && iv.status !== "CANCELLED";
    const hasFeedback = iv.rating && iv.rating > 0;

    return (
      <motion.div key={iv.id_interview} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="flex">
          <div className="hidden sm:flex w-20 flex-shrink-0 flex-col items-center justify-center bg-gray-50 border-r border-gray-100 py-4">
            <span className="text-2xl font-bold text-gray-800">{d.getDate()}</span>
            <span className="text-xs text-gray-400 uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
            <span className="text-[10px] text-gray-400 mt-1">{d.toLocaleDateString("fr-FR", { weekday: "short" })}</span>
          </div>

          <div className="flex-1 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  {iv.type === "ONLINE" ? <Video className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{iv.application.offer.title}</h3>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1"><Briefcase className="w-3 h-3" />{iv.application.offer.company.company_name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${iv.type === "ONLINE" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"}`}>
                      {iv.type === "ONLINE" ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      {iv.type === "ONLINE" ? "En ligne" : "Sur site"}
                    </span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{formatDate(iv.scheduled_at)}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(iv.scheduled_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-[60px] sm:ml-0">
                {isUpcoming && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${daysUntil <= 2 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-indigo-50 text-indigo-600 border border-indigo-200"}`}>
                    {daysUntil <= 0 ? "Aujourd'hui" : daysUntil === 1 ? "Demain" : `Dans ${daysUntil}j`}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
              </div>
            </div>

            {iv.location && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {iv.type === "ONLINE" ? <a href={iv.location} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1">Rejoindre la réunion <ExternalLink className="w-3 h-3" /></a> : iv.location}
              </div>
            )}

            {hasFeedback && (
              <div className="mt-3">
                <button onClick={() => setExpandedFeedback(expandedFeedback === iv.id_interview ? null : iv.id_interview)} className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-medium hover:text-purple-700 transition">
                  <Star className="w-3.5 h-3.5" />
                  Voir l&apos;avis de l&apos;entretien
                  {expandedFeedback === iv.id_interview ? <XCircle className="w-3 h-3" /> : <span />}
                </button>

                {expandedFeedback === iv.id_interview && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 bg-purple-50 rounded-xl p-4 border border-purple-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-5 h-5 ${s <= (iv.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{iv.rating}/5</span>
                    </div>

                    {iv.strengths && (
                      <div>
                        <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider mb-1">Points forts</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{iv.strengths}</p>
                      </div>
                    )}

                    {iv.weaknesses && (
                      <div>
                        <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-1">Points à améliorer</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{iv.weaknesses}</p>
                      </div>
                    )}

                    {iv.feedback_notes && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Commentaires</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{iv.feedback_notes}</p>
                      </div>
                    )}

                    {iv.final_decision && (
                      <div className="pt-2 border-t border-purple-200">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg ${iv.final_decision === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : iv.final_decision === "REJECTED" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                          {iv.final_decision === "ACCEPTED" ? "✓ Recommandé pour le poste" : iv.final_decision === "REJECTED" ? "✗ Non recommandé" : "Décision en attente"}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes entretiens</h1>
        <p className="text-sm text-gray-500 mt-1">Consultez vos entretiens et les avis des recruteurs.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
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

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-gray-300" /></div>
          <p className="text-gray-500 font-medium mb-1">Aucun entretien planifié</p>
          <p className="text-sm text-gray-400">Vos entretiens apparaîtront ici une fois planifiés.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">À venir</h2>
              <div className="space-y-3">{upcoming.map((iv, idx) => renderInterviewCard(iv, idx))}</div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Passés</h2>
              <div className="space-y-3">{past.map((iv, idx) => renderInterviewCard(iv, idx + upcoming.length))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
