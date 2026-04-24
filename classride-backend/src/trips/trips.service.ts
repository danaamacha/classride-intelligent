import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateTripDto, ownerPhone: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { busId: dto.busId, ownerPhone },
    });
    if (!bus) throw new NotFoundException('Bus not found or not authorized');

    const driver = await this.prisma.driver.findFirst({
      where: { phoneNumber: dto.driverPhone, ownerPhone },
    });
    if (!driver) throw new NotFoundException('Driver not found or not authorized');

    const destination = await this.prisma.destination.findFirst({
      where: { destinationId: dto.destinationId, ownerPhone },
    });
    if (!destination) throw new NotFoundException('Destination not found or not authorized');

    const trip = await this.prisma.trip.create({
      data: {
        busId: dto.busId,
        driverPhone: dto.driverPhone,
        destinationId: dto.destinationId,
        pickupTime: dto.pickupTime,
        dropoffTime: dto.dropoffTime,
        type: dto.type,
        date: new Date(dto.date + 'T00:00:00.000Z'),
        status: 'scheduled',
      },
      include: {
        bus: true,
        destination: true,
      },
    });

    // ── Notify driver on trip assignment ──
    await this.notifications.create({
      userPhone: dto.driverPhone,
      title: '🚌 New Trip Assigned',
      body: `You have a new ${dto.type} trip to ${destination.name} on ${dto.date} at ${dto.pickupTime}`,
      type: 'trip',
    });

    return trip;
  }

  async findAll(ownerPhone: string) {
    return this.prisma.trip.findMany({
      where: { destination: { ownerPhone } },
      include: {
        bus: true,
        driver: { select: { fullName: true, phoneNumber: true } },
        destination: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tripId: number, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
      include: {
        bus: true,
        driver: { select: { fullName: true, phoneNumber: true } },
        destination: true,
        assignments: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, phoneNumber: true } },
                balances: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  // ── Feature 3: Edit trip ──
  async update(tripId: number, dto: Partial<CreateTripDto>, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    // If driver changed → notify new driver
    if (dto.driverPhone && dto.driverPhone !== trip.driverPhone) {
      const destination = await this.prisma.destination.findUnique({
        where: { destinationId: trip.destinationId ?? undefined },
      });
      await this.notifications.create({
        userPhone: dto.driverPhone,
        title: '🚌 Trip Assigned to You',
        body: `You have been assigned a trip to ${destination?.name} on ${dto.date ?? trip.date}`,
        type: 'trip',
      });
    }

    return this.prisma.trip.update({
      where: { tripId },
      data: {
        ...(dto.busId && { busId: dto.busId }),
        ...(dto.driverPhone && { driverPhone: dto.driverPhone }),
        ...(dto.pickupTime && { pickupTime: dto.pickupTime }),
        ...(dto.dropoffTime && { dropoffTime: dto.dropoffTime }),
        ...(dto.type && { type: dto.type }),
        ...(dto.date && { date: new Date(dto.date + 'T00:00:00.000Z') }),
      },
      include: { bus: true, destination: true },
    });
  }

  async updateStatus(tripId: number, status: string, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    // ── Notify students when trip goes active ──
    if (status === 'active') {
      const assignments = await this.prisma.studentAssignment.findMany({
        where: { tripId },
      });
      const destination = await this.prisma.destination.findUnique({
        where: { destinationId: trip.destinationId ?? undefined },
      });
      for (const a of assignments) {
        await this.notifications.create({
          userPhone: a.studentPhone,
          title: '🚌 Your Bus is On The Way!',
          body: `Your ${trip.type} trip to ${destination?.name} has started`,
          type: 'trip',
        });
      }
    }

    // ── Notify owner when trip completes ──
    if (status === 'completed') {
      const destination = await this.prisma.destination.findUnique({
        where: { destinationId: trip.destinationId ?? undefined },
        include: { owner: { select: { phoneNumber: true } } },
      });
      if (destination?.ownerPhone) {
        await this.notifications.create({
          userPhone: destination.ownerPhone,
          title: '✅ Trip Completed',
          body: `${trip.type} trip to ${destination.name} has been completed`,
          type: 'trip',
        });
      }
    }

    return this.prisma.trip.update({
      where: { tripId },
      data: { status: status as any },
    });
  }

  async remove(tripId: number, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    await this.prisma.studentAssignment.deleteMany({ where: { tripId } });
    await this.prisma.payment.deleteMany({ where: { tripId } });
    await this.prisma.balanceTransaction.deleteMany({ where: { tripId } });
    await this.prisma.trip.delete({ where: { tripId } });

    return { message: 'Trip deleted successfully' };
  }

  async assignStudent(tripId: number, studentPhone: string, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    const result = await this.prisma.studentAssignment.create({
      data: { tripId, studentPhone },
    });

    // ── Notify student when assigned to trip ──
    const destination = await this.prisma.destination.findUnique({
      where: { destinationId: trip.destinationId ?? undefined },
    });
    const dateStr = trip.date ? new Date(trip.date).toLocaleDateString() : '';
    await this.notifications.create({
      userPhone: studentPhone,
      title: '🎉 Assigned to a Trip!',
      body: `You've been assigned to a ${trip.type} trip to ${destination?.name} on ${dateStr}`,
      type: 'trip',
    });

    return result;
  }

  async unassignStudent(tripId: number, studentPhone: string, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    await this.prisma.studentAssignment.deleteMany({
      where: { tripId, studentPhone },
    });

    return { message: 'Student unassigned successfully' };
  }
}