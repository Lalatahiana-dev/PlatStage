import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewType, InterviewStatus } from '@prisma/client';

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

  // ✅ MANAMPY ITY
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

  async create(data: {
    scheduled_at: Date;
    location?: string;
    type: InterviewType;
    id_application: number;
  }) {
    return this.prisma.interview.create({ data });
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
