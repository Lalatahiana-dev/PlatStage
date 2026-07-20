"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import api from "@/lib/axios";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminAvatar from "@/components/AdminAvatar";
import {
  Briefcase,
  Globe,
  CalendarX2,
  Users,
  UserPlus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Ban,
  Play,
  RotateCcw,
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
  MapPin,
  DollarSign,
  ExternalLink,
  Settings,
  Building2,
  Lock,
  EyeOff,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface OfferCompany {
  id_company: number;
  company_name: string;
  logo_url: string | null;
  sector: string | null;
  website?: string;
  address?: string;
}

interface OfferCategory {
  category: { id_category: number; name: string };
}

interface AdminOffer {
  id_offer: number;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  salary: number | null;
  deadline: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  created_at: string;
  updated_at: string;
  company: OfferCompany;
  categories: OfferCategory[];
  _count?: { applications: number };
}

type SortField = "title" | "created_at" | "deadline" | "applications" | "company";
type SortDir = "asc" | "desc";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  PUBLISHED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  CLOSED: { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-400" },
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CLOSED: "Fermée",
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

function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

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
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
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
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
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

function StatCard({ label, value, icon: Icon, color, description }: { label: string; value: number; icon: React.ElementType; color: string; description?: string }) {
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

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
  return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />;
}

/* ── Actions Dropdown ────────────────────────────────────────────────────── */

function ActionsDropdown({
  offer,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  offer: AdminOffer;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
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
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-40 animate-[scaleIn_0.1s_ease-out]">
          <button onClick={() => { onView(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            <Eye className="w-4 h-4 text-gray-400" /> Voir les détails
          </button>
          <button onClick={() => { onEdit(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            <Pencil className="w-4 h-4 text-gray-400" /> Modifier
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { onToggleStatus(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            {offer.status === "DRAFT" && <><Play className="w-4 h-4 text-emerald-500" /> Publier</>}
            {offer.status === "PUBLISHED" && <><Ban className="w-4 h-4 text-amber-500" /> Fermer</>}
            {offer.status === "CLOSED" && <><RotateCcw className="w-4 h-4 text-blue-500" /> Rouvrir</>}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { onDelete(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

/* ── View Details Modal ──────────────────────────────────────────────────── */

function ViewModal({ offer, open, onClose }: { offer: AdminOffer | null; open: boolean; onClose: () => void }) {
  if (!open || !offer) return null;
  const sc = statusColors[offer.status] || statusColors.DRAFT;
  const expired = isExpired(offer.deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-[scaleIn_0.15s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <AdminAvatar
              src={offer.company.logo_url}
              name={offer.company.company_name}
              size={56}
              className="rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {statusLabels[offer.status]}
                </span>
                {expired && offer.status !== "CLOSED" && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium bg-amber-50 text-amber-600">
                    <CalendarX2 className="w-3 h-3" /> Expirée
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-purple-50 text-purple-600">{offer.company.company_name}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 leading-relaxed mb-6 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{offer.description}</div>

          {offer.requirements && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Prérequis</h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{offer.requirements}</p>
            </div>
          )}

          {offer.categories.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Catégories</h4>
              <div className="flex flex-wrap gap-2">
                {offer.categories.map((c) => (
                  <span key={c.category.id_category} className="text-xs px-2.5 py-1 rounded-lg font-medium bg-blue-50 text-blue-600">{c.category.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {offer.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{offer.location}</span>
              </div>
            )}
            {offer.salary != null && (
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{offer.salary.toLocaleString("fr-FR")} Ar</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{offer._count?.applications || 0} candidature(s)</span>
            </div>
            {offer.deadline && (
              <div className="flex items-center gap-3 text-sm">
                <CalendarX2 className="w-4 h-4 text-gray-400" />
                <span className={expired ? "text-red-500" : "text-gray-600"}>
                  Échéance : {new Date(offer.deadline).toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800">Informations entreprise</h4>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{offer.company.company_name}</span>
              {offer.company.sector && <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">{offer.company.sector}</span>}
            </div>
            {offer.company.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={offer.company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  {offer.company.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {offer.company.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{offer.company.address}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span>Publiée {timeAgo(offer.created_at)}</span>
            <span>Mise à jour {timeAgo(offer.updated_at)}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Modal ──────────────────────────────────────────────────────────── */

function EditModal({
  offer,
  open,
  onClose,
  onSave,
}: {
  offer: AdminOffer | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: Partial<AdminOffer>) => void;
}) {
  const [title, setTitle] = useState(offer?.title ?? "");
  const [description, setDescription] = useState(offer?.description ?? "");
  const [requirements, setRequirements] = useState(offer?.requirements ?? "");
  const [location, setLocation] = useState(offer?.location ?? "");
  const [salary, setSalary] = useState(offer?.salary?.toString() ?? "");
  const [deadline, setDeadline] = useState(offer?.deadline ? offer.deadline.split("T")[0] : "");
  const [status, setStatus] = useState<string>(offer?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);

  if (!open || !offer) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        requirements: requirements || undefined,
        location: location || undefined,
        salary: salary ? parseFloat(salary) : undefined,
        deadline: deadline || undefined,
        status,
      };
      await api.put(`/offers/${offer.id_offer}`, payload);
      onSave(offer.id_offer, { title, description, requirements: requirements || null, location: location || null, salary: salary ? parseFloat(salary) : null, deadline: deadline || null, status: status as AdminOffer["status"] });
      showToast("success", "Offre mise à jour");
      onClose();
    } catch {
      showToast("error", "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-[scaleIn_0.15s_ease-out] max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier l&apos;offre</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Titre</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prérequis</label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Localisation</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Salaire (Ar)</label>
              <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date d&apos;échéance</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition">
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publiée</option>
                <option value="CLOSED">Fermée</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Annuler</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [viewOffer, setViewOffer] = useState<AdminOffer | null>(null);
  const [editOffer, setEditOffer] = useState<AdminOffer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOffer | null>(null);
  const [bulkAction, setBulkAction] = useState<"activate" | "deactivate" | "close" | "delete" | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get("/offers/admin/all");
      setOffers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await api.get("/offers/admin/all", { signal: controller.signal });
        if (!controller.signal.aborted) setOffers(Array.isArray(res.data) ? res.data : res.data.data || []);
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
    const total = offers.length;
    const active = offers.filter((o) => o.status === "PUBLISHED" && !isExpired(o.deadline)).length;
    const closed = offers.filter((o) => o.status === "CLOSED").length;
    const expired = offers.filter((o) => o.status === "PUBLISHED" && isExpired(o.deadline)).length;
    const totalApplications = offers.reduce((s, o) => s + (o._count?.applications || 0), 0);
    const newThisMonth = offers.filter((o) => isThisMonth(o.created_at)).length;
    return { total, active, closed, expired, totalApplications, newThisMonth };
  }, [offers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => o.categories.forEach((c) => set.add(c.category.name)));
    return Array.from(set).sort();
  }, [offers]);

  const companies = useMemo(() => {
    const map = new Map<number, string>();
    offers.forEach((o) => map.set(o.company.id_company, o.company.company_name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [offers]);

  /* ── Filter + Sort + Paginate ──────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = [...offers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.company.company_name.toLowerCase().includes(q) ||
          o.location?.toLowerCase().includes(q) ||
          o.categories.some((c) => c.category.name.toLowerCase().includes(q)),
      );
    }

    if (statusFilter !== "ALL") {
      if (statusFilter === "EXPIRED") {
        result = result.filter((o) => o.status === "PUBLISHED" && isExpired(o.deadline));
      } else {
        result = result.filter((o) => o.status === statusFilter);
      }
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((o) => o.categories.some((c) => c.category.name === categoryFilter));
    }

    if (companyFilter !== "ALL") {
      result = result.filter((o) => o.company.id_company === Number(companyFilter));
    }

    if (typeFilter !== "ALL") {
      if (typeFilter === "PAID") {
        result = result.filter((o) => o.salary != null && o.salary > 0);
      } else if (typeFilter === "UNPAID") {
        result = result.filter((o) => o.salary == null || o.salary === 0);
      }
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title, "fr");
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "deadline":
          cmp = (a.deadline ? new Date(a.deadline).getTime() : 0) - (b.deadline ? new Date(b.deadline).getTime() : 0);
          break;
        case "applications":
          cmp = (a._count?.applications || 0) - (b._count?.applications || 0);
          break;
        case "company":
          cmp = a.company.company_name.localeCompare(b.company.company_name, "fr");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [offers, search, statusFilter, categoryFilter, companyFilter, typeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setSearchValue = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const setStatusFilterValue = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);
  const setCategoryFilterValue = useCallback((v: string) => { setCategoryFilter(v); setPage(1); }, []);
  const setCompanyFilterValue = useCallback((v: string) => { setCompanyFilter(v); setPage(1); }, []);
  const setTypeFilterValue = useCallback((v: string) => { setTypeFilter(v); setPage(1); }, []);
  const setPageSizeValue = useCallback((v: number) => { setPageSize(v); setPage(1); }, []);

  /* ── Selection ─────────────────────────────────────────────────────────── */

  const allOnPageSelected = paginated.length > 0 && paginated.every((o) => selected.has(o.id_offer));
  const someOnPageSelected = paginated.some((o) => selected.has(o.id_offer));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((o) => n.delete(o.id_offer)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((o) => n.add(o.id_offer)); return n; });
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const handleStatusChange = async (offer: AdminOffer, newStatus: string) => {
    try {
      await api.patch(`/offers/admin/${offer.id_offer}/status`, { status: newStatus });
      setOffers((prev) => prev.map((o) => o.id_offer === offer.id_offer ? { ...o, status: newStatus as AdminOffer["status"] } : o));
      showToast("success", `Offre ${newStatus === "PUBLISHED" ? "publiée" : newStatus === "CLOSED" ? "fermée" : "convertie en brouillon"}`);
    } catch {
      showToast("error", "Erreur lors du changement de statut");
    }
  };

  const handleDelete = async (offer: AdminOffer) => {
    try {
      await api.delete(`/offers/${offer.id_offer}`);
      setOffers((prev) => prev.filter((o) => o.id_offer !== offer.id_offer));
      setSelected((prev) => { const n = new Set(prev); n.delete(offer.id_offer); return n; });
      showToast("success", "Offre supprimée");
    } catch {
      showToast("error", "Erreur lors de la suppression");
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selected.size === 0) {
      showToast("error", "Aucune offre sélectionnée");
      setBulkAction(null);
      return;
    }
    const ids = Array.from(selected);

    try {
      if (bulkAction === "delete") {
        await api.post("/offers/admin/bulk/delete", { offerIds: ids });
        setOffers((prev) => prev.filter((o) => !selected.has(o.id_offer)));
        showToast("success", `${ids.length} offre(s) supprimée(s)`);
      } else {
        const statusMap: Record<string, string> = { activate: "PUBLISHED", deactivate: "DRAFT", close: "CLOSED" };
        const newStatus = statusMap[bulkAction];
        await api.post("/offers/admin/bulk/status", { offerIds: ids, status: newStatus });
        setOffers((prev) => prev.map((o) => selected.has(o.id_offer) ? { ...o, status: newStatus as AdminOffer["status"] } : o));
        const labels: Record<string, string> = { activate: "publiée(s)", deactivate: "convertie(s) en brouillon", close: "fermée(s)" };
        showToast("success", `${ids.length} offre(s) ${labels[bulkAction]}`);
      }
      setSelected(new Set());
    } catch {
      showToast("error", "Erreur lors de l'action groupée");
    }
    setBulkAction(null);
  };

  const handleEditSave = (id: number, data: Partial<AdminOffer>) => {
    setOffers((prev) => prev.map((o) => o.id_offer === id ? { ...o, ...data } : o));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const headers = ["ID", "Titre", "Entreprise", "Catégories", "Localisation", "Salaire", "Statut", "Candidatures", "Date limite", "Publiée le"];
    const rows = filtered.map((o) => [
      o.id_offer, o.title, o.company.company_name,
      o.categories.map((c) => c.category.name).join("; "),
      o.location || "", o.salary?.toString() || "", o.status,
      o._count?.applications || 0,
      o.deadline ? new Date(o.deadline).toLocaleDateString("fr-FR") : "",
      new Date(o.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "offres.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export CSV téléchargé");
  };

  const activeFilters = [statusFilter !== "ALL", categoryFilter !== "ALL", companyFilter !== "ALL", typeFilter !== "ALL"].filter(Boolean).length;

  const viewOfferWithCount = useMemo(() => {
    if (!viewOffer) return null;
    return offers.find((o) => o.id_offer === viewOffer.id_offer) || viewOffer;
  }, [viewOffer, offers]);

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
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mb-4">Impossible de charger les offres.</p>
        <button onClick={() => { setLoading(true); setError(false); fetchOffers(); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Offres de stage</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les offres de stage publiées par les entreprises.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition self-start">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} icon={Briefcase} color="indigo" description="Toutes les offres" />
        <StatCard label="Actives" value={stats.active} icon={CheckCircle2} color="emerald" description="Publiées et valides" />
        <StatCard label="Fermées" value={stats.closed} icon={Lock} color="rose" description="Clôturées" />
        <StatCard label="Expirées" value={stats.expired} icon={CalendarX2} color="amber" description="Deadline dépassée" />
        <StatCard label="Candidatures" value={stats.totalApplications} icon={Users} color="blue" description="Total reçues" />
        <StatCard label="Nouvelles / mois" value={stats.newThisMonth} icon={UserPlus} color="purple" description="Ce mois-ci" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Rechercher par titre, entreprise, catégorie, lieu..." value={search} onChange={(e) => setSearchValue(e.target.value)} className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0" />
              {search && <button onClick={() => setSearchValue("")} className="text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition ${showFilters || activeFilters > 0 ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                <Filter className="w-4 h-4" /> Filtres
                {activeFilters > 0 && <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] flex items-center justify-center">{activeFilters}</span>}
              </button>
              <div className="relative">
                <select value={pageSize} onChange={(e) => setPageSizeValue(Number(e.target.value))} className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition">
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Statut:</span>
                <select value={statusFilter} onChange={(e) => setStatusFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Tous</option>
                  <option value="PUBLISHED">Publiée</option>
                  <option value="DRAFT">Brouillon</option>
                  <option value="CLOSED">Fermée</option>
                  <option value="EXPIRED">Expirée</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Catégorie:</span>
                <select value={categoryFilter} onChange={(e) => setCategoryFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Toutes</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Entreprise:</span>
                <select value={companyFilter} onChange={(e) => setCompanyFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Toutes</option>
                  {companies.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Type:</span>
                <select value={typeFilter} onChange={(e) => setTypeFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Tous</option>
                  <option value="PAID">Rémunéré</option>
                  <option value="UNPAID">Non rémunéré</option>
                </select>
              </div>
              {activeFilters > 0 && (
                <button onClick={() => { setStatusFilterValue("ALL"); setCategoryFilterValue("ALL"); setCompanyFilterValue("ALL"); setTypeFilterValue("ALL"); }} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition">
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
            <span className="text-sm font-medium text-indigo-700">{selected.size} sélectionnée(s)</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button onClick={() => setBulkAction("activate")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition">
                <Play className="w-3.5 h-3.5" /> Publier
              </button>
              <button onClick={() => setBulkAction("deactivate")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                <EyeOff className="w-3.5 h-3.5" /> Brouillon
              </button>
              <button onClick={() => setBulkAction("close")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <Lock className="w-3.5 h-3.5" /> Fermer
              </button>
              <button onClick={() => setBulkAction("delete")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-1 transition">
                Désélectionner
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">
              {search || activeFilters > 0 ? "Aucune offre trouvée" : "Aucune offre"}
            </p>
            <p className="text-xs text-gray-400">
              {search || activeFilters > 0 ? "Essayez de modifier vos critères de recherche" : "Les offres apparaîtront ici une fois publiées"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-indigo-600 transition">
                        {allOnPageSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : someOnPageSelected ? <MinusSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort("title")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Offre <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button onClick={() => handleSort("company")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Entreprise <SortIcon field="company" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-gray-500">Catégorie</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs font-medium text-gray-500">Lieu</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <button onClick={() => handleSort("applications")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Candidatures <SortIcon field="applications" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-gray-500">Statut</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button onClick={() => handleSort("created_at")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Publiée <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden xl:table-cell">
                      <button onClick={() => handleSort("deadline")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Échéance <SortIcon field="deadline" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="w-10 px-4 py-3"><Settings className="w-4 h-4 text-gray-400" /></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((offer) => {
                    const sc = statusColors[offer.status] || statusColors.DRAFT;
                    const isSelected = selected.has(offer.id_offer);
                    const expired = isExpired(offer.deadline);
                    return (
                      <tr key={offer.id_offer} className={`border-b border-gray-50 transition ${isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50"}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(offer.id_offer)} className="text-gray-400 hover:text-indigo-600 transition">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AdminAvatar
                              src={offer.company.logo_url}
                              name={offer.company.company_name}
                              size={40}
                              className="rounded-xl"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{offer.title}</div>
                              <div className="text-xs text-gray-400 md:hidden truncate">{offer.company.company_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-600 truncate block max-w-[160px]">{offer.company.company_name}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {offer.categories.length > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-blue-50 text-blue-600">{offer.categories[0].category.name}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 hidden xl:table-cell truncate max-w-[140px]">{offer.location || "—"}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm font-medium text-gray-700">{offer._count?.applications || 0}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {statusLabels[offer.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                          {new Date(offer.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {offer.deadline ? (
                            <span className={`text-sm ${expired ? "text-red-500 font-medium" : "text-gray-400"}`}>
                              {new Date(offer.deadline).toLocaleDateString("fr-FR")}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ActionsDropdown
                            offer={offer}
                            onView={() => setViewOffer(offer)}
                            onEdit={() => setEditOffer(offer)}
                            onToggleStatus={() => handleStatusChange(offer, offer.status === "DRAFT" ? "PUBLISHED" : offer.status === "PUBLISHED" ? "CLOSED" : "PUBLISHED")}
                            onDelete={() => setDeleteTarget(offer)}
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
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-medium transition ${page === pageNum ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ViewModal offer={viewOfferWithCount} open={!!viewOffer} onClose={() => setViewOffer(null)} />
      <EditModal key={editOffer?.id_offer ?? "none"} offer={editOffer} open={!!editOffer} onClose={() => setEditOffer(null)} onSave={handleEditSave} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'offre"
        message={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.title} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkAction !== null}
        title={
          bulkAction === "delete" ? "Suppression groupée" :
          bulkAction === "activate" ? "Publication groupée" :
          bulkAction === "close" ? "Fermeture groupée" :
          "Conversion en brouillon"
        }
        message={
          bulkAction === "delete"
            ? `Êtes-vous sûr de vouloir supprimer ${selected.size} offre(s) ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir effectuer cette action sur ${selected.size} offre(s) ?`
        }
        confirmLabel={bulkAction === "delete" ? "Supprimer" : "Confirmer"}
        variant={bulkAction === "delete" ? "danger" : "warning"}
        onConfirm={handleBulk}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
