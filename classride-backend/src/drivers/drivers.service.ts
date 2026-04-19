import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDriverDto, ownerPhone: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    // Generate random password
    const generatedPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    if (existingUser) {
      // Update existing user to driver role
      await this.prisma.user.update({
        where: { phoneNumber: dto.phoneNumber },
        data: { role: 'driver', password: hashedPassword },
      });
    } else {
      // Create new user
      await this.prisma.user.create({
        data: {
          phoneNumber: dto.phoneNumber,
          fullName: dto.fullName,
          password: hashedPassword,
          role: 'driver',
        },
      });
    }

    // Create driver record
    const driver = await this.prisma.driver.upsert({
      where: { phoneNumber: dto.phoneNumber },
      update: { ownerPhone, homeTown: dto.homeTown },
      create: {
        phoneNumber: dto.phoneNumber,
        homeTown: dto.homeTown,
        ownerPhone,
      },
    });

    return {
      ...driver,
      generatedPassword, // Return so owner can share with driver
    };
  }

  async findAll(ownerPhone: string) {
    return this.prisma.driver.findMany({
      where: { ownerPhone },
      include: {
        user: {
          select: {
            fullName: true,
            phoneNumber: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(phoneNumber: string, ownerPhone: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { phoneNumber, ownerPhone },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found or not authorized');
    }

    await this.prisma.driver.delete({ where: { phoneNumber } });

    // Reset user role to pending
    await this.prisma.user.update({
      where: { phoneNumber },
      data: { role: 'pending' },
    });

    return { message: 'Driver removed successfully' };
  }

  async getAssignedTrips(driverPhone: string) {
    return this.prisma.trip.findMany({
      where: {
        driverPhone,
        status: { in: ['scheduled', 'active'] },
      },
      include: {
        bus: true,
        destination: true,
        assignments: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, phoneNumber: true } },
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { date: 'desc' },
    });
  }
async getCompletedTrips(driverPhone: string) {
  return this.prisma.trip.findMany({
    where: { driverPhone, status: 'completed' },
    include: {
      bus: true,
      destination: true,
      assignments: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, phoneNumber: true } },
            },
          },
        },
      },
      payments: true,
    },
    orderBy: { date: 'desc' },
  });
}
  async getActiveTrip(driverPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { driverPhone, status: 'active' },
      include: {
        bus: true,
        destination: true,
        assignments: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, phoneNumber: true } },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!trip) return { message: 'No active trip found' };
    return trip;
  }

  async activateTrip(tripId: number, driverPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, driverPhone },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    return this.prisma.trip.update({
      where: { tripId },
      data: { status: 'active' },
    });
  }

  async completeTrip(tripId: number, driverPhone: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { tripId, driverPhone },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    return this.prisma.trip.update({
      where: { tripId },
      data: { status: 'completed' },
    });
  }

  async updatePayment(dto: UpdatePaymentDto, driverPhone: string) {
    // Verify driver owns this trip
    const trip = await this.prisma.trip.findFirst({
      where: { tripId: dto.tripId, driverPhone },
    });

    if (!trip) throw new NotFoundException('Trip not found or not authorized');

    // Verify student is assigned to this trip
    const assignment = await this.prisma.studentAssignment.findFirst({
      where: { tripId: dto.tripId, studentPhone: dto.studentPhone },
    });

    if (!assignment) throw new NotFoundException('Student not assigned to this trip');

    // Upsert payment record
    return this.prisma.payment.upsert({
      where: {
        tripId_studentPhone: {
          tripId: dto.tripId,
          studentPhone: dto.studentPhone,
        },
      },
      update: { paid: dto.paid },
      create: {
        tripId: dto.tripId,
        studentPhone: dto.studentPhone,
        paid: dto.paid,
      },
    });
  }
}