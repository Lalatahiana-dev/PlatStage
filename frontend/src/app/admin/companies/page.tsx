"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import api from "@/lib/axios";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminAvatar from "@/components/AdminAvatar";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
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
  XCircle,
  Ban,
  Play,
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
  Calendar,
  MapPin,
  Globe,
  Mail,
  ExternalLink,
  Settings,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface CompanyUser {
  id_user: number;
  nom: string;
  prenom: string;
  email: string;
}

interface CompanyOffer {
  id_offer: number;
  title: string;
  status: string;
  created_at: string;
  _count: { applications: number };
}

interface Company {
  id_company: number;
  company_name: string;
  sector: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  address: string | null;
  is_verified: boolean;
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
  updated_at: string;
  user: CompanyUser;
  _count?: { offers: number };
  offers?: CompanyOffer[];
}

type SortField = "company_name" | "created_at" | "sector" | "offers";
type SortDir = "asc" | "desc";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-400" },
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
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
    </div>
  );
}

/* ── Actions Dropdown ────────────────────────────────────────────────────── */

function ActionsDropdown({
  company,
  onView,
  onEdit,
  onToggleVerify,
  onToggleStatus,
  onDelete,
}: {
  company: Company;
  onView: () => void;
  onEdit: () => void;
  onToggleVerify: () => void;
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
          <button onClick={() => { onToggleVerify(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            {company.is_verified ? (
              <><ShieldAlert className="w-4 h-4 text-amber-500" /> Retirer la vérification</>
            ) : (
              <><ShieldCheck className="w-4 h-4 text-emerald-500" /> Vérifier</>
            )}
          </button>
          <button onClick={() => { onToggleStatus(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            {company.status === "ACTIVE" ? (
              <><Ban className="w-4 h-4 text-amber-500" /> Suspendre</>
            ) : (
              <><Play className="w-4 h-4 text-emerald-500" /> Réactiver</>
            )}
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

function ViewModal({ company, open, onClose }: { company: Company | null; open: boolean; onClose: () => void }) {
  if (!open || !company) return null;
  const sc = statusColors[company.status] || statusColors.ACTIVE;

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
              src={company.logo_url}
              name={company.company_name}
              size={64}
              className="rounded-2xl"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{company.company_name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${company.is_verified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                  {company.is_verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {company.is_verified ? "Vérifié" : "Non vérifié"}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {statusLabels[company.status]}
                </span>
                {company.sector && (
                  <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-blue-50 text-blue-600">{company.sector}</span>
                )}
              </div>
            </div>
          </div>

          {company.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-6 bg-gray-50 rounded-xl p-4">{company.description}</p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{company.user.email}</span>
            </div>
            {company.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{company.address}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  {company.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Inscrit le {new Date(company.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {company.offers && company.offers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Offres de stage ({company.offers.length})</h4>
              <div className="space-y-2">
                {company.offers.map((offer) => (
                  <div key={offer.id_offer} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{offer.title}</p>
                      <p className="text-xs text-gray-400">{timeAgo(offer.created_at)}</p>
                    </div>
                    <span className="text-xs text-gray-500">{offer._count.applications} candidature(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  company,
  open,
  onClose,
  onSave,
}: {
  company: Company | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: Record<string, string>) => void;
}) {
  const [companyName, setCompanyName] = useState(company?.company_name ?? "");
  const [sector, setSector] = useState(company?.sector ?? "");
  const [description, setDescription] = useState(company?.description ?? "");
  const [website, setWebsite] = useState(company?.website ?? "");
  const [address, setAddress] = useState(company?.address ?? "");
  const [saving, setSaving] = useState(false);

  if (!open || !company) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put(`/companies/${company.id_company}`, {
        company_name: companyName,
        sector: sector || undefined,
        description: description || undefined,
        website: website || undefined,
        address: address || undefined,
      });
      onSave(company.id_company, { company_name: companyName, sector, description, website, address });
      showToast("success", "Entreprise mise à jour");
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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[scaleIn_0.15s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier l&apos;entreprise</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nom de l&apos;entreprise</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Secteur / Industrie</label>
            <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Site web</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
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

/* ── Sort Icon ──────────────────────────────────────────────────────────── */

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
  return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />;
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [bulkAction, setBulkAction] = useState<"verify" | "unverify" | "suspend" | "activate" | "delete" | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(Array.isArray(res.data) ? res.data : res.data.data || []);
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
        const res = await api.get("/companies", { signal: controller.signal });
        if (!controller.signal.aborted) setCompanies(Array.isArray(res.data) ? res.data : res.data.data || []);
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
    const total = companies.length;
    const verified = companies.filter((c) => c.is_verified).length;
    const pending = total - verified;
    const totalOffers = companies.reduce((s, c) => s + (c._count?.offers || 0), 0);
    const active = companies.filter((c) => c.status === "ACTIVE").length;
    const newThisMonth = companies.filter((c) => isThisMonth(c.created_at)).length;
    return { total, verified, pending, totalOffers, active, newThisMonth };
  }, [companies]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => { if (c.sector) set.add(c.sector); });
    return Array.from(set).sort();
  }, [companies]);

  /* ── Filter + Sort + Paginate ──────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = [...companies];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.company_name.toLowerCase().includes(q) ||
          c.sector?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.user.email.toLowerCase().includes(q),
      );
    }

    if (verifiedFilter !== "ALL") {
      result = result.filter((c) => (verifiedFilter === "VERIFIED" ? c.is_verified : !c.is_verified));
    }

    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (sectorFilter !== "ALL") {
      result = result.filter((c) => c.sector === sectorFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "company_name":
          cmp = a.company_name.localeCompare(b.company_name, "fr");
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "sector":
          cmp = (a.sector || "").localeCompare(b.sector || "", "fr");
          break;
        case "offers":
          cmp = (a._count?.offers || 0) - (b._count?.offers || 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [companies, search, verifiedFilter, statusFilter, sectorFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setSearchValue = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const setVerifiedFilterValue = useCallback((v: string) => { setVerifiedFilter(v); setPage(1); }, []);
  const setStatusFilterValue = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);
  const setSectorFilterValue = useCallback((v: string) => { setSectorFilter(v); setPage(1); }, []);
  const setPageSizeValue = useCallback((v: number) => { setPageSize(v); setPage(1); }, []);

  /* ── Selection ─────────────────────────────────────────────────────────── */

  const allOnPageSelected = paginated.length > 0 && paginated.every((c) => selected.has(c.id_company));
  const someOnPageSelected = paginated.some((c) => selected.has(c.id_company));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((c) => n.delete(c.id_company)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((c) => n.add(c.id_company)); return n; });
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const handleToggleVerify = async (company: Company) => {
    const newVal = !company.is_verified;
    try {
      await api.patch(`/companies/${company.id_company}/verify`, { is_verified: newVal });
      setCompanies((prev) => prev.map((c) => c.id_company === company.id_company ? { ...c, is_verified: newVal } : c));
      showToast("success", `Entreprise ${newVal ? "vérifiée" : "non vérifiée"}`);
    } catch {
      showToast("error", "Erreur lors de la mise à jour");
    }
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = company.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.patch(`/companies/${company.id_company}/status`, { status: newStatus });
      setCompanies((prev) => prev.map((c) => c.id_company === company.id_company ? { ...c, status: newStatus as "ACTIVE" | "SUSPENDED" } : c));
      showToast("success", `Entreprise ${newStatus === "ACTIVE" ? "réactivée" : "suspendue"}`);
    } catch {
      showToast("error", "Erreur lors du changement de statut");
    }
  };

  const handleDelete = async (company: Company) => {
    try {
      await api.delete(`/companies/${company.id_company}`);
      setCompanies((prev) => prev.filter((c) => c.id_company !== company.id_company));
      setSelected((prev) => { const n = new Set(prev); n.delete(company.id_company); return n; });
      showToast("success", "Entreprise supprimée");
    } catch {
      showToast("error", "Erreur lors de la suppression");
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selected.size === 0) {
      showToast("error", "Aucune entreprise sélectionnée");
      setBulkAction(null);
      return;
    }
    const ids = Array.from(selected);

    try {
      if (bulkAction === "delete") {
        await api.post("/companies/bulk/delete", { companyIds: ids });
        setCompanies((prev) => prev.filter((c) => !selected.has(c.id_company)));
        showToast("success", `${ids.length} entreprise(s) supprimée(s)`);
      } else if (bulkAction === "verify" || bulkAction === "unverify") {
        await api.post("/companies/bulk/verify", { companyIds: ids, is_verified: bulkAction === "verify" });
        setCompanies((prev) => prev.map((c) => selected.has(c.id_company) ? { ...c, is_verified: bulkAction === "verify" } : c));
        showToast("success", `${ids.length} entreprise(s) ${bulkAction === "verify" ? "vérifiée(s)" : "non vérifiée(s)"}`);
      } else {
        const status = bulkAction === "activate" ? "ACTIVE" : "SUSPENDED";
        await api.post("/companies/bulk/status", { companyIds: ids, status });
        setCompanies((prev) => prev.map((c) => selected.has(c.id_company) ? { ...c, status: status as "ACTIVE" | "SUSPENDED" } : c));
        showToast("success", `${ids.length} entreprise(s) ${status === "ACTIVE" ? "réactivée(s)" : "suspendue(s)"}`);
      }
      setSelected(new Set());
    } catch {
      showToast("error", "Erreur lors de l'action groupée");
    }
    setBulkAction(null);
  };

  const handleEditSave = (id: number, data: Record<string, string>) => {
    setCompanies((prev) => prev.map((c) => c.id_company === id ? { ...c, ...data } : c));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const headers = ["ID", "Nom", "Secteur", "Email", "Adresse", "Vérifié", "Statut", "Offres", "Inscrit le"];
    const rows = filtered.map((c) => [
      c.id_company, c.company_name, c.sector || "", c.user.email, c.address || "",
      c.is_verified ? "Oui" : "Non", c.status, c._count?.offers || 0,
      new Date(c.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "entreprises.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export CSV téléchargé");
  };

  const activeFilters = [verifiedFilter !== "ALL", statusFilter !== "ALL", sectorFilter !== "ALL"].filter(Boolean).length;

  const viewCompanyWithOffers = useMemo(() => {
    if (!viewCompany) return null;
    return companies.find((c) => c.id_company === viewCompany.id_company) || viewCompany;
  }, [viewCompany, companies]);

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
        <p className="text-sm text-gray-500 mb-4">Impossible de charger les entreprises.</p>
        <button onClick={() => { setLoading(true); setError(false); fetchCompanies(); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Entreprises</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les comptes entreprises et leurs vérifications.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition self-start">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} icon={Building2} color="purple" />
        <StatCard label="Vérifiées" value={stats.verified} icon={ShieldCheck} color="emerald" />
        <StatCard label="En attente" value={stats.pending} icon={ShieldAlert} color="amber" />
        <StatCard label="Offres actives" value={stats.totalOffers} icon={Briefcase} color="blue" />
        <StatCard label="Actives" value={stats.active} icon={CheckCircle2} color="indigo" />
        <StatCard label="Nouvelles / mois" value={stats.newThisMonth} icon={UserPlus} color="rose" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Rechercher par nom, secteur, adresse, email..." value={search} onChange={(e) => setSearchValue(e.target.value)} className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0" />
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
                <span className="text-xs text-gray-400">Vérification:</span>
                <select value={verifiedFilter} onChange={(e) => setVerifiedFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Toutes</option>
                  <option value="VERIFIED">Vérifiées</option>
                  <option value="UNVERIFIED">Non vérifiées</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Statut:</span>
                <select value={statusFilter} onChange={(e) => setStatusFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Tous</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="SUSPENDED">Suspendu</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Secteur:</span>
                <select value={sectorFilter} onChange={(e) => setSectorFilterValue(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer">
                  <option value="ALL">Tous</option>
                  {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <button onClick={() => { setVerifiedFilterValue("ALL"); setStatusFilterValue("ALL"); setSectorFilterValue("ALL"); }} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition">
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
              <button onClick={() => setBulkAction("verify")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition">
                <ShieldCheck className="w-3.5 h-3.5" /> Vérifier
              </button>
              <button onClick={() => setBulkAction("unverify")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                <ShieldAlert className="w-3.5 h-3.5" /> Dé-vérifier
              </button>
              <button onClick={() => setBulkAction("activate")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                <Play className="w-3.5 h-3.5" /> Réactiver
              </button>
              <button onClick={() => setBulkAction("suspend")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                <Ban className="w-3.5 h-3.5" /> Suspendre
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
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">
              {search || activeFilters > 0 ? "Aucune entreprise trouvée" : "Aucune entreprise"}
            </p>
            <p className="text-xs text-gray-400">
              {search || activeFilters > 0 ? "Essayez de modifier vos critères de recherche" : "Les entreprises apparaîtront ici une fois inscrites"}
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
                      <button onClick={() => handleSort("company_name")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Entreprise <SortIcon field="company_name" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button onClick={() => handleSort("sector")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Secteur <SortIcon field="sector" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-gray-500">Email</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs font-medium text-gray-500">Adresse</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <button onClick={() => handleSort("offers")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Offres <SortIcon field="offers" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-gray-500">Vérifié</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium text-gray-500">Statut</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button onClick={() => handleSort("created_at")} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                        Inscrit <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="w-10 px-4 py-3"><Settings className="w-4 h-4 text-gray-400" /></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((company) => {
                    const sc = statusColors[company.status] || statusColors.ACTIVE;
                    const isSelected = selected.has(company.id_company);
                    return (
                      <tr key={company.id_company} className={`border-b border-gray-50 transition ${isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50"}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(company.id_company)} className="text-gray-400 hover:text-indigo-600 transition">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AdminAvatar
                              src={company.logo_url}
                              name={company.company_name}
                              size={40}
                              className="rounded-xl"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{company.company_name}</div>
                              <div className="text-xs text-gray-400 md:hidden truncate">{company.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {company.sector ? (
                            <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-blue-50 text-blue-600">{company.sector}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell truncate max-w-[180px]">{company.user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-400 hidden xl:table-cell truncate max-w-[160px]">{company.address || "—"}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm font-medium text-gray-700">{company._count?.offers || 0}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg font-medium ${company.is_verified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                            {company.is_verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {company.is_verified ? "Oui" : "Non"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {statusLabels[company.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                          {new Date(company.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <ActionsDropdown
                            company={company}
                            onView={() => setViewCompany(company)}
                            onEdit={() => setEditCompany(company)}
                            onToggleVerify={() => handleToggleVerify(company)}
                            onToggleStatus={() => handleToggleStatus(company)}
                            onDelete={() => setDeleteTarget(company)}
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
      <ViewModal company={viewCompanyWithOffers} open={!!viewCompany} onClose={() => setViewCompany(null)} />
      <EditModal key={editCompany?.id_company ?? "none"} company={editCompany} open={!!editCompany} onClose={() => setEditCompany(null)} onSave={handleEditSave} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'entreprise"
        message={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.company_name} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkAction !== null}
        title={
          bulkAction === "delete" ? "Suppression groupée" :
          bulkAction === "verify" ? "Vérification groupée" :
          bulkAction === "unverify" ? "Dé-vérification groupée" :
          bulkAction === "activate" ? "Réactivation groupée" :
          "Suspension groupée"
        }
        message={
          bulkAction === "delete"
            ? `Êtes-vous sûr de vouloir supprimer ${selected.size} entreprise(s) ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir effectuer cette action sur ${selected.size} entreprise(s) ?`
        }
        confirmLabel={bulkAction === "delete" ? "Supprimer" : "Confirmer"}
        variant={bulkAction === "delete" ? "danger" : "warning"}
        onConfirm={handleBulk}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
