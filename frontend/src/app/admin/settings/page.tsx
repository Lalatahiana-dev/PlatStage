"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  Server,
  Database,
  HardDrive,
  Info,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Monitor,
  Upload,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
  Mail,
  FileText,
  Sun,
  Moon,
  LayoutGrid,
  Rows3,
  Megaphone,
  UserPlus,
  Briefcase,
  CalendarCheck,
  Zap,
  RefreshCw,
  Layers,
  Paintbrush,
} from "lucide-react";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import AdminAvatar from "@/components/AdminAvatar";
import {
  useSettings,
  type AllSettings,
  type GeneralSettings,
  type ProfileSettings,
  type AppearanceSettings,
  type NotificationSettings,
  type SecuritySettings,
  type PlatformConfigSettings,
} from "@/hooks/useSettings";

/* ── Tab definition ───────────────────────────────────────────────────────── */

type TabId =
  | "general"
  | "profile"
  | "appearance"
  | "notifications"
  | "security"
  | "platform"
  | "maintenance"
  | "system"
  | "ux";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { id: "general", label: "Général", icon: Settings },
  { id: "profile", label: "Profil", icon: User },
  { id: "appearance", label: "Apparence", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "platform", label: "Plateforme", icon: Server },
  { id: "maintenance", label: "Maintenance", icon: HardDrive },
  { id: "system", label: "Système", icon: Info },
  { id: "ux", label: "Expérience", icon: Layers },
];

/* ── Shared small components ──────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition disabled:opacity-50 disabled:bg-gray-50"
    />
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-indigo-600" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition bg-white disabled:opacity-50 disabled:bg-gray-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 rounded-full border-2 transition ${
        selected ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function SkeletonSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
        <div>
          <div className="h-7 bg-gray-100 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-100 rounded-lg w-24" />
          <div className="h-10 bg-gray-100 rounded-lg w-28" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-lg w-24 flex-shrink-0" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section: General ─────────────────────────────────────────────────────── */

function GeneralSection({
  general,
  onChange,
}: {
  general: GeneralSettings;
  onChange: (p: Partial<GeneralSettings>) => void;
}) {
  return (
    <Card className="p-6">
      <SectionHeader
        icon={Globe}
        title="Paramètres généraux"
        description="Configuration de base de la plateforme"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nom de la plateforme">
          <Input
            value={general.platformName}
            onChange={(v) => onChange({ platformName: v })}
            placeholder="e-Stage"
          />
        </Field>
        <Field label="Site web">
          <Input
            value={general.websiteUrl}
            onChange={(v) => onChange({ websiteUrl: v })}
            placeholder="https://estage.tn"
          />
        </Field>
        <Field label="Email de contact" hint="Affiché sur la page publique">
          <Input
            type="email"
            value={general.contactEmail}
            onChange={(v) => onChange({ contactEmail: v })}
            placeholder="contact@estage.tn"
          />
        </Field>
        <Field label="Téléphone de contact">
          <Input
            value={general.contactPhone}
            onChange={(v) => onChange({ contactPhone: v })}
            placeholder="+216 71 000 000"
          />
        </Field>
        <Field label="Adresse" className="md:col-span-2">
          <Input
            value={general.address}
            onChange={(v) => onChange({ address: v })}
            placeholder="Tunis, Tunisie"
          />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <textarea
            value={general.platformDescription}
            onChange={(e) => onChange({ platformDescription: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition resize-none"
          />
        </Field>
      </div>
    </Card>
  );
}

/* ── Section: Profile ─────────────────────────────────────────────────────── */

function ProfileSection({
  profile,
  onChange,
  avatarSrc,
}: {
  profile: ProfileSettings;
  onChange: (p: Partial<ProfileSettings>) => void;
  avatarSrc?: string | null;
}) {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader
          icon={User}
          title="Informations du profil"
          description="Gérez vos informations personnelles"
        />
        <div className="flex items-start gap-4 mb-5">
          <AdminAvatar
            src={avatarSrc}
            name={`${profile.prenom} ${profile.nom}`}
            size={72}
            className="rounded-2xl"
          />
          <div className="pt-2">
            <p className="text-sm font-medium text-gray-700">
              {profile.prenom || profile.nom
                ? `${profile.prenom} ${profile.nom}`
                : "Administrateur"}
            </p>
            <p className="text-xs text-gray-400">{profile.email}</p>
            <p className="text-[11px] text-gray-400 mt-2">
              La photo de profil est gérée via votre profil étudiant ou entreprise.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prénom">
            <Input
              value={profile.prenom}
              onChange={(v) => onChange({ prenom: v })}
              placeholder="Prénom"
            />
          </Field>
          <Field label="Nom">
            <Input
              value={profile.nom}
              onChange={(v) => onChange({ nom: v })}
              placeholder="Nom"
            />
          </Field>
          <Field label="Email" className="md:col-span-2">
            <Input
              type="email"
              value={profile.email}
              onChange={(v) => onChange({ email: v })}
              placeholder="admin@estage.tn"
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          icon={Lock}
          title="Changer le mot de passe"
          description="Modifiez votre mot de passe de connexion"
        />
        <div className="space-y-4 max-w-md">
          <Field label="Mot de passe actuel">
            <div className="relative">
              <Input
                type={showCurrentPw ? "text" : "password"}
                value={profile.currentPassword}
                onChange={(v) => onChange({ currentPassword: v })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Nouveau mot de passe">
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                value={profile.newPassword}
                onChange={(v) => onChange({ newPassword: v })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirmer le mot de passe">
            <Input
              type="password"
              value={profile.confirmPassword}
              onChange={(v) => onChange({ confirmPassword: v })}
              placeholder="••••••••"
            />
          </Field>
          {profile.newPassword &&
            profile.confirmPassword &&
            profile.newPassword !== profile.confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Les mots de passe ne correspondent pas
              </p>
            )}
          <p className="text-[11px] text-gray-400">
            Le changement de mot de passe utilise l&apos;API de réinitialisation
            admin. Un mot de passe temporaire sera envoyé par email.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ── Section: Appearance ──────────────────────────────────────────────────── */

function AppearanceSection({
  appearance,
  onChange,
}: {
  appearance: AppearanceSettings;
  onChange: (p: Partial<AppearanceSettings>) => void;
}) {
  const COLORS = [
    { value: "#6366f1", label: "Indigo" },
    { value: "#3b82f6", label: "Bleu" },
    { value: "#10b981", label: "Émeraude" },
    { value: "#f59e0b", label: "Ambre" },
    { value: "#ef4444", label: "Rouge" },
    { value: "#8b5cf6", label: "Violet" },
    { value: "#ec4899", label: "Rose" },
    { value: "#06b6d4", label: "Cyan" },
  ];

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Palette}
        title="Apparence"
        description="Personnalisez l'interface de la plateforme"
      />

      <div className="space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
            Thème
          </label>
          <div className="flex gap-3">
            {(
              [
                { key: "light" as const, label: "Clair", icon: Sun },
                { key: "dark" as const, label: "Sombre", icon: Moon },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => onChange({ theme: t.key })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                  appearance.theme === t.key
                    ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Le thème sombre est appliqué à l&apos;ensemble de l&apos;interface.
          </p>
        </div>

        {/* Primary color */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
            Couleur principale
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {COLORS.map((c) => (
              <ColorDot
                key={c.value}
                color={c.value}
                selected={appearance.primaryColor === c.value}
                onClick={() => onChange({ primaryColor: c.value })}
              />
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Couleur utilisée pour les boutons, liens et accents.
          </p>
        </div>

        {/* Sidebar style */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
            Style de la barre latérale
          </label>
          <div className="flex gap-3">
            {(
              [
                { key: "default" as const, label: "Standard", icon: Rows3 },
                { key: "compact" as const, label: "Compact", icon: LayoutGrid },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => onChange({ sidebarStyle: s.key })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                  appearance.sidebarStyle === s.key
                    ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dense tables */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Tables compactes</p>
            <p className="text-xs text-gray-400">
              Réduire l&apos;espacement dans les tableaux de données
            </p>
          </div>
          <Toggle
            checked={appearance.denseTables}
            onChange={(v) => onChange({ denseTables: v })}
          />
        </div>
      </div>
    </Card>
  );
}

/* ── Section: Notifications ───────────────────────────────────────────────── */

function NotificationsSection({
  notifications,
  onChange,
}: {
  notifications: NotificationSettings;
  onChange: (p: Partial<NotificationSettings>) => void;
}) {
  const items: {
    key: keyof NotificationSettings;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: "emailNotifications",
      label: "Notifications par email",
      description: "Recevoir les notifications importantes par email",
      icon: Mail,
    },
    {
      key: "newUserNotifications",
      label: "Nouveaux utilisateurs",
      description: "Être notifié lors de l'inscription de nouveaux utilisateurs",
      icon: UserPlus,
    },
    {
      key: "newApplicationNotifications",
      label: "Nouvelles candidatures",
      description: "Être notifié lors de nouvelles candidatures",
      icon: Briefcase,
    },
    {
      key: "newInterviewNotifications",
      label: "Nouveaux entretiens",
      description: "Être notifié lors de la planification d'entretiens",
      icon: CalendarCheck,
    },
    {
      key: "systemAlerts",
      label: "Alertes système",
      description: "Notifications critiques liées au fonctionnement du système",
      icon: Zap,
    },
  ];

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Bell}
        title="Paramètres de notification"
        description="Configurez vos préférences de notification"
      />
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <item.icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            </div>
            <Toggle
              checked={notifications[item.key]}
              onChange={(v) => onChange({ [item.key]: v })}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Section: Security ────────────────────────────────────────────────────── */

function SecuritySection({
  security,
  onChange,
}: {
  security: SecuritySettings;
  onChange: (p: Partial<SecuritySettings>) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader
          icon={Shield}
          title="Sécurité du compte"
          description="Paramètres de sécurité de votre session"
        />
        <div className="space-y-5">
          <Field label="Durée de session (minutes)">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={security.sessionTimeout}
                onChange={(e) => onChange({ sessionTimeout: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-700 w-16 text-right">
                {security.sessionTimeout} min
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Déconnexion automatique après une période d&apos;inactivité.
            </p>
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          icon={Lock}
          title="Authentification à deux facteurs"
          description="Sécurisez votre compte avec la 2FA"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Activer la 2FA</p>
            <p className="text-xs text-gray-400">
              Ajoutez une couche de sécurité supplémentaire
            </p>
          </div>
          <Toggle
            checked={security.twoFactorEnabled}
            onChange={(v) => onChange({ twoFactorEnabled: v })}
            disabled
          />
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            L&apos;authentification à deux facteurs sera disponible dans une
            prochaine mise à jour.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ── Section: Platform Configuration ──────────────────────────────────────── */

function PlatformSection({
  platformConfig,
  onChange,
}: {
  platformConfig: PlatformConfigSettings;
  onChange: (p: Partial<PlatformConfigSettings>) => void;
}) {
  return (
    <Card className="p-6">
      <SectionHeader
        icon={Server}
        title="Configuration de la plateforme"
        description="Paramètres techniques de la plateforme"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Taille maximale des fichiers (MB)" hint="Limite actuelle du serveur: 5 MB">
          <input
            type="number"
            min={1}
            max={50}
            value={platformConfig.maxUploadSize}
            onChange={(e) =>
              onChange({ maxUploadSize: Number(e.target.value) })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
          />
        </Field>
        <Field label="Formats autorisés" hint="Séparés par des virgules">
          <Input
            value={platformConfig.allowedFormats}
            onChange={(v) => onChange({ allowedFormats: v })}
            placeholder="jpg, png, webp, gif"
          />
        </Field>
        <Field label="Avatar par défaut">
          <Select
            value={platformConfig.defaultAvatar}
            onChange={(v) => onChange({ defaultAvatar: v })}
            options={[
              { value: "initials", label: "Initiales du nom" },
              { value: "silhouette", label: "Silhouette" },
            ]}
          />
        </Field>
        <Field label="Statut par défaut des candidatures">
          <Select
            value={platformConfig.defaultApplicationStatus}
            onChange={(v) => onChange({ defaultApplicationStatus: v })}
            options={[
              { value: "EN_ATTENTE", label: "En attente" },
              { value: "REVIEWING", label: "En cours d'examen" },
            ]}
          />
        </Field>
        <Field label="Durée par défaut des entretiens (minutes)">
          <input
            type="number"
            min={15}
            max={180}
            step={15}
            value={platformConfig.defaultInterviewDuration}
            onChange={(e) =>
              onChange({ defaultInterviewDuration: Number(e.target.value) })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
          />
        </Field>
      </div>
    </Card>
  );
}

/* ── Section: Maintenance ─────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "checking" | "up" | "down" }) {
  if (status === "checking")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
        <Loader2 className="w-3 h-3 animate-spin" /> Vérification...
      </span>
    );
  if (status === "up")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
        <CheckCircle2 className="w-3 h-3" /> Opérationnel
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
      <AlertTriangle className="w-3 h-3" /> Indisponible
    </span>
  );
}

function MaintenanceSection() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "up" | "down">("checking");
  const [dbStatus, setDbStatus] = useState<"checking" | "up" | "down">("checking");
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    setBackendStatus("checking");
    setDbStatus("checking");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/`,
        { signal: AbortSignal.timeout(5000) },
      );
      setBackendStatus(res.ok ? "up" : "down");
      setDbStatus(res.ok ? "up" : "down");
    } catch {
      setBackendStatus("down");
      setDbStatus("down");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader
          icon={HardDrive}
          title="État du système"
          description="Vérifiez l'état des services"
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Backend API</span>
            </div>
            <StatusBadge status={backendStatus} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Base de données</span>
            </div>
            <StatusBadge status={dbStatus} />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={checkHealth}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            Vérifier l&apos;état
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          icon={Upload}
          title="Espace de stockage"
          description="Informations sur le stockage du serveur"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <HardDrive className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-800">—</p>
            <p className="text-xs text-gray-400">Espace utilisé</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-800">5 MB</p>
            <p className="text-xs text-gray-400">Limite par fichier</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-800">8</p>
            <p className="text-xs text-gray-400">Formats autorisés</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          Les informations de stockage détaillées seront disponibles lorsque
          l&apos;API de monitoring sera implémentée.
        </p>
      </Card>

      <Card className="p-6">
        <SectionHeader
          icon={AlertTriangle}
          title="Mode maintenance"
          description="Activez le mode maintenance pour les opérations de service"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Mode maintenance</p>
            <p className="text-xs text-gray-400">
              Affiche une page de maintenance aux utilisateurs
            </p>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled />
        </div>
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Le mode maintenance nécessite une intégration backend. Il sera
            disponible dans une prochaine mise à jour.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ── Section: System Information ──────────────────────────────────────────── */

function SystemSection() {
  const info: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Application", value: "e-Stage v1.0.0", icon: Layers },
    { label: "Frontend", value: "Next.js 16.2.9 · React 19", icon: Monitor },
    { label: "Backend", value: "NestJS 11.0.1", icon: Server },
    { label: "Base de données", value: "PostgreSQL (Neon)", icon: Database },
    { label: "ORM", value: "Prisma 6.19.3", icon: Database },
    { label: "Environnement",
      value: process.env.NODE_ENV === "production" ? "Production" : "Développement",
      icon: Globe },
  ];

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Info}
        title="Informations système"
        description="Détails sur l'environnement technique"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {info.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100">
              <item.icon className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-medium text-gray-700">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Section: UX ──────────────────────────────────────────────────────────── */

function UxSection({
  settings,
  onChange,
}: {
  settings: AllSettings;
  onChange: {
    updateAppearance: (p: Partial<AppearanceSettings>) => void;
    updatePlatformConfig: (p: Partial<PlatformConfigSettings>) => void;
  };
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader
          icon={Paintbrush}
          title="Préférences d'affichage"
          description="Configurez l'expérience utilisateur globale"
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Animations réduites</p>
              <p className="text-xs text-gray-400">
                Désactiver les animations pour de meilleures performances
              </p>
            </div>
            <Toggle
              checked={false}
              onChange={() => {}}
              disabled
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Tables denses</p>
              <p className="text-xs text-gray-400">
                Réduire l&apos;espacement dans les tableaux pour afficher plus de données
              </p>
            </div>
            <Toggle
              checked={settings.appearance.denseTables}
              onChange={(v) => onChange.updateAppearance({ denseTables: v })}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Mode compact</p>
              <p className="text-xs text-gray-400">
                Interface plus serrée avec moins d&apos;espacement
              </p>
            </div>
            <Toggle
              checked={settings.appearance.sidebarStyle === "compact"}
              onChange={(v) =>
                onChange.updateAppearance({
                  sidebarStyle: v ? "compact" : "default",
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          icon={Megaphone}
          title="Préférences de contenu"
          description="Configurez l'affichage des données par défaut"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Statut par défaut des candidatures">
            <Select
              value={settings.platformConfig.defaultApplicationStatus}
              onChange={(v) => onChange.updatePlatformConfig({ defaultApplicationStatus: v })}
              options={[
                { value: "EN_ATTENTE", label: "En attente" },
                { value: "REVIEWING", label: "En cours d'examen" },
              ]}
            />
          </Field>
          <Field label="Durée par défaut des entretiens (minutes)">
            <input
              type="number"
              min={15}
              max={180}
              step={15}
              value={settings.platformConfig.defaultInterviewDuration}
              onChange={(e) =>
                onChange.updatePlatformConfig({
                  defaultInterviewDuration: Number(e.target.value),
                })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </Field>
          <Field label="Avatar par défaut">
            <Select
              value={settings.platformConfig.defaultAvatar}
              onChange={(v) => onChange.updatePlatformConfig({ defaultAvatar: v })}
              options={[
                { value: "initials", label: "Initiales du nom" },
                { value: "silhouette", label: "Silhouette" },
              ]}
            />
          </Field>
          <Field label="Taille maximale d'upload (MB)">
            <input
              type="number"
              min={1}
              max={50}
              value={settings.platformConfig.maxUploadSize}
              onChange={(e) =>
                onChange.updatePlatformConfig({
                  maxUploadSize: Number(e.target.value),
                })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const {
    settings,
    saving,
    loading,
    hasChanges,
    save,
    reset,
    updateGeneral,
    updateProfile,
    updateAppearance,
    updateNotifications,
    updateSecurity,
    updatePlatformConfig,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<TabId>("general");

  const handleSave = async () => {
    const ok = await save();
    if (ok) {
      showToast("success", "Paramètres enregistrés avec succès");
    } else {
      showToast("error", "Erreur lors de l'enregistrement");
    }
  };

  const handleReset = () => {
    reset();
    showToast("success", "Modifications annulées");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ToastContainer />
        <SkeletonSettings />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Paramètres
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurez la plateforme et votre profil administrateur
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === "general" && (
          <GeneralSection general={settings.general} onChange={updateGeneral} />
        )}
        {activeTab === "profile" && (
          <ProfileSection
            profile={settings.profile}
            onChange={updateProfile}
            avatarSrc={null}
          />
        )}
        {activeTab === "appearance" && (
          <AppearanceSection
            appearance={settings.appearance}
            onChange={updateAppearance}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsSection
            notifications={settings.notifications}
            onChange={updateNotifications}
          />
        )}
        {activeTab === "security" && (
          <SecuritySection
            security={settings.security}
            onChange={updateSecurity}
          />
        )}
        {activeTab === "platform" && (
          <PlatformSection
            platformConfig={settings.platformConfig}
            onChange={updatePlatformConfig}
          />
        )}
        {activeTab === "maintenance" && <MaintenanceSection />}
        {activeTab === "system" && <SystemSection />}
        {activeTab === "ux" && (
          <UxSection
            settings={settings}
            onChange={{
              updateAppearance,
              updatePlatformConfig,
            }}
          />
        )}
      </div>
    </div>
  );
}
