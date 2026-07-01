import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async findByStudent(id_student: number) {
    return this.prisma.conversation.findMany({
      where: { id_student },
      orderBy: { updated_at: 'desc' },
      select: {
        id_conversation: true,
        created_at: true,
        updated_at: true,
        offer: {
          select: {
            id_offer: true,
            title: true,
          },
        },
        company: {
          select: {
            id_company: true,
            company_name: true,
            logo_url: true,
          },
        },
        messages: {
          orderBy: { sent_at: 'desc' },
          take: 1,
          select: {
            content: true,
            sent_at: true,
            is_read: true,
          },
        },
      },
    });
  }

  async findByCompany(id_company: number) {
    return this.prisma.conversation.findMany({
      where: { id_company },
      orderBy: { updated_at: 'desc' },
      select: {
        id_conversation: true,
        created_at: true,
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
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: { sent_at: 'desc' },
          take: 1,
          select: {
            content: true,
            sent_at: true,
            is_read: true,
          },
        },
      },
    });
  }

  async findOne(id_conversation: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id_conversation },
      select: {
        id_conversation: true,
        created_at: true,
        updated_at: true,
        offer: {
          select: {
            id_offer: true,
            title: true,
          },
        },
        company: {
          select: {
            id_company: true,
            company_name: true,
            logo_url: true,
          },
        },
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
        messages: {
          orderBy: { sent_at: 'asc' },
          select: {
            id_message: true,
            content: true,
            is_read: true,
            sent_at: true,
            sender: {
              select: {
                id_user: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async create(data: {
    id_student: number;
    id_company: number;
    id_offer: number;
  }) {
    return this.prisma.conversation.create({ data });
  }
}
