"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface GeneralSettings {
  platformName: string;
  platformDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  websiteUrl: string;
}

export interface ProfileSettings {
  nom: string;
  prenom: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AppearanceSettings {
  theme: "light" | "dark";
  primaryColor: string;
  sidebarStyle: "compact" | "default";
  denseTables: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  newUserNotifications: boolean;
  newApplicationNotifications: boolean;
  newInterviewNotifications: boolean;
  systemAlerts: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number;
  twoFactorEnabled: boolean;
}

export interface PlatformConfigSettings {
  maxUploadSize: number;
  allowedFormats: string;
  defaultAvatar: string;
  defaultApplicationStatus: string;
  defaultInterviewDuration: number;
}

export interface UxSettings {
  animationsReduced: boolean;
  compactMode: boolean;
}

export interface AllSettings {
  general: GeneralSettings;
  profile: ProfileSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  platformConfig: PlatformConfigSettings;
  ux: UxSettings;
}

export const DEFAULT_SETTINGS: AllSettings = {
  general: {
    platformName: "e-Stage",
    platformDescription:
      "Plateforme de mise en relation entre étudiants et entreprises pour les stages",
    contactEmail: "contact@estage.tn",
    contactPhone: "+216 71 000 000",
    address: "Tunis, Tunisie",
    websiteUrl: "https://estage.tn",
  },
  profile: {
    nom: "",
    prenom: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  },
  appearance: {
    theme: "light",
    primaryColor: "#6366f1",
    sidebarStyle: "default",
    denseTables: false,
  },
  notifications: {
    emailNotifications: true,
    newUserNotifications: true,
    newApplicationNotifications: true,
    newInterviewNotifications: true,
    systemAlerts: true,
  },
  security: {
    sessionTimeout: 30,
    twoFactorEnabled: false,
  },
  platformConfig: {
    maxUploadSize: 5,
    allowedFormats: "jpg, png, webp, gif",
    defaultAvatar: "initials",
    defaultApplicationStatus: "EN_ATTENTE",
    defaultInterviewDuration: 30,
  },
  ux: {
    animationsReduced: false,
    compactMode: false,
  },
};

/* ── Merge helpers ────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function merge<T>(defaults: T, server: any): T {
  if (!server || typeof server !== "object") return { ...defaults };
  return { ...defaults, ...server } as T;
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useSettings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const serverRef = useRef<AllSettings>(DEFAULT_SETTINGS);

  /* Fetch settings from backend + admin profile */
  useEffect(() => {
    if (!user?.userId) return;
    let cancelled = false;

    Promise.all([
      api.get("/settings").catch(() => ({ data: null })),
      api.get(`/users/${user.userId}`).catch(() => ({ data: null })),
    ]).then(([settingsRes, userRes]) => {
      if (cancelled) return;

      const s = settingsRes.data;
      const u = userRes.data;

      const merged: AllSettings = {
        general: merge(
          DEFAULT_SETTINGS.general,
          s?.general as Partial<GeneralSettings>,
        ),
        profile: {
          ...DEFAULT_SETTINGS.profile,
          nom: u?.nom ?? DEFAULT_SETTINGS.profile.nom,
          prenom: u?.prenom ?? DEFAULT_SETTINGS.profile.prenom,
          email: u?.email ?? DEFAULT_SETTINGS.profile.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
        appearance: merge(
          DEFAULT_SETTINGS.appearance,
          s?.appearance as Partial<AppearanceSettings>,
        ),
        notifications: merge(
          DEFAULT_SETTINGS.notifications,
          s?.notifications as Partial<NotificationSettings>,
        ),
        security: merge(
          DEFAULT_SETTINGS.security,
          s?.security as Partial<SecuritySettings>,
        ),
        platformConfig: merge(
          DEFAULT_SETTINGS.platformConfig,
          s?.platformConfig as Partial<PlatformConfigSettings>,
        ),
        ux: merge(
          DEFAULT_SETTINGS.ux,
          s?.ux as Partial<UxSettings>,
        ),
      };

      setSettings(merged);
      serverRef.current = JSON.parse(JSON.stringify(merged));
      setHasChanges(false);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.userId]);

  /* Track changes against last saved server state */
  useEffect(() => {
    const a = JSON.stringify(settings);
    const b = JSON.stringify(serverRef.current);
    setHasChanges(a !== b);
  }, [settings]);

  /* Apply theme on mount and when it changes */
  useEffect(() => {
    const root = document.documentElement;
    if (settings.appearance.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.appearance.theme]);

  const updateGeneral = useCallback((patch: Partial<GeneralSettings>) => {
    setSettings((s) => ({ ...s, general: { ...s.general, ...patch } }));
  }, []);

  const updateProfile = useCallback((patch: Partial<ProfileSettings>) => {
    setSettings((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const updateAppearance = useCallback((patch: Partial<AppearanceSettings>) => {
    setSettings((s) => ({ ...s, appearance: { ...s.appearance, ...patch } }));
  }, []);

  const updateNotifications = useCallback(
    (patch: Partial<NotificationSettings>) => {
      setSettings((s) => ({
        ...s,
        notifications: { ...s.notifications, ...patch },
      }));
    },
    [],
  );

  const updateSecurity = useCallback((patch: Partial<SecuritySettings>) => {
    setSettings((s) => ({ ...s, security: { ...s.security, ...patch } }));
  }, []);

  const updatePlatformConfig = useCallback(
    (patch: Partial<PlatformConfigSettings>) => {
      setSettings((s) => ({
        ...s,
        platformConfig: { ...s.platformConfig, ...patch },
      }));
    },
    [],
  );

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      /* Save profile to users endpoint */
      if (user?.userId) {
        await api.patch(`/users/${user.userId}`, {
          nom: settings.profile.nom,
          prenom: settings.profile.prenom,
          email: settings.profile.email,
        });
      }

      /* Save all non-profile settings to settings endpoint */
      const { profile: _profile, ...settingsToSave } = settings;
      void _profile;
      const res = await api.put("/settings", settingsToSave);

      /* Merge server response back into state */
      if (res.data) {
        const s = res.data;
        setSettings((prev) => ({
          general: merge(
            DEFAULT_SETTINGS.general,
            s.general as Partial<GeneralSettings>,
          ),
          profile: { ...prev.profile },
          appearance: merge(
            DEFAULT_SETTINGS.appearance,
            s.appearance as Partial<AppearanceSettings>,
          ),
          notifications: merge(
            DEFAULT_SETTINGS.notifications,
            s.notifications as Partial<NotificationSettings>,
          ),
          security: merge(
            DEFAULT_SETTINGS.security,
            s.security as Partial<SecuritySettings>,
          ),
          platformConfig: merge(
            DEFAULT_SETTINGS.platformConfig,
            s.platformConfig as Partial<PlatformConfigSettings>,
          ),
          ux: merge(
            DEFAULT_SETTINGS.ux,
            s.ux as Partial<UxSettings>,
          ),
        }));
      }

      /* Update the server baseline */
      const fresh: AllSettings = {
        general: res.data?.general
          ? merge(DEFAULT_SETTINGS.general, res.data.general)
          : settings.general,
        profile: { ...settings.profile },
        appearance: res.data?.appearance
          ? merge(DEFAULT_SETTINGS.appearance, res.data.appearance)
          : settings.appearance,
        notifications: res.data?.notifications
          ? merge(
              DEFAULT_SETTINGS.notifications,
              res.data.notifications,
            )
          : settings.notifications,
        security: res.data?.security
          ? merge(DEFAULT_SETTINGS.security, res.data.security)
          : settings.security,
        platformConfig: res.data?.platformConfig
          ? merge(
              DEFAULT_SETTINGS.platformConfig,
              res.data.platformConfig,
            )
          : settings.platformConfig,
        ux: res.data?.ux
          ? merge(DEFAULT_SETTINGS.ux, res.data.ux)
          : settings.ux,
      };
      serverRef.current = JSON.parse(JSON.stringify(fresh));
      setHasChanges(false);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [settings, user]);

  const reset = useCallback(() => {
    setSettings(JSON.parse(JSON.stringify(serverRef.current)));
    setHasChanges(false);
  }, []);

  return {
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
  };
}
