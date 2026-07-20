import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InterviewType,
  InterviewStatus,
  ApplicationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

@Injectable()
export class InterviewService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.interview.findMany({
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
        created_at: true,
        updated_at: true,
        application: {
          select: {
            id_application: true,
            motivation: true,
            notes: true,
            student: {
              select: {
                id_student: true,
                photo_url: true,
                university: true,
                level: true,
                phone: true,
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
                title: true,
                company: {
                  select: {
                    company_name: true,
                    logo_url: true,
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
            },
          },
        },
      },
    });
  }

  async findOne(id_interview: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id_interview },
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
        created_at: true,
        updated_at: true,
        application: {
          select: {
            id_application: true,
            motivation: true,
            notes: true,
            student: {
              select: {
                id_student: true,
                university: true,
                level: true,
                cv_url: true,
                photo_url: true,
                phone: true,
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
                title: true,
                company: {
                  select: {
                    company_name: true,
                    logo_url: true,
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
            },
          },
        },
      },
    });

    if (!interview) throw new NotFoundException('Interview not found');
    return interview;
  }

  async findByApplication(id_application: number) {
    return this.prisma.interview.findFirst({
      where: { id_application },
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
        created_at: true,
        application: {
          select: {
            id_application: true,
            offer: {
              select: {
                title: true,
                company: {
                  select: { company_name: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByCompany(id_company: number) {
    return this.prisma.interview.findMany({
      where: {
        application: {
          offer: {
            id_company,
          },
        },
      },
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
        created_at: true,
        application: {
          select: {
            id_application: true,
            offer: {
              select: {
                title: true,
                company: { select: { company_name: true } },
              },
            },
            student: {
              select: {
                id_student: true,
                photo_url: true,
                university: true,
                level: true,
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
                      select: { id_skill: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduled_at: 'desc' },
    });
  }

  async findByStudent(id_student: number) {
    return this.prisma.interview.findMany({
      where: {
        application: {
          id_student,
        },
      },
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
        created_at: true,
        application: {
          select: {
            id_application: true,
            offer: {
              select: {
                title: true,
                company: { select: { company_name: true, logo_url: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduled_at: 'desc' },
    });
  }

  async create(data: {
    scheduled_at: Date;
    location?: string;
    type: InterviewType;
    id_application: number;
  }) {
    try {
      const created = await this.prisma.interview.create({ data });

      await this.prisma.application.update({
        where: { id_application: data.id_application },
        data: { status: ApplicationStatus.INTERVIEW_SCHEDULED },
      });

      const application = await this.prisma.application.findUnique({
        where: { id_application: data.id_application },
        include: {
          student: { include: { user: true } },
          offer: { include: { company: true } },
        },
      });

      if (application) {
        await this.prisma.notification.create({
          data: {
            title: 'Entretien planifié !',
            content: `Un entretien ${data.type === 'ONLINE' ? 'en ligne' : 'sur site'} a été planifié pour votre candidature "${application.offer.title}" chez ${application.offer.company.company_name}.`,
            type: NotificationType.INTERVIEW_SCHEDULED,
            id_user: application.student.id_user,
          },
        });
      }

      const interview = await this.prisma.interview.findUnique({
        where: { id_interview: created.id_interview },
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
          created_at: true,
          application: {
            select: {
              id_application: true,
              offer: {
                select: {
                  title: true,
                  company: { select: { company_name: true } },
                },
              },
              student: {
                select: {
                  user: {
                    select: { nom: true, prenom: true, email: true },
                  },
                },
              },
            },
          },
        },
      });

      return interview;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un entretien existe déjà pour cette candidature',
        );
      }
      throw e;
    }
  }

  async update(
    id_interview: number,
    data: {
      scheduled_at?: Date;
      location?: string;
      type?: InterviewType;
      status?: InterviewStatus;
    },
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id_interview },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id_interview },
      data,
    });
  }

  async complete(id_interview: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id_interview },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id_interview },
      data: {
        status: InterviewStatus.CONFIRMED,
        completed_at: new Date(),
      },
    });
  }

  async addFeedback(
    id_interview: number,
    data: {
      rating?: number;
      strengths?: string;
      weaknesses?: string;
      feedback_notes?: string;
      final_decision?: string;
    },
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id_interview },
      include: {
        application: {
          include: {
            student: { include: { user: true } },
            offer: { include: { company: true } },
          },
        },
      },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    const updated = await this.prisma.interview.update({
      where: { id_interview },
      data,
    });

    if (data.rating) {
      await this.prisma.notification.create({
        data: {
          title: 'Feedback d\'entretien disponible',
          content: `Le company ${interview.application.offer.company.company_name} a laissé un feedback pour votre entretien "${interview.application.offer.title}".`,
          type: NotificationType.NEW_APPLICATION,
          id_user: interview.application.student.id_user,
        },
      });
    }

    return updated;
  }

  async remove(id_interview: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id_interview },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.delete({
      where: { id_interview },
    });
  }
}
