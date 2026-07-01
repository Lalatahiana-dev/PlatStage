import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async findByConversation(id_conversation: number) {
    return this.prisma.message.findMany({
      where: { id_conversation },
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
    });
  }

  async send(data: {
    content: string;
    id_conversation: number;
    id_sender: number;
  }) {
    return this.prisma.message.create({ data });
  }

  async markAsRead(id_message: number) {
    const message = await this.prisma.message.findUnique({
      where: { id_message },
    });

    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.update({
      where: { id_message },
      data: { is_read: true },
    });
  }

  async remove(id_message: number) {
    const message = await this.prisma.message.findUnique({
      where: { id_message },
    });

    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.delete({
      where: { id_message },
    });
  }
}
