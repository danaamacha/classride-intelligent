import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(ownerPhone: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel for speed
    const [
      totalBuses,
      totalDrivers,
      totalStudents,
      pendingJoinRequests,
      unreadNotifications,
      todayTrips,
      recentNotifications,
      owner,
    ] = await Promise.all([
      this.prisma.bus.count({ where: { ownerPhone } }),
      this.prisma.driver.count({ where: { ownerPhone } }),
      this.prisma.student.count({ where: { ownerPhone } }),
      this.prisma.studentJoinRequest.count({
        where: { ownerPhone, status: 'pending' },
      }),
      this.prisma.notification.count({
        where: { userPhone: ownerPhone, isRead: false },
      }),
      this.prisma.trip.findMany({
        where: {
          destination: { ownerPhone },
          date: { gte: today, lt: tomorrow },
        },
        include: {
          bus: true,
          destination: true,
          driver: { select: { fullName: true, phoneNumber: true } },
          assignments: {
            include: {
              student: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.notification.findMany({
        where: { userPhone: ownerPhone },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.user.findUnique({
        where: { phoneNumber: ownerPhone },
        select: { fullName: true, phoneNumber: true },
      }),
    ]);

    return {
      owner,
      stats: {
        totalBuses,
        totalDrivers,
        totalStudents,
        pendingJoinRequests,
        unreadNotifications,
        todayTrips: todayTrips.length,
      },
      todayTrips,
      recentNotifications,
    };
  }
  async getOwnersList() {
  return this.prisma.owner.findMany({
    where: { status: 'accepted' },
    include: {
      user: {
        select: { fullName: true, phoneNumber: true },
      },
    },
  });
}
// ─── ADMIN ───────────────────────────────────

  async getPendingOwners() {
    return this.prisma.owner.findMany({
      where: { status: 'pending' },
      include: {
        user: { select: { fullName: true, phoneNumber: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveOwner(ownerPhone: string) {
    await this.prisma.owner.update({
      where: { phoneNumber: ownerPhone },
      data: { status: 'accepted' },
    });
    return { message: 'Owner approved' };
  }

  async rejectOwner(ownerPhone: string) {
    await this.prisma.owner.update({
      where: { phoneNumber: ownerPhone },
      data: { status: 'rejected' },
    });
    return { message: 'Owner rejected' };
  }

  async getAllOwners() {
    return this.prisma.owner.findMany({
      include: {
        user: { select: { fullName: true, phoneNumber: true, createdAt: true } },
        _count: {
          select: { students: true, drivers: true, buses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}