import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Get all students with balances for a driver ───
  async getStudentsWithBalances(driverPhone: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { phoneNumber: driverPhone },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const students = await this.prisma.student.findMany({
      where: { ownerPhone: driver.ownerPhone },
      include: {
        user: { select: { fullName: true, phoneNumber: true } },
        destination: { select: { name: true } },
        balances: {
          where: { ownerPhone: driver.ownerPhone },
        },
      },
    });

    return students.map(s => ({
      phoneNumber: s.phoneNumber,
      fullName: s.user.fullName,
      homeAddress: s.homeAddress,
      destination: s.destination?.name,
      balance: s.balances[0]?.balance ?? 0,
    }));
  }

  // ─── Record payment + deduction for a trip ───
  async recordPayment(
    driverPhone: string,
    tripId: number,
    studentPhone: string,
    amountPaid: number,
    note?: string,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { phoneNumber: driverPhone },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const owner = await this.prisma.owner.findUnique({
      where: { phoneNumber: driver.ownerPhone },
    });
    const pricePerTrip = owner?.pricePerTrip ?? 0;
    const ownerPhone = driver.ownerPhone;

    // 1 — Record payment in payments table
    await this.prisma.payment.upsert({
      where: { tripId_studentPhone: { tripId, studentPhone } },
      update: { amountPaid, note },
      create: { tripId, studentPhone, amountPaid, note },
    });

    // 2 — Get or create student balance
    const existingBalance = await this.prisma.studentBalance.findUnique({
      where: { studentPhone_ownerPhone: { studentPhone, ownerPhone } },
    });

    const currentBalance = existingBalance?.balance ?? 0;

    // 3 — Calculate: add payment, deduct trip cost
    // amountPaid = 0 means "Later" — student attended but didn't pay
    // amountPaid = 300 means paid for this trip only
    // amountPaid = 500 means paid for morning + return (2 trips)
    const deduction = pricePerTrip; // 300,000 per trip
    const newBalance = currentBalance + amountPaid - deduction;

    // 4 — Update balance
    await this.prisma.studentBalance.upsert({
      where: { studentPhone_ownerPhone: { studentPhone, ownerPhone } },
      update: { balance: newBalance },
      create: { studentPhone, ownerPhone, balance: newBalance },
    });

    // 5 — Record transactions
    // Payment transaction (only if amount > 0)
    if (amountPaid > 0) {
      await this.prisma.balanceTransaction.create({
        data: {
          studentPhone,
          ownerPhone,
          amount: amountPaid,
          type: 'PAYMENT',
          tripId,
          note: note ?? 'Payment collected by driver',
        },
      });
    }

    // Deduction transaction
    await this.prisma.balanceTransaction.create({
      data: {
        studentPhone,
        ownerPhone,
        amount: -deduction,
        type: 'DEDUCTION',
        tripId,
        note: `Trip deduction`,
      },
    });

    // If 500 paid → also cover return trip of same day
    if (amountPaid >= (pricePerTrip * 2) - 50000) {
      // Find return trip same day same student
      const trip = await this.prisma.trip.findUnique({
        where: { tripId },
        select: { date: true, destinationId: true },
      });

      if (trip) {
        const returnTrip = await this.prisma.trip.findFirst({
          where: {
            date: trip.date,
            type: 'return',
            destinationId: trip.destinationId,
            assignments: { some: { studentPhone } },
          },
        });

        if (returnTrip) {
          await this.prisma.payment.upsert({
            where: {
              tripId_studentPhone: {
                tripId: returnTrip.tripId,
                studentPhone,
              },
            },
            update: { amountPaid: 0, note: 'Covered by morning payment' },
            create: {
              tripId: returnTrip.tripId,
              studentPhone,
              amountPaid: 0,
              note: 'Covered by morning payment',
            },
          });

          // Deduct return trip too
          const balanceAfterReturn = newBalance - deduction;
          await this.prisma.studentBalance.update({
            where: { studentPhone_ownerPhone: { studentPhone, ownerPhone } },
            data: { balance: balanceAfterReturn },
          });

          await this.prisma.balanceTransaction.create({
            data: {
              studentPhone,
              ownerPhone,
              amount: -deduction,
              type: 'DEDUCTION',
              tripId: returnTrip.tripId,
              note: 'Return trip deduction (covered by morning payment)',
            },
          });
        }
      }
    }

    // 6 — Notify student
    const finalBalance = await this.prisma.studentBalance.findUnique({
      where: { studentPhone_ownerPhone: { studentPhone, ownerPhone } },
    });

    await this.notifications.create({
      userPhone: studentPhone,
      title: amountPaid > 0 ? '💰 Payment Recorded' : '⏰ Payment Pending',
      body: amountPaid > 0
        ? `Driver recorded ${amountPaid.toLocaleString()} LBP. Balance: ${finalBalance?.balance.toLocaleString()} LBP`
        : `Your trip was recorded. Balance: ${finalBalance?.balance.toLocaleString()} LBP`,
      type: 'payment',
    });

    return {
      message: 'Payment recorded',
      balance: finalBalance?.balance ?? 0,
    };
  }

  // ─── Get student balance + full transaction history ───
  async getStudentBalance(studentPhone: string, ownerPhone: string) {
    const balance = await this.prisma.studentBalance.findUnique({
      where: { studentPhone_ownerPhone: { studentPhone, ownerPhone } },
    });

    const transactions = await this.prisma.balanceTransaction.findMany({
      where: { studentPhone, ownerPhone },
      orderBy: { createdAt: 'desc' },
      include: {
        trip: {
          select: {
            date: true,
            type: true,
            destination: { select: { name: true } },
          },
        },
      },
    });

    return {
      balance: balance?.balance ?? 0,
      transactions,
    };
  }

  // ─── Get student balance for student view ───
  async getMyBalance(studentPhone: string) {
    const student = await this.prisma.student.findUnique({
      where: { phoneNumber: studentPhone },
    });

    if (!student?.ownerPhone) {
      return { balance: 0, transactions: [] };
    }

    return this.getStudentBalance(studentPhone, student.ownerPhone);
  }

  // ─── Get trip payments (for driver trip screen) ───
  async getTripPayments(tripId: number) {
    return this.prisma.payment.findMany({
      where: { tripId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
            balances: true,
          },
        },
      },
    });
  }

  // ─── Owner sets price per trip ───
  async setPricePerTrip(ownerPhone: string, pricePerTrip: number) {
    await this.prisma.owner.update({
      where: { phoneNumber: ownerPhone },
      data: { pricePerTrip },
    });
    return { message: 'Price updated', pricePerTrip };
  }

  // ─── Get price per trip ───
  async getPricePerTrip(ownerPhone: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { phoneNumber: ownerPhone },
      select: { pricePerTrip: true },
    });
    return { pricePerTrip: owner?.pricePerTrip ?? 0 };
  }
}