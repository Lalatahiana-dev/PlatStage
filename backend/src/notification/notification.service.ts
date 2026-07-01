import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findByUser(id_user: number) {
    return this.prisma.notification.findMany({
      where: { id_user },
      orderBy: { created_at: 'desc' },
      select: {
        id_notification: true,
        title: true,
        content: true,
        type: true,
        is_read: true,
        created_at: true,
      },
    });
  }

  async create(data: {
    title?: string;
    content: string;
    type?: NotificationType;
    id_user: number;
  }) {
    return this.prisma.notification.create({ data });
  }

  async markAsRead(id_notification: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id_notification },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id_notification },
      data: { is_read: true },
    });
  }

  async markAllAsRead(id_user: number) {
    return this.prisma.notification.updateMany({
      where: { id_user, is_read: false },
      data: { is_read: true },
    });
  }

  async remove(id_notification: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id_notification },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.delete({
      where: { id_notification },
    });
  }
}
