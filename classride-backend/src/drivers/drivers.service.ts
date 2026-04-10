import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
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
}