import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Driver routes ───
  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Get('students')
  getStudentsWithBalances(@Req() req: any) {
    return this.paymentsService.getStudentsWithBalances(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Post('record')
  recordPayment(
    @Body() body: {
      tripId: number;
      studentPhone: string;
      amountPaid: number;
      note?: string;
    },
    @Req() req: any,
  ) {
    return this.paymentsService.recordPayment(
      req.user.phoneNumber,
      body.tripId,
      body.studentPhone,
      body.amountPaid,
      body.note,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Get('trip/:tripId')
  getTripPayments(@Param('tripId') tripId: string) {
    return this.paymentsService.getTripPayments(parseInt(tripId));
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Get('student/:studentPhone')
  getStudentBalance(
    @Param('studentPhone') studentPhone: string,
    @Req() req: any,
  ) {
    return this.paymentsService.getStudentsWithBalances(req.user.phoneNumber)
      .then(students => {
        const student = students.find(s => s.phoneNumber === studentPhone);
        if (!student) throw new Error('Student not found');
        return student;
      });
  }

  // ─── Student routes ───
  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Get('my/balance')
  getMyBalance(@Req() req: any) {
    return this.paymentsService.getMyBalance(req.user.phoneNumber);
  }

  // ─── Owner routes ───
  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Put('price')
  setPricePerTrip(
    @Body('pricePerTrip') pricePerTrip: number,
    @Req() req: any,
  ) {
    return this.paymentsService.setPricePerTrip(req.user.phoneNumber, pricePerTrip);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Get('price')
  getPricePerTrip(@Req() req: any) {
    return this.paymentsService.getPricePerTrip(req.user.phoneNumber);
  }
}