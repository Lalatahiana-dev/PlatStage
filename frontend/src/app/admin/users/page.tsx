"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import api from "@/lib/axios";
import {
  showToast,
  ToastContainer,
} from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Users,
  GraduationCap,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
  UserPlus,
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
  Clock,
  Mail,
  Calendar,
  Tag,
  Settings,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface UserRole {
  role: { name: string };
}

interface StudentInfo {
  id_student: number;
  university: string | null;
  photo_url: string | null;
}

interface CompanyInfo {
  id_company: number;
  company_name: string | null;
  logo_url: string | null;
}

interface User {
  id_user: number;
  nom: string;
  prenom: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  last_login: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
  student: StudentInfo | null;
  company: CompanyInfo | null;
}

type SortField = "nom" | "created_at" | "email" | "status";
type SortDir = "asc" | "desc";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const roleColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-red-50", text: "text-red-600" },
  COMPANY: { bg: "bg-purple-50", text: "text-purple-600" },
  STUDENT: { bg: "bg-blue-50", text: "text-blue-600" },
  USER: { bg: "bg-gray-100", text: "text-gray-600" },
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  INACTIVE: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
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

function getPrimaryRole(user: User): string {
  if (user.roles.length === 0) return "USER";
  return user.roles[0].role.name;
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
          <div className="h-10 bg-gray-100 rounded-lg w-32" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 animate-pulse">
          <div className="w-5 h-5 bg-gray-100 rounded" />
          <div className="w-9 h-9 bg-gray-100 rounded-full" />
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
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
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
  user,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetPassword,
}: {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
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
            onClick={() => { onView(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <Eye className="w-4 h-4 text-gray-400" />
            Voir le profil
          </button>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <Pencil className="w-4 h-4 text-gray-400" />
            Modifier
          </button>
          <button
            onClick={() => { onResetPassword(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <KeyRound className="w-4 h-4 text-gray-400" />
            Réinitialiser mot de passe
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onToggleStatus(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            {user.status === "ACTIVE" ? (
              <>
                <UserX className="w-4 h-4 text-amber-500" />
                Désactiver
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-emerald-500" />
                Activer
              </>
            )}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Edit Modal ──────────────────────────────────────────────────────────── */

function EditModal({
  user,
  open,
  onClose,
  onSave,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: { nom: string; prenom: string; email: string }) => void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNom(user.nom);
      setPrenom(user.prenom);
      setEmail(user.email);
    }
  }, [user]);

  if (!open || !user) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.patch(`/users/${user.id_user}`, { nom, prenom, email });
      onSave(user.id_user, { nom, prenom, email });
      showToast("success", "Utilisateur mis à jour");
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier l&apos;utilisateur</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── View Profile Modal ──────────────────────────────────────────────────── */

function ViewModal({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !user) return null;

  const role = getPrimaryRole(user);
  const rc = roleColors[role] || roleColors.USER;
  const sc = statusColors[user.status] || statusColors.ACTIVE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-[scaleIn_0.15s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-lg font-bold text-indigo-600 flex-shrink-0">
            {user.prenom.charAt(0)}{user.nom.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.prenom} {user.nom}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${rc.bg} ${rc.text}`}>
                {role}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {statusLabels[user.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Inscrit le {new Date(user.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
          {user.last_login && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Dernière connexion : {timeAgo(user.last_login)}
              </span>
            </div>
          )}
          {user.student?.university && (
            <div className="flex items-center gap-3 text-sm">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{user.student.university}</span>
            </div>
          )}
          {user.company?.company_name && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{user.company.company_name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Rôles : {user.roles.map((r) => r.role.name).join(", ") || "Aucun"}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [bulkAction, setBulkAction] = useState<"activate" | "deactivate" | "delete" | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ── Stats ─────────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => u.roles.some((r) => r.role.name === "STUDENT")).length;
    const companies = users.filter((u) => u.roles.some((r) => r.role.name === "COMPANY")).length;
    const admins = users.filter((u) => u.roles.some((r) => r.role.name === "ADMIN")).length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const inactive = users.filter((u) => u.status === "INACTIVE").length;
    return { total, students, companies, admins, active, inactive };
  }, [users]);

  /* ── Filter + Sort + Paginate ──────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = [...users];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nom.toLowerCase().includes(q) ||
          u.prenom.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.company?.company_name?.toLowerCase().includes(q) ||
          u.student?.university?.toLowerCase().includes(q),
      );
    }

    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.roles.some((r) => r.role.name === roleFilter));
    }

    if (statusFilter !== "ALL") {
      result = result.filter((u) => u.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nom":
          cmp = `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, "fr");
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, search, roleFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, pageSize]);

  /* ── Selection ─────────────────────────────────────────────────────────── */

  const allOnPageSelected = paginated.length > 0 && paginated.every((u) => selected.has(u.id_user));
  const someOnPageSelected = paginated.some((u) => selected.has(u.id_user));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((u) => next.delete(u.id_user));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((u) => next.add(u.id_user));
        return next;
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.patch(`/users/${user.id_user}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id_user === user.id_user ? { ...u, status: newStatus as "ACTIVE" | "INACTIVE" } : u)),
      );
      showToast("success", `Utilisateur ${newStatus === "ACTIVE" ? "activé" : "désactivé"}`);
    } catch {
      showToast("error", "Erreur lors du changement de statut");
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await api.delete(`/users/${user.id_user}`);
      setUsers((prev) => prev.filter((u) => u.id_user !== user.id_user));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(user.id_user);
        return next;
      });
      showToast("success", "Utilisateur supprimé");
    } catch {
      showToast("error", "Erreur lors de la suppression");
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const res = await api.patch(`/users/${user.id_user}/reset-password`);
      setTempPassword(res.data.temporaryPassword);
      showToast("success", "Mot de passe réinitialisé");
    } catch {
      showToast("error", "Erreur lors de la réinitialisation du mot de passe");
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selected.size === 0) {
      showToast("error", "Aucun utilisateur sélectionné");
      setBulkAction(null);
      return;
    }
    const ids = Array.from(selected);

    try {
      if (bulkAction === "delete") {
        await api.post("/users/bulk/delete", { userIds: ids });
        setUsers((prev) => prev.filter((u) => !selected.has(u.id_user)));
        showToast("success", `${ids.length} utilisateur(s) supprimé(s)`);
      } else {
        const status = bulkAction === "activate" ? "ACTIVE" : "INACTIVE";
        await api.patch("/users/bulk/status", { userIds: ids, status });
        setUsers((prev) =>
          prev.map((u) => (selected.has(u.id_user) ? { ...u, status: status as "ACTIVE" | "INACTIVE" } : u)),
        );
        showToast("success", `${ids.length} utilisateur(s) ${bulkAction === "activate" ? "activé(s)" : "désactivé(s)"}`);
      }
      setSelected(new Set());
    } catch {
      showToast("error", "Erreur lors de l'action groupée");
    }
    setBulkAction(null);
  };

  const handleEditSave = (id: number, data: { nom: string; prenom: string; email: string }) => {
    setUsers((prev) =>
      prev.map((u) => (u.id_user === id ? { ...u, ...data } : u)),
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-indigo-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-500" />
    );
  };

  const exportCSV = () => {
    const headers = ["ID", "Nom", "Prénom", "Email", "Rôle", "Statut", "Inscrit le"];
    const rows = filtered.map((u) => [
      u.id_user,
      u.nom,
      u.prenom,
      u.email,
      getPrimaryRole(u),
      u.status,
      new Date(u.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "utilisateurs.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export CSV téléchargé");
  };

  const activeFilters = (roleFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

  /* ── Loading ───────────────────────────────────────────────────────────── */

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

  /* ── Error ─────────────────────────────────────────────────────────────── */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mb-4">Impossible de charger les utilisateurs.</p>
        <button
          onClick={() => { setLoading(true); setError(false); fetchUsers(); }}
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
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez les comptes et les rôles de la plateforme.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition self-start"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} icon={Users} color="indigo" />
        <StatCard label="Étudiants" value={stats.students} icon={GraduationCap} color="blue" />
        <StatCard label="Entreprises" value={stats.companies} icon={Building2} color="purple" />
        <StatCard label="Admins" value={stats.admins} icon={Shield} color="rose" />
        <StatCard label="Actifs" value={stats.active} icon={UserCheck} color="emerald" />
        <StatCard label="Inactifs" value={stats.inactive} icon={UserX} color="amber" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, université, entreprise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                  showFilters || activeFilters > 0
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {activeFilters > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>

              {/* Page size */}
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s} / page</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Rôle:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer"
                >
                  <option value="ALL">Tous</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STUDENT">Étudiant</option>
                  <option value="COMPANY">Entreprise</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Statut:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none cursor-pointer"
                >
                  <option value="ALL">Tous</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                </select>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setRoleFilter("ALL"); setStatusFilter("ALL"); }}
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
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setBulkAction("activate")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Activer
              </button>
              <button
                onClick={() => setBulkAction("deactivate")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition"
              >
                <UserX className="w-3.5 h-3.5" />
                Désactiver
              </button>
              <button
                onClick={() => setBulkAction("delete")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
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
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">
              {search || activeFilters > 0
                ? "Aucun utilisateur trouvé"
                : "Aucun utilisateur"}
            </p>
            <p className="text-xs text-gray-400">
              {search || activeFilters > 0
                ? "Essayez de modifier vos critères de recherche"
                : "Les utilisateurs apparaîtront ici une fois inscrits"}
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
                        onClick={() => handleSort("nom")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Utilisateur <SortIcon field="nom" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => handleSort("email")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Email <SortIcon field="email" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Rôle</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Statut <SortIcon field="status" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
                      >
                        Inscrit le <SortIcon field="created_at" />
                      </button>
                    </th>
                    <th className="w-10 px-4 py-3">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => {
                    const role = getPrimaryRole(user);
                    const rc = roleColors[role] || roleColors.USER;
                    const sc = statusColors[user.status] || statusColors.ACTIVE;
                    const isSelected = selected.has(user.id_user);

                    return (
                      <tr
                        key={user.id_user}
                        className={`border-b border-gray-50 transition ${
                          isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelect(user.id_user)}
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
                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                              {user.prenom.charAt(0)}{user.nom.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-xs text-gray-400 md:hidden truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          <span className="truncate block max-w-[200px]">{user.email}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.length === 0 ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : (
                              user.roles.map((r, i) => {
                                const c = roleColors[r.role.name] || roleColors.USER;
                                return (
                                  <span
                                    key={i}
                                    className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${c.bg} ${c.text}`}
                                  >
                                    {r.role.name}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-lg font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {statusLabels[user.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                          {new Date(user.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <ActionsDropdown
                            user={user}
                            onView={() => setViewUser(user)}
                            onEdit={() => setEditUser(user)}
                            onToggleStatus={() => handleToggleStatus(user)}
                            onDelete={() => setDeleteTarget(user)}
                            onResetPassword={() => handleResetPassword(user)}
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
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
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
      <ViewModal user={viewUser} open={!!viewUser} onClose={() => setViewUser(null)} />
      <EditModal user={editUser} open={!!editUser} onClose={() => setEditUser(null)} onSave={handleEditSave} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.prenom} ${deleteTarget?.nom} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkAction !== null}
        title={
          bulkAction === "delete"
            ? "Suppression groupée"
            : bulkAction === "activate"
              ? "Activation groupée"
              : "Désactivation groupée"
        }
        message={
          bulkAction === "delete"
            ? `Êtes-vous sûr de vouloir supprimer ${selected.size} utilisateur(s) ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir ${bulkAction === "activate" ? "activer" : "désactiver"} ${selected.size} utilisateur(s) ?`
        }
        confirmLabel={bulkAction === "delete" ? "Supprimer" : "Confirmer"}
        variant={bulkAction === "delete" ? "danger" : "warning"}
        onConfirm={handleBulk}
        onCancel={() => setBulkAction(null)}
      />

      {/* Temp Password Modal */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTempPassword(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[scaleIn_0.15s_ease-out]">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mot de passe réinitialisé</h3>
            <p className="text-sm text-gray-500 mb-4">
              Voici le nouveau mot de passe temporaire. Communiquez-le à l&apos;utilisateur.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-800 break-all">
              {tempPassword}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  showToast("success", "Copié dans le presse-papier");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              >
                Copier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
