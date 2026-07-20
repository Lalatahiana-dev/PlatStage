import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<number, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { student: { id_user: userId } },
            { company: { id_user: userId } },
          ],
        },
        select: { id_conversation: true },
      });

      for (const conv of conversations) {
        client.join(`conv:${conv.id_conversation}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    client.join(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    client.leave(`conv:${data.conversationId}`);
  }

  async broadcastMessage(message: {
    id_message: number;
    content: string;
    sent_at: Date;
    id_conversation: number;
    id_sender: number;
    sender: { id_user: number; nom: string; prenom: string };
  }) {
    this.server
      .to(`conv:${message.id_conversation}`)
      .emit('new-message', message);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id_conversation: message.id_conversation },
      select: {
        id_student: true,
        id_company: true,
        student: { select: { id_user: true } },
        company: { select: { id_user: true } },
        offer: { select: { title: true } },
      },
    });

    if (!conversation) return;

    const recipientId =
      message.id_sender === conversation.student.id_user
        ? conversation.company.id_user
        : conversation.student.id_user;

    const senderUser = await this.prisma.user.findUnique({
      where: { id_user: message.id_sender },
      select: { prenom: true, nom: true },
    });

    const unreadCount = await this.prisma.message.count({
      where: {
        id_conversation: message.id_conversation,
        id_sender: { not: recipientId },
        is_read: false,
      },
    });

    this.server.to(`user:${recipientId}`).emit('message-notification', {
      conversationId: message.id_conversation,
      unreadCount,
      sender: senderUser
        ? `${senderUser.prenom} ${senderUser.nom}`
        : 'Utilisateur',
      content: message.content,
      offerTitle: conversation.offer.title,
    });

    await this.prisma.notification.create({
      data: {
        title: 'Nouveau message',
        content: `${senderUser?.prenom ?? ''} ${senderUser?.nom ?? ''}: "${message.content.length > 60 ? message.content.slice(0, 60) + '...' : message.content}"`,
        type: NotificationType.NEW_MESSAGE,
        id_user: recipientId,
      },
    });
  }

  emitUnreadUpdate(userId: number, totalUnread: number) {
    this.server.to(`user:${userId}`).emit('unread-update', { total: totalUnread });
  }

  async joinUserRoom(client: Socket, userId: number) {
    client.join(`user:${userId}`);
  }
}
