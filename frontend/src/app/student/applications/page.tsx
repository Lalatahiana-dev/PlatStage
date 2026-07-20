"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3,
  Star,
  MessageCircle,
  ArrowRight,
  Eye,
  StickyNote,
  GraduationCap,
  Building2,
  FileText,
} from "lucide-react";

interface InterviewFeedback {
  id_interview: number;
  status: string;
  rating?: number;
  strengths?: string;
  weaknesses?: string;
  feedback_notes?: string;
  final_decision?: string;
}

interface Application {
  id_application: number;
  motivation?: string;
  notes?: string;
  status: string;
  applied_at: string;
  offer: {
    id_offer: number;
    title: string;
    location?: string;
    company: {
      id_company: number;
      company_name: string;
      logo_url?: string;
    };
  };
  interview?: InterviewFeedback | null;
}

const PIPELINE_STEPS = [
  { key: "EN_ATTENTE", label: "Reçue" },
  { key: "REVIEWING", label: "En review" },
  { key: "SHORTLISTED", label: "Présélection" },
  { key: "INTERVIEW_SCHEDULED", label: "Entretien" },
  { key: "ACCEPTEE", label: "Acceptée" },
];

const statusConf: Record<string, { label: string; color: string; bg: string; border: string; description: string }> = {
  EN_ATTENTE: { label: "Reçue", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", description: "Votre candidature a été reçue et est en attente de review." },
  REVIEWING: { label: "En review", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", description: "Votre candidature est en cours d'examination par l'entreprise." },
  SHORTLISTED: { label: "Présélectionnée", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", description: "Félicitations ! Vous avez été présélectionné(e)." },
  INTERVIEW_SCHEDULED: { label: "Entretien planifié", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", description: "Un entretien a été planifié pour votre candidature." },
  ACCEPTEE: { label: "Acceptée", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", description: "Félicitations ! Votre candidature a été acceptée." },
  REFUSEE: { label: "Refusée", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", description: "Votre candidature n'a pas été retenue." },
};

export default function StudentApplicationsPage() {
  const { user } = useAuthStore();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get(`/students/user/${user.userId}`).then((r) => setStudentId(r.data.id_student)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    api.get(`/applications/student/${studentId}`).then((r) => setApplications(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  const stats = [
    { label: "Total", value: applications.length, icon: <BarChart3 className="w-5 h-5" />, color: "bg-indigo-50 text-indigo-600" },
    { label: "En cours", value: applications.filter((a) => ["EN_ATTENTE", "REVIEWING", "SHORTLISTED", "INTERVIEW_SCHEDULED"].includes(a.status)).length, icon: <Clock className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
    { label: "Acceptées", value: applications.filter((a) => a.status === "ACCEPTEE").length, icon: <CheckCircle2 className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
    { label: "Refusées", value: applications.filter((a) => a.status === "REFUSEE").length, icon: <XCircle className="w-5 h-5" />, color: "bg-red-50 text-red-500" },
  ];

  const getPipelineIdx = (s: string) => {
    if (s === "REFUSEE") return -1;
    return PIPELINE_STEPS.findIndex((p) => p.key === s);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes candidatures</h1>
        <p className="text-sm text-gray-500 mt-1">Suivez l&apos;évolution de toutes vos candidatures en temps réel.</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase className="w-8 h-8 text-gray-300" /></div>
          <p className="text-gray-500 font-medium mb-1">Aucune candidature</p>
          <p className="text-sm text-gray-400 mb-4">Commencez à postuler pour des offres de stage.</p>
          <Link href="/student/offers" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm">
            <Briefcase className="w-4 h-4" />Voir les offres
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app, idx) => {
            const conf = statusConf[app.status] || statusConf.EN_ATTENTE;
            const isExpanded = expandedId === app.id_application;
            const pipelineIdx = getPipelineIdx(app.status);

            return (
              <motion.div key={app.id_application} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {app.offer.company.company_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{app.offer.title}</h3>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1"><Building2 className="w-3 h-3" />{app.offer.company.company_name}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {app.offer.location && (
                            <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{app.offer.location}</span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(app.applied_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-[64px] sm:ml-0">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${conf.bg} ${conf.color} ${conf.border}`}>{conf.label}</span>
                      <button onClick={() => setExpandedId(isExpanded ? null : app.id_application)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {pipelineIdx >= 0 && (
                    <div className="mt-3 ml-16 hidden sm:flex items-center">
                      {PIPELINE_STEPS.map((step, i) => (
                        <div key={step.key} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-2 transition ${
                              i <= pipelineIdx
                                ? app.status === "ACCEPTEE" ? "bg-emerald-500 border-emerald-500 text-white" : i === pipelineIdx ? "bg-indigo-500 border-indigo-500 text-white" : "bg-indigo-100 border-indigo-300 text-indigo-600"
                                : "bg-white border-gray-200 text-gray-400"
                            }`}>
                              {i < pipelineIdx || (i === pipelineIdx && app.status === "ACCEPTEE") ? "✓" : i + 1}
                            </div>
                            <span className={`text-[9px] mt-1 whitespace-nowrap ${i <= pipelineIdx ? "text-gray-700 font-medium" : "text-gray-400"}`}>{step.label}</span>
                          </div>
                          {i < PIPELINE_STEPS.length - 1 && (
                            <div className={`w-8 h-0.5 mx-1 mt-[-14px] transition ${i < pipelineIdx ? "bg-indigo-400" : "bg-gray-200"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Statut</p>
                        <p className="text-sm text-gray-600">{conf.description}</p>
                      </div>

                      {app.motivation && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Votre lettre de motivation</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{app.motivation}</p>
                        </div>
                      )}

                      {app.interview && app.interview.rating && (
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                          <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> Avis de l&apos;entretien</p>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= (app.interview?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                            <span className="text-sm text-gray-500 ml-1">{app.interview.rating}/5</span>
                          </div>
                          {app.interview.strengths && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-emerald-600 mb-0.5">Points forts</p>
                              <p className="text-sm text-gray-600">{app.interview.strengths}</p>
                            </div>
                          )}
                          {app.interview.weaknesses && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-amber-600 mb-0.5">Points à améliorer</p>
                              <p className="text-sm text-gray-600">{app.interview.weaknesses}</p>
                            </div>
                          )}
                          {app.interview.feedback_notes && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500 mb-0.5">Commentaires</p>
                              <p className="text-sm text-gray-600">{app.interview.feedback_notes}</p>
                            </div>
                          )}
                          {app.interview.final_decision && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${app.interview.final_decision === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : app.interview.final_decision === "REJECTED" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                              {app.interview.final_decision === "ACCEPTED" ? "Recommandé" : app.interview.final_decision === "REJECTED" ? "Non recommandé" : "En attente de décision"}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {app.status === "ACCEPTEE" && (
                          <Link href="/student/messages" className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 border border-indigo-200 transition">
                            <MessageCircle className="w-3.5 h-3.5" />Contacter l&apos;entreprise
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
    </div>
  );
}
