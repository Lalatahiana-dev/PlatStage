import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      select: {
        id_company: true,
        company_name: true,
        sector: true,
        description: true,
        website: true,
        logo_url: true,
        address: true,
        is_verified: true,
        status: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        _count: {
          select: {
            offers: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUser(id_user: number) {
    const company = await this.prisma.company.findUnique({
      where: { id_user },
      select: {
        id_company: true,
        company_name: true,
        sector: true,
        description: true,
        website: true,
        logo_url: true,
        address: true,
        is_verified: true,
        status: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });
    if (!company) throw new NotFoundException('Company profile not found');
    return company;
  }

  async findOne(id_company: number) {
    const company = await this.prisma.company.findUnique({
      where: { id_company },
      select: {
        id_company: true,
        company_name: true,
        sector: true,
        description: true,
        website: true,
        logo_url: true,
        address: true,
        is_verified: true,
        status: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        offers: {
          select: {
            id_offer: true,
            title: true,
            status: true,
            created_at: true,
            _count: {
              select: {
                applications: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(data: {
    company_name: string;
    sector?: string;
    description?: string;
    website?: string;
    address?: string;
    id_user: number;
  }) {
    return this.prisma.company.create({ data });
  }

  async update(
    id_company: number,
    data: {
      company_name?: string;
      sector?: string;
      description?: string;
      website?: string;
      address?: string;
      logo_url?: string;
    },
  ) {
    const existing = await this.prisma.company.findUnique({
      where: { id_company },
    });
    if (!existing) throw new NotFoundException('Company not found');
    return this.prisma.company.update({ where: { id_company }, data });
  }

  async verify(id_company: number, is_verified: boolean) {
    const existing = await this.prisma.company.findUnique({
      where: { id_company },
    });
    if (!existing) throw new NotFoundException('Company not found');
    return this.prisma.company.update({
      where: { id_company },
      data: { is_verified },
      select: { id_company: true, is_verified: true },
    });
  }

  async updateStatus(id_company: number, status: 'ACTIVE' | 'SUSPENDED') {
    const existing = await this.prisma.company.findUnique({
      where: { id_company },
    });
    if (!existing) throw new NotFoundException('Company not found');
    return this.prisma.company.update({
      where: { id_company },
      data: { status },
      select: { id_company: true, status: true },
    });
  }

  async delete(id_company: number) {
    const existing = await this.prisma.company.findUnique({
      where: { id_company },
    });
    if (!existing) throw new NotFoundException('Company not found');
    return this.prisma.company.delete({ where: { id_company } });
  }

  async bulkVerify(companyIds: number[], is_verified: boolean) {
    await this.prisma.company.updateMany({
      where: { id_company: { in: companyIds } },
      data: { is_verified },
    });
    return { updated: companyIds.length };
  }

  async bulkUpdateStatus(
    companyIds: number[],
    status: 'ACTIVE' | 'SUSPENDED',
  ) {
    await this.prisma.company.updateMany({
      where: { id_company: { in: companyIds } },
      data: { status },
    });
    return { updated: companyIds.length };
  }

  async bulkRemove(companyIds: number[]) {
    await this.prisma.company.deleteMany({
      where: { id_company: { in: companyIds } },
    });
    return { deleted: companyIds.length };
  }
}
