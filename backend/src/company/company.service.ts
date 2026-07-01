import { Injectable } from '@nestjs/common';
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
  }

  async findOne(id_company: number) {
    return this.prisma.company.findUnique({
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
        offers: true,
      },
    });
  }

  async create(data: {
    company_name: string;
    sector?: string;
    description?: string;
    website?: string;
    address?: string;
    id_user: number;
  }) {
    return this.prisma.company.create({
      data,
    });
  }

  async update(
    id_company: number,
    data: {
      company_name?: string;
      sector?: string;
      description?: string;
      website?: string;
      address?: string;
    },
  ) {
    return this.prisma.company.update({
      where: { id_company },
      data,
    });
  }

  async delete(id_company: number) {
    return this.prisma.company.delete({
      where: { id_company },
    });
  }
}
