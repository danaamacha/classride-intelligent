import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTripDto, ownerPhone: string) {
    // Verify bus belongs to owner
    const bus = await this.prisma.bus.findFirst({
      where: { busId: dto.busId, ownerPhone },
    });
    if (!bus) throw new NotFoundException('Bus not found or not authorized');

    // Verify driver belongs to owner
    const driver = await this.prisma.driver.findFirst({
      where: { phoneNumber: dto.driverPhone, ownerPhone },
    });
    if (!driver) throw new NotFoundException('Driver not found or not authorized');

    // Verify destination belongs to owner
    const destination = await this.prisma.destination.findFirst({
      where: { destinationId: dto.destinationId, ownerPhone },
    });
    if (!destination) throw new NotFoundException('Destination not found or not authorized');

    return this.prisma.trip.create({
      data: {
        busId: dto.busId,
        driverPhone: dto.driverPhone,
        destinationId: dto.destinationId,
        pickupTime: dto.pickupTime,
        dropoffTime: dto.dropoffTime,
        type: dto.type,
date: new Date(dto.date + 'T00:00:00.000Z'),        status: 'scheduled',
      },
      include: {
        bus: true,
        destination: true,
      },
    });
  }

  async findAll(ownerPhone: string) {
    return this.prisma.trip.findMany({
      where: {
        destination: { ownerPhone },
      },
      include: {
        bus: true,
        driver: {
          select: { fullName: true, phoneNumber: true },
        },
        destination: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tripId: number, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        tripId,
        destination: { ownerPhone },
      },
      include: {
        bus: true,
        driver: {
          select: { fullName: true, phoneNumber: true },
        },
        destination: true,
        assignments: {
          include: {
            student: {
              include: {
                user: {
                  select: { fullName: true, phoneNumber: true },
                },
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

  async updateStatus(tripId: number, status: string, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

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

    // Delete assignments first
    await this.prisma.studentAssignment.deleteMany({ where: { tripId } });
    await this.prisma.payment.deleteMany({ where: { tripId } });
    await this.prisma.trip.delete({ where: { tripId } });

    return { message: 'Trip deleted successfully' };
  }

  async assignStudent(tripId: number, studentPhone: string, ownerPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, destination: { ownerPhone } },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    return this.prisma.studentAssignment.create({
      data: { tripId, studentPhone },
    });
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