import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, NotificationType } from '@prisma/client';

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
    // ✅ Mamorona application
    const application = await this.prisma.application.create({ data });

    // ✅ Hahazo ny offer miaraka amin'ny company sy student
    const offer = await this.prisma.offer.findUnique({
      where: { id_offer: data.id_offer },
      include: { company: { include: { user: true } } },
    });

    const student = await this.prisma.studentProfile.findUnique({
      where: { id_student: data.id_student },
      include: { user: true },
    });

    // ✅ Mamorona notification ho an'ny COMPANY
    if (offer && student) {
      await this.prisma.notification.create({
        data: {
          title: 'Nouvelle candidature reçue ! 📩',
          content: `${student.user.prenom} ${student.user.nom} a postulé pour "${offer.title}".`,
          type: NotificationType.NEW_APPLICATION,
          id_user: offer.company.user.id_user,
        },
      });
    }

    return application;
  }

  async updateStatus(id_application: number, status: ApplicationStatus) {
    // ✅ Hahazo ny application miaraka amin'ny student sy offer
    const application = await this.prisma.application.findUnique({
      where: { id_application },
      include: {
        student: {
          include: { user: true },
        },
        offer: {
          include: { company: true },
        },
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    // ✅ Manova status
    const updated = await this.prisma.application.update({
      where: { id_application },
      data: { status },
    });

    // ✅ Mamorona notification ho an'ny student
    const notifType =
      status === ApplicationStatus.ACCEPTEE
        ? NotificationType.ACCEPTED
        : NotificationType.REFUSED;

    const notifTitle =
      status === ApplicationStatus.ACCEPTEE
        ? 'Candidature acceptée ! 🎉'
        : 'Candidature refusée';

    const notifContent =
      status === ApplicationStatus.ACCEPTEE
        ? `Félicitations ! Votre candidature pour "${application.offer.title}" chez ${application.offer.company.company_name} a été acceptée.`
        : `Votre candidature pour "${application.offer.title}" chez ${application.offer.company.company_name} a été refusée.`;

    await this.prisma.notification.create({
      data: {
        title: notifTitle,
        content: notifContent,
        type: notifType,
        id_user: application.student.id_user,
      },
    });

    return updated;
  }

  async remove(id_application: number) {
    return this.prisma.application.delete({
      where: { id_application },
    });
  }
}
