import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const SECTIONS = [
  'general',
  'profile',
  'appearance',
  'notifications',
  'security',
  'platformConfig',
  'ux',
] as const;

const DEFAULTS: Record<string, Record<string, unknown>> = {
  general: {
    platformName: 'e-Stage',
    platformDescription:
      "Plateforme de mise en relation entre étudiants et entreprises pour les stages",
    contactEmail: 'contact@estage.tn',
    contactPhone: '+216 71 000 000',
    address: 'Tunis, Tunisie',
    websiteUrl: 'https://estage.tn',
  },
  profile: {
    nom: '',
    prenom: '',
    email: '',
  },
  appearance: {
    theme: 'light',
    primaryColor: '#6366f1',
    sidebarStyle: 'default',
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
    allowedFormats: 'jpg, png, webp, gif',
    defaultAvatar: 'initials',
    defaultApplicationStatus: 'EN_ATTENTE',
    defaultInterviewDuration: 30,
  },
  ux: {
    animationsReduced: false,
    compactMode: false,
  },
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Record<string, Record<string, unknown>>> {
    const rows = await this.prisma.setting.findMany();
    const stored: Record<string, Record<string, unknown>> = {};

    for (const row of rows) {
      const dotIndex = row.key.indexOf('.');
      if (dotIndex === -1) continue;
      const section = row.key.substring(0, dotIndex);
      const field = row.key.substring(dotIndex + 1);
      if (!stored[section]) stored[section] = {};
      try {
        stored[section][field] = JSON.parse(row.value);
      } catch {
        stored[section][field] = row.value;
      }
    }

    const result: Record<string, Record<string, unknown>> = {};
    for (const section of SECTIONS) {
      result[section] = {
        ...DEFAULTS[section],
        ...(stored[section] || {}),
      };
    }
    return result;
  }

  async update(dto: UpdateSettingsDto): Promise<Record<string, Record<string, unknown>>> {
    const updates: { key: string; value: string }[] = [];

    for (const section of SECTIONS) {
      const sectionData = (dto as Record<string, Record<string, unknown> | undefined>)[section];
      if (!sectionData || typeof sectionData !== 'object') continue;

      for (const [field, value] of Object.entries(sectionData)) {
        if (value === undefined) continue;
        updates.push({
          key: `${section}.${field}`,
          value: JSON.stringify(value),
        });
      }
    }

    for (const u of updates) {
      await this.prisma.setting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      });
    }

    return this.findAll();
  }

  async getSystemInfo() {
    let nodeVersion = 'unknown';
    try {
      nodeVersion = process.version;
    } catch {
      /* ignore */
    }

    let prismaVersion = 'unknown';
    try {
      const pkgPath = join(
        process.cwd(),
        'node_modules',
        '@prisma',
        'client',
        'package.json',
      );
      if (existsSync(pkgPath)) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pkg = require(pkgPath) as { version?: string };
        prismaVersion = pkg.version || 'unknown';
      }
    } catch {
      /* ignore */
    }

    let nestVersion = 'unknown';
    try {
      const pkgPath = join(
        process.cwd(),
        'node_modules',
        '@nestjs',
        'core',
        'package.json',
      );
      if (existsSync(pkgPath)) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pkg = require(pkgPath) as { version?: string };
        nestVersion = pkg.version || 'unknown';
      }
    } catch {
      /* ignore */
    }

    let dbStatus: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    let storageUsed = 0;
    let storageFileCount = 0;
    const uploadsDir = join(process.cwd(), 'uploads');
    if (existsSync(uploadsDir)) {
      try {
        const { readdirSync } = await import('fs');
        const files = readdirSync(uploadsDir);
        storageFileCount = files.length;
        for (const file of files) {
          try {
            const s = statSync(join(uploadsDir, file));
            storageUsed += s.size;
          } catch {
            /* skip */
          }
        }
      } catch {
        /* ignore */
      }
    }

    return {
      application: 'e-Stage v1.0.0',
      frontend: 'Next.js 16.2.9 · React 19',
      backend: `NestJS ${nestVersion}`,
      database: 'PostgreSQL (Neon)',
      orm: `Prisma ${prismaVersion}`,
      nodeVersion,
      environment: process.env.NODE_ENV || 'development',
      dbStatus,
      storageUsed,
      storageFileCount,
      maxUploadSize: 5,
    };
  }
}
