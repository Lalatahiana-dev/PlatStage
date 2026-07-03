import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewType, InterviewStatus, Prisma } from '@prisma/client';

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
        application: {
          select: {
            id_application: true,
            motivation: true,
            student: {
              select: {
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
        application: {
          select: {
            id_application: true,
            motivation: true,
            student: {
              select: {
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
  }

  async create(data: {
    scheduled_at: Date;
    location?: string;
    type: InterviewType;
    id_application: number;
  }) {
    try {
      return await this.prisma.interview.create({ data });
    } catch (e) {
      // P2002 = Unique constraint failed — efa misy interview ho an'ity application ity
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
