import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotificationDto {
  userPhone: string;
  title: string;
  body: string;
  type: string;
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userPhone: dto.userPhone,
        title: dto.title,
        body: dto.body,
        type: dto.type,
        metadata: dto.metadata,
        isRead: false,
      },
    });
  }

  async getUnread(userPhone: string) {
    return this.prisma.notification.findMany({
      where: { userPhone, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAll(userPhone: string) {
    return this.prisma.notification.findMany({
      where: { userPhone },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: number, userPhone: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userPhone },
    });

    if (!notification) return { message: 'Notification not found' };

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userPhone: string) {
    await this.prisma.notification.updateMany({
      where: { userPhone, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userPhone: string) {
    const count = await this.prisma.notification.count({
      where: { userPhone, isRead: false },
    });
    return { count };
  }
}