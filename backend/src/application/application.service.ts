import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.application.findMany({
      select: {
        id_application: true,
        motivation: true,
        status: true,
        applied_at: true,
        updated_at: true,
        student: {
          select: {
            id_student: true,
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        offer: {
          select: {
            id_offer: true,
            title: true,
            company: {
              select: {
                company_name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id_application: number) {
    const application = await this.prisma.application.findUnique({
      where: { id_application },
      select: {
        id_application: true,
        motivation: true,
        status: true,
        applied_at: true,
        updated_at: true,
        student: {
          select: {
            id_student: true,
            university: true,
            level: true,
            cv_url: true,
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        offer: {
          select: {
            id_offer: true,
            title: true,
            description: true,
            company: {
              select: {
                company_name: true,
                sector: true,
              },
            },
          },
        },
      },
    });

    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async findByStudent(id_student: number) {
    return this.prisma.application.findMany({
      where: { id_student },
      select: {
        id_application: true,
        motivation: true,
        status: true,
        applied_at: true,
        offer: {
          select: {
            id_offer: true,
            title: true,
            location: true,
            company: {
              select: {
                company_name: true,
                logo_url: true,
              },
            },
          },
        },
      },
    });
  }

  // ✅ MANAMPY ITY
  async findByOffer(id_offer: number) {
    return this.prisma.application.findMany({
      where: { id_offer },
      select: {
        id_application: true,
        motivation: true,
        status: true,
        applied_at: true,
        student: {
          select: {
            id_student: true,
            university: true,
            level: true,
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: {
    motivation?: string;
    id_student: number;
    id_offer: number;
  }) {
    return this.prisma.application.create({
      data,
    });
  }

  async updateStatus(id_application: number, status: ApplicationStatus) {
    return this.prisma.application.update({
      where: { id_application },
      data: { status },
    });
  }

  async remove(id_application: number) {
    return this.prisma.application.delete({
      where: { id_application },
    });
  }
}
