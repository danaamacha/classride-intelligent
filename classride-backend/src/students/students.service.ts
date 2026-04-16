import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─────────────────────────────────────────
  // OWNER — CRUD
  // ─────────────────────────────────────────

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
          select: { fullName: true, phoneNumber: true, role: true },
        },
        destination: {
          select: { name: true, location: true },
        },
      },
    });
  }

  async remove(phoneNumber: string, ownerPhone: string) {
  const student = await this.prisma.student.findFirst({
    where: { phoneNumber, ownerPhone },
  });

  if (!student) throw new NotFoundException('Student not found or not authorized');

  // Delete related records first
  await this.prisma.studentWeeklySchedule.deleteMany({ where: { studentPhone: phoneNumber } });
  await this.prisma.studentScheduleOverride.deleteMany({ where: { studentPhone: phoneNumber } });
  await this.prisma.studentAssignment.deleteMany({ where: { studentPhone: phoneNumber } });
  await this.prisma.payment.deleteMany({ where: { studentPhone: phoneNumber } });

  await this.prisma.student.delete({ where: { phoneNumber } });

  await this.prisma.user.update({
    where: { phoneNumber },
    data: { role: 'pending' },
  });

  return { message: 'Student removed successfully' };
}
  // ─────────────────────────────────────────
  // JOIN REQUESTS
  // ─────────────────────────────────────────
async sendJoinRequest(dto: JoinRequestDto, studentPhone: string) {
  const owner = await this.prisma.owner.findUnique({
    where: { phoneNumber: dto.ownerPhone },
  });

  if (!owner) throw new NotFoundException('Owner not found');

  const existing = await this.prisma.studentJoinRequest.findFirst({
    where: { ownerPhone: dto.ownerPhone, userPhone: studentPhone, status: 'pending' },
  });

  if (existing) throw new ConflictException('Join request already sent');

  const student = await this.prisma.user.findUnique({
    where: { phoneNumber: studentPhone },
    select: { fullName: true },
  });

  // Get or create destination
  let destination = await this.prisma.destination.findFirst({
    where: { name: { equals: dto.university, mode: 'insensitive' } },
  });

  if (!destination) {
    destination = await this.prisma.destination.create({
      data: { name: dto.university },
    });
  }

  // Create or update student record with home address + destination
  await this.prisma.student.upsert({
  where: { phoneNumber: studentPhone },
  update: {
    homeAddress: dto.homeAddress,
    destinationId: destination.destinationId,
    // ❌ Don't set ownerPhone yet — only after acceptance
  },
  create: {
    phoneNumber: studentPhone,
    homeAddress: dto.homeAddress,
    destinationId: destination.destinationId,
    // ❌ No ownerPhone
  },
});

  // Clear existing schedule and save new one
  await this.prisma.studentWeeklySchedule.deleteMany({
    where: { studentPhone },
  });

  for (const entry of dto.schedule) {
    await this.prisma.studentWeeklySchedule.create({
      data: {
        studentPhone,
        dayOfWeek: entry.day_of_week,
        morningTime: entry.morning_time,
        returnTime: entry.return_time,
        attendanceMorning: true,
        attendanceReturn: true,
      },
    });
  }

  // Create join request
  const request = await this.prisma.studentJoinRequest.create({
    data: {
      ownerPhone: dto.ownerPhone,
      userPhone: studentPhone,
      status: 'pending',
    },
  });

  // Notify owner with student details
  await this.notifications.create({
    userPhone: dto.ownerPhone,
    title: '📥 New Join Request',
    body: `${student?.fullName} from ${dto.homeAddress} wants to join your bus to ${dto.university}`,
    type: 'join_request',
  });

  return { message: '🎉 Join request sent successfully!' };
}

  async getJoinRequests(ownerPhone: string) {
  const requests = await this.prisma.studentJoinRequest.findMany({
    where: { ownerPhone, status: 'pending' },
    orderBy: { reqDate: 'desc' },
  });

  const requestsWithDetails = await Promise.all(
    requests.map(async (req) => {
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: req.userPhone },
        select: { fullName: true, phoneNumber: true },
      });
      const student = await this.prisma.student.findUnique({
        where: { phoneNumber: req.userPhone },
        include: {
          destination: { select: { name: true } },
        },
      });
      const schedule = await this.prisma.studentWeeklySchedule.findMany({
        where: { studentPhone: req.userPhone },
        orderBy: { dayOfWeek: 'asc' },
      });
      return { ...req, user, student, schedule };
    }),
  );

  return requestsWithDetails;
}
  async acceptJoinRequest(studentPhone: string, ownerPhone: string) {
    const request = await this.prisma.studentJoinRequest.findFirst({
      where: { userPhone: studentPhone, ownerPhone, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Join request not found');

    await this.prisma.studentJoinRequest.update({
      where: { reqId: request.reqId },
      data: { status: 'accepted' },
    });

    await this.prisma.user.update({
      where: { phoneNumber: studentPhone },
      data: { role: 'student' },
    });

    await this.prisma.student.upsert({
      where: { phoneNumber: studentPhone },
      update: { ownerPhone },
      create: { phoneNumber: studentPhone, ownerPhone },
    });

    await this.notifications.create({
      userPhone: studentPhone,
      title: '🎉 Request Accepted!',
      body: 'Your join request has been accepted. Welcome aboard!',
      type: 'join_request',
    });

    return { message: 'Student accepted successfully' };
  }

  async rejectJoinRequest(studentPhone: string, ownerPhone: string) {
    const request = await this.prisma.studentJoinRequest.findFirst({
      where: { userPhone: studentPhone, ownerPhone, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Join request not found');

    await this.prisma.studentJoinRequest.update({
      where: { reqId: request.reqId },
      data: { status: 'rejected' },
    });

    await this.notifications.create({
      userPhone: studentPhone,
      title: '❌ Request Rejected',
      body: 'Your join request was rejected. You may try another bus owner.',
      type: 'join_request',
    });

    return { message: 'Join request rejected' };
  }

  // ─────────────────────────────────────────
  // STUDENT — TRIPS
  // ─────────────────────────────────────────

  async getAssignedTrips(studentPhone: string) {
    return this.prisma.studentAssignment.findMany({
      where: { studentPhone },
      include: {
        trip: {
          include: {
            bus: true,
            destination: true,
            driver: { select: { fullName: true, phoneNumber: true } },
          },
        },
      },
      orderBy: { trip: { date: 'desc' } },
    });
  }

  async getActiveTrip(studentPhone: string) {
    const assignment = await this.prisma.studentAssignment.findFirst({
      where: { studentPhone, trip: { status: 'active' } },
      include: {
        trip: {
          include: {
            bus: true,
            destination: true,
            driver: { select: { fullName: true, phoneNumber: true } },
          },
        },
      },
    });

    if (!assignment) return { message: 'No active trip found' };
    return assignment.trip;
  }

  // ─────────────────────────────────────────
  // STUDENT — PROFILE
  // ─────────────────────────────────────────

  async updateProfile(studentPhone: string, homeAddress: string) {
    await this.prisma.student.upsert({
      where: { phoneNumber: studentPhone },
      update: { homeAddress },
      create: { phoneNumber: studentPhone, homeAddress },
    });
    return { message: 'Profile updated successfully' };
  }

  // ─────────────────────────────────────────
  // STUDENT — WEEKLY SCHEDULE
  // ─────────────────────────────────────────

  async getWeeklySchedule(studentPhone: string) {
    return this.prisma.studentWeeklySchedule.findMany({
      where: { studentPhone },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async saveWeeklySchedule(studentPhone: string, dto: any) {
    const result = await this.prisma.studentWeeklySchedule.upsert({
      where: {
        studentPhone_dayOfWeek: {
          studentPhone,
          dayOfWeek: dto.day_of_week,
        },
      },
      update: {
        morningTime: dto.morning_time,
        returnTime: dto.return_time,
        attendanceMorning: dto.attendance_morning,
        attendanceReturn: dto.attendance_return,
      },
      create: {
        studentPhone,
        dayOfWeek: dto.day_of_week,
        morningTime: dto.morning_time,
        returnTime: dto.return_time,
        attendanceMorning: dto.attendance_morning,
        attendanceReturn: dto.attendance_return,
      },
    });

    // Notify owner about schedule update
    const ownerPhone = await this.getOwnerPhone(studentPhone);
    if (ownerPhone) {
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: studentPhone },
        select: { fullName: true },
      });
      await this.notifications.create({
        userPhone: ownerPhone,
        title: '📅 Schedule Update',
        body: `${user?.fullName} updated their weekly schedule`,
        type: 'info',
      });
    }

    return result;
  }

  async deleteWeeklyScheduleDay(studentPhone: string, dayOfWeek: number) {
    await this.prisma.studentWeeklySchedule.delete({
      where: { studentPhone_dayOfWeek: { studentPhone, dayOfWeek } },
    });
    return { message: 'Schedule day deleted' };
  }

  // ─────────────────────────────────────────
  // STUDENT — ATTENDANCE (SMART LOGIC)
  // ─────────────────────────────────────────

  async getAttendance(studentPhone: string) {
    const dayMap: { [key: number]: number } = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekdayToday = dayMap[today.getDay()];
    const weekdayTomorrow = dayMap[tomorrow.getDay()];

    const [todayOverride, tomorrowOverride, weeklyToday, weeklyTomorrow] =
      await Promise.all([
        this.prisma.studentScheduleOverride.findUnique({
          where: { studentPhone_date: { studentPhone, date: new Date(todayStr) } },
        }),
        this.prisma.studentScheduleOverride.findUnique({
          where: { studentPhone_date: { studentPhone, date: new Date(tomorrowStr) } },
        }),
        this.prisma.studentWeeklySchedule.findUnique({
          where: { studentPhone_dayOfWeek: { studentPhone, dayOfWeek: weekdayToday } },
        }),
        this.prisma.studentWeeklySchedule.findUnique({
          where: { studentPhone_dayOfWeek: { studentPhone, dayOfWeek: weekdayTomorrow } },
        }),
      ]);

    return {
      today: {
        date: todayStr,
        morningTime: todayOverride?.overrideMorningTime ?? weeklyToday?.morningTime ?? null,
        returnTime: todayOverride?.overrideReturnTime ?? weeklyToday?.returnTime ?? null,
        attendanceMorning: todayOverride?.attendanceMorning ?? weeklyToday?.attendanceMorning ?? false,
        attendanceReturn: todayOverride?.attendanceReturn ?? weeklyToday?.attendanceReturn ?? false,
        source: todayOverride ? 'override' : 'weekly',
      },
      tomorrow: {
        date: tomorrowStr,
        morningTime: tomorrowOverride?.overrideMorningTime ?? weeklyTomorrow?.morningTime ?? null,
        returnTime: tomorrowOverride?.overrideReturnTime ?? weeklyTomorrow?.returnTime ?? null,
        attendanceMorning: tomorrowOverride?.attendanceMorning ?? weeklyTomorrow?.attendanceMorning ?? false,
        attendanceReturn: tomorrowOverride?.attendanceReturn ?? weeklyTomorrow?.attendanceReturn ?? false,
        source: tomorrowOverride ? 'override' : 'weekly',
      },
    };
  }

  async updateAttendance(dto: UpdateAttendanceDto, studentPhone: string) {
    const dayMap: { [key: number]: number } = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    const weekday = new Date(dto.date).getDay();
    const mappedDay = dayMap[weekday];

    const [override, weekly] = await Promise.all([
      this.prisma.studentScheduleOverride.findUnique({
        where: { studentPhone_date: { studentPhone, date: new Date(dto.date) } },
      }),
      this.prisma.studentWeeklySchedule.findUnique({
        where: { studentPhone_dayOfWeek: { studentPhone, dayOfWeek: mappedDay } },
      }),
    ]);

    const morningTime = override?.overrideMorningTime ?? weekly?.morningTime;
    const returnTime = override?.overrideReturnTime ?? weekly?.returnTime;

    // If new values match weekly — delete override (smart cleanup)
    const matchesWeekly =
      dto.attendanceMorning === weekly?.attendanceMorning &&
      dto.attendanceReturn === weekly?.attendanceReturn;

    if (matchesWeekly && override) {
      await this.prisma.studentScheduleOverride.delete({
        where: { studentPhone_date: { studentPhone, date: new Date(dto.date) } },
      });
    } else if (override) {
      await this.prisma.studentScheduleOverride.update({
        where: { studentPhone_date: { studentPhone, date: new Date(dto.date) } },
        data: {
          attendanceMorning: dto.attendanceMorning,
          attendanceReturn: dto.attendanceReturn,
        },
      });
    } else {
      await this.prisma.studentScheduleOverride.create({
        data: {
          studentPhone,
          date: new Date(dto.date),
          overrideMorningTime: morningTime,
          overrideReturnTime: returnTime,
          attendanceMorning: dto.attendanceMorning,
          attendanceReturn: dto.attendanceReturn,
        },
      });
    }

    // Auto-remove from trip + notify owner if marking absent for today/tomorrow
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const ownerPhone = await this.getOwnerPhone(studentPhone);
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: studentPhone },
      select: { fullName: true },
    });

    if (dto.date === today || dto.date === tomorrow) {
      if (!dto.attendanceMorning) {
        await this.removeStudentFromTrip(studentPhone, dto.date, 'morning');
        if (ownerPhone) {
          await this.notifications.create({
            userPhone: ownerPhone,
            title: '📅 Attendance Update',
            body: `${user?.fullName} marked absent for morning on ${dto.date}`,
            type: 'attendance',
          });
        }
      }
      if (!dto.attendanceReturn) {
        await this.removeStudentFromTrip(studentPhone, dto.date, 'return');
        if (ownerPhone) {
          await this.notifications.create({
            userPhone: ownerPhone,
            title: '📅 Attendance Update',
            body: `${user?.fullName} marked absent for return on ${dto.date}`,
            type: 'attendance',
          });
        }
      }
    }

    return this.getAttendance(studentPhone);
  }

  // ─────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────

  private async removeStudentFromTrip(studentPhone: string, date: string, type: string) {
    const trips = await this.prisma.trip.findMany({
      where: { date: new Date(date + 'T00:00:00.000Z'), type: type as any },
    });

    for (const trip of trips) {
      await this.prisma.studentAssignment.deleteMany({
        where: { tripId: trip.tripId, studentPhone },
      });
    }
  }

  private async getOwnerPhone(studentPhone: string): Promise<string> {
    const student = await this.prisma.student.findUnique({
      where: { phoneNumber: studentPhone },
    });
    return student?.ownerPhone ?? '';
  }
}