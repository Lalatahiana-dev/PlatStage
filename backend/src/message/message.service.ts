import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingGateway } from '../messaging/messaging.gateway';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    @Optional() private gateway?: MessagingGateway,
  ) {}

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
    const message = await this.prisma.message.create({
      data,
      select: {
        id_message: true,
        content: true,
        is_read: true,
        sent_at: true,
        id_conversation: true,
        id_sender: true,
        sender: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id_conversation: data.id_conversation },
      data: { updated_at: new Date() },
    });

    if (this.gateway) {
      await this.gateway.broadcastMessage(message);
    }

    return message;
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

  async getUnreadCount(id_user: number) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id_user },
      select: { id_student: true },
    });

    const company = await this.prisma.company.findUnique({
      where: { id_user },
      select: { id_company: true },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          studentProfile ? { id_student: studentProfile.id_student } : {},
          company ? { id_company: company.id_company } : {},
        ].filter((q) => Object.keys(q).length > 0),
      },
      select: { id_conversation: true },
    });

    let total = 0;
    for (const conv of conversations) {
      const count = await this.prisma.message.count({
        where: {
          id_conversation: conv.id_conversation,
          id_sender: { not: id_user },
          is_read: false,
        },
      });
      total += count;
    }

    return { total };
  }

  async getUnreadByConversation(id_user: number) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id_user },
      select: { id_student: true },
    });

    const company = await this.prisma.company.findUnique({
      where: { id_user },
      select: { id_company: true },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          studentProfile ? { id_student: studentProfile.id_student } : {},
          company ? { id_company: company.id_company } : {},
        ].filter((q) => Object.keys(q).length > 0),
      },
      select: { id_conversation: true },
    });

    const result: Record<number, number> = {};
    for (const conv of conversations) {
      result[conv.id_conversation] = await this.prisma.message.count({
        where: {
          id_conversation: conv.id_conversation,
          id_sender: { not: id_user },
          is_read: false,
        },
      });
    }

    return result;
  }

  async markConversationAsRead(id_conversation: number, id_user: number) {
    const result = await this.prisma.message.updateMany({
      where: {
        id_conversation,
        id_sender: { not: id_user },
        is_read: false,
      },
      data: { is_read: true },
    });

    if (this.gateway) {
      const totalUnread = await this.getUnreadCount(id_user);
      this.gateway.emitUnreadUpdate(id_user, totalUnread.total);
    }

    return result;
  }
}
