import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';import { PaymentsService } from './payments.service';
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
  @Roles('owner' as any)
  @Get('owner/balances')
  getOwnerStudentBalances(@Req() req: any) {
    return this.paymentsService.getOwnerStudentBalances(req.user.phoneNumber);
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
  setPrices(
    @Body() body: { priceSingleTrip: number; priceDoubleTrip: number },
    @Req() req: any,
  ) {
    return this.paymentsService.setPrices(
      req.user.phoneNumber,
      body.priceSingleTrip,
      body.priceDoubleTrip,
    );
  }

  @Get('price')
  getPrices(@Req() req: any) {
    return this.paymentsService.getPrices(req.user.phoneNumber);
  }
// ── Edit/delete transaction ──
  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Put('transaction/:id')
  editTransaction(
    @Param('id') id: string,
    @Body() body: { amount: number; note?: string },
    @Req() req: any,
  ) {
    return this.paymentsService.editTransaction(
      parseInt(id),
      body.amount,
      body.note ?? '',
      req.user.phoneNumber,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Delete('transaction/:id')
  deleteTransaction(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.deleteTransaction(parseInt(id), req.user.phoneNumber);
  }

 }