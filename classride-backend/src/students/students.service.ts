import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ConflictException } from '@nestjs/common';
import { JoinRequestDto } from './dto/join-request.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto, ownerPhone: string) {
    const generatedPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingUser) {
      await this.prisma.user.update({
        where: { phoneNumber: dto.phoneNumber },
        data: { role: 'student', password: hashedPassword },
      });
    } else {
      await this.prisma.user.create({
        data: {
          phoneNumber: dto.phoneNumber,
          fullName: dto.fullName,
          password: hashedPassword,
          role: 'student',
        },
      });
    }

    await this.prisma.student.upsert({
      where: { phoneNumber: dto.phoneNumber },
      update: {
        ownerPhone,
        destinationId: dto.destinationId,
        homeAddress: dto.homeAddress,
      },
      create: {
        phoneNumber: dto.phoneNumber,
        ownerPhone,
        destinationId: dto.destinationId,
        homeAddress: dto.homeAddress,
      },
    });

    return {
      phoneNumber: dto.phoneNumber,
      fullName: dto.fullName,
      generatedPassword,
      message: 'Student added successfully',
    };
  }

  async findAll(ownerPhone: string) {
    return this.prisma.student.findMany({
      where: { ownerPhone },
      include: {
        user: {
          select: {
            fullName: true,
            phoneNumber: true,
            role: true,
          },
        },
        destination: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });
  }

  async remove(phoneNumber: string, ownerPhone: string) {
    const student = await this.prisma.student.findFirst({
      where: { phoneNumber, ownerPhone },
    });

    if (!student) {
      throw new NotFoundException('Student not found or not authorized');
    }

    await this.prisma.student.delete({ where: { phoneNumber } });

    await this.prisma.user.update({
      where: { phoneNumber },
      data: { role: 'pending' },
    });

    return { message: 'Student removed successfully' };
  }
  // Student sends join request to owner
  async sendJoinRequest(dto: JoinRequestDto, studentPhone: string) {
    // Check owner exists
    const owner = await this.prisma.owner.findUnique({
      where: { phoneNumber: dto.ownerPhone },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check if request already exists
    const existing = await this.prisma.studentJoinRequest.findFirst({
      where: {
        ownerPhone: dto.ownerPhone,
        userPhone: studentPhone,
        status: 'pending',
      },
    });

    if (existing) {
      throw new ConflictException('Join request already sent');
    }

    return this.prisma.studentJoinRequest.create({
      data: {
        ownerPhone: dto.ownerPhone,
        userPhone: studentPhone,
        status: 'pending',
      },
    });
  }

  // Owner gets all pending join requests
  async getJoinRequests(ownerPhone: string) {
  const requests = await this.prisma.studentJoinRequest.findMany({
    where: { ownerPhone, status: 'pending' },
    orderBy: { reqDate: 'desc' },
  });

  // Get user details for each request
  const requestsWithDetails = await Promise.all(
    requests.map(async (req) => {
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: req.userPhone },
        select: { fullName: true, phoneNumber: true },
      });
      return { ...req, user };
    }),
  );

  return requestsWithDetails;
}

  // Owner accepts join request
  async acceptJoinRequest(studentPhone: string, ownerPhone: string) {
    const request = await this.prisma.studentJoinRequest.findFirst({
      where: { userPhone: studentPhone, ownerPhone, status: 'pending' },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    // Update request status
    await this.prisma.studentJoinRequest.update({
      where: { reqId: request.reqId },
      data: { status: 'accepted' },
    });

    // Update user role to student
    await this.prisma.user.update({
      where: { phoneNumber: studentPhone },
      data: { role: 'student' },
    });

    // Create student record
    await this.prisma.student.upsert({
      where: { phoneNumber: studentPhone },
      update: { ownerPhone },
      create: { phoneNumber: studentPhone, ownerPhone },
    });

    return { message: 'Student accepted successfully' };
  }

  // Owner rejects join request
  async rejectJoinRequest(studentPhone: string, ownerPhone: string) {
    const request = await this.prisma.studentJoinRequest.findFirst({
      where: { userPhone: studentPhone, ownerPhone, status: 'pending' },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    await this.prisma.studentJoinRequest.update({
      where: { reqId: request.reqId },
      data: { status: 'rejected' },
    });

    return { message: 'Join request rejected' };
  }
}