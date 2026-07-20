import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../conversation/conversation.service';
import { ApplicationStatus, NotificationType } from '@prisma/client';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private conversationService: ConversationService,
  ) {}

  async findAll() {
    return this.prisma.application.findMany({
      select: {
        id_application: true,
        motivation: true,
        notes: true,
        status: true,
        applied_at: true,
        updated_at: true,
        student: {
          select: {
            id_student: true,
            university: true,
            level: true,
            photo_url: true,
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
            location: true,
            company: {
              select: {
                id_company: true,
                company_name: true,
                logo_url: true,
                sector: true,
              },
            },
          },
        },
        interview: {
          select: {
            id_interview: true,
            scheduled_at: true,
            status: true,
            type: true,
          },
        },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  async findOne(id_application: number) {
    const application = await this.prisma.application.findUnique({
      where: { id_application },
      select: {
        id_application: true,
        motivation: true,
        notes: true,
        status: true,
        applied_at: true,
        updated_at: true,
        student: {
          select: {
            id_student: true,
            university: true,
            level: true,
            cv_url: true,
            photo_url: true,
            phone: true,
            address: true,
            user: {
              select: {
                id_user: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
            skills: {
              select: {
                skill: {
                  select: {
                    id_skill: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        offer: {
          select: {
            id_offer: true,
            title: true,
            description: true,
            location: true,
            company: {
              select: {
                company_name: true,
                sector: true,
                logo_url: true,
              },
            },
          },
        },
        interview: {
          select: {
            id_interview: true,
            scheduled_at: true,
            location: true,
            type: true,
            status: true,
            completed_at: true,
            rating: true,
            strengths: true,
            weaknesses: true,
            feedback_notes: true,
            final_decision: true,
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
        notes: true,
        status: true,
        applied_at: true,
        offer: {
          select: {
            id_offer: true,
            title: true,
            location: true,
            company: {
              select: {
                id_company: true,
                company_name: true,
                logo_url: true,
              },
            },
          },
        },
        interview: {
          select: {
            id_interview: true,
            scheduled_at: true,
            status: true,
            rating: true,
            feedback_notes: true,
            strengths: true,
            weaknesses: true,
            final_decision: true,
          },
        },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  async findByOffer(id_offer: number) {
    return this.prisma.application.findMany({
      where: { id_offer },
      select: {
        id_application: true,
        motivation: true,
        notes: true,
        status: true,
        applied_at: true,
        updated_at: true,
        offer: {
          select: {
            id_offer: true,
            title: true,
          },
        },
        student: {
          select: {
            id_student: true,
            university: true,
            level: true,
            photo_url: true,
            cv_url: true,
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
            skills: {
              select: {
                skill: {
                  select: {
                    id_skill: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        interview: {
          select: {
            id_interview: true,
            scheduled_at: true,
            status: true,
          },
        },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  async create(data: {
    motivation?: string;
    id_student: number;
    id_offer: number;
  }) {
    const application = await this.prisma.application.create({ data });

    const offer = await this.prisma.offer.findUnique({
      where: { id_offer: data.id_offer },
      include: { company: { include: { user: true } } },
    });

    const student = await this.prisma.studentProfile.findUnique({
      where: { id_student: data.id_student },
      include: { user: true },
    });

    if (offer && student) {
      await this.prisma.notification.create({
        data: {
          title: 'Nouvelle candidature reçue !',
          content: `${student.user.prenom} ${student.user.nom} a postulé pour "${offer.title}".`,
          type: NotificationType.NEW_APPLICATION,
          id_user: offer.company.user.id_user,
        },
      });
    }

    return application;
  }

  async updateStatus(id_application: number, status: ApplicationStatus) {
    const application = await this.prisma.application.findUnique({
      where: { id_application },
      include: {
        student: { include: { user: true } },
        offer: { include: { company: true } },
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    const updated = await this.prisma.application.update({
      where: { id_application },
      data: { status },
    });

    let notifType: NotificationType;
    let notifTitle: string;
    let notifContent: string;

    switch (status) {
      case ApplicationStatus.REVIEWING:
        notifType = NotificationType.NEW_APPLICATION;
        notifTitle = 'Candidature en cours de review';
        notifContent = `Votre candidature pour "${application.offer.title}" chez ${application.offer.company.company_name} est en cours de review.`;
        break;
      case ApplicationStatus.SHORTLISTED:
        notifType = NotificationType.ACCEPTED;
        notifTitle = 'Candidature présélectionnée !';
        notifContent = `Félicitations ! Votre candidature pour "${application.offer.title}" chez ${application.offer.company.company_name} a été présélectionnée.`;
        break;
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        notifType = NotificationType.INTERVIEW_SCHEDULED;
        notifTitle = 'Entretien à planifier';
        notifContent = `Un entretien sera bientôt planifié pour votre candidature "${application.offer.title}" chez ${application.offer.company.company_name}.`;
        break;
      case ApplicationStatus.ACCEPTEE:
        notifType = NotificationType.ACCEPTED;
        notifTitle = 'Candidature acceptée !';
        notifContent = `Félicitations ! Votre candidature pour "${application.offer.title}" chez ${application.offer.company.company_name} a été acceptée.`;
        break;
      case ApplicationStatus.REFUSEE:
        notifType = NotificationType.REFUSED;
        notifTitle = 'Candidature refusée';
        notifContent = `Votre candidature pour "${application.offer.title}" chez ${application.offer.company.company_name} a été refusée.`;
        break;
      default:
        notifType = NotificationType.NEW_APPLICATION;
        notifTitle = 'Mise à jour de candidature';
        notifContent = `Le statut de votre candidature pour "${application.offer.title}" a été mis à jour.`;
    }

    await this.prisma.notification.create({
      data: {
        title: notifTitle,
        content: notifContent,
        type: notifType,
        id_user: application.student.id_user,
      },
    });

    if (status === ApplicationStatus.ACCEPTEE) {
      await this.conversationService.findOrCreate({
        id_student: application.id_student,
        id_company: application.offer.id_company,
        id_offer: application.id_offer,
      });
    }

    return updated;
  }

  async updateNotes(id_application: number, notes: string) {
    const application = await this.prisma.application.findUnique({
      where: { id_application },
    });

    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.application.update({
      where: { id_application },
      data: { notes },
    });
  }

  async remove(id_application: number) {
    return this.prisma.application.delete({
      where: { id_application },
    });
  }
}
