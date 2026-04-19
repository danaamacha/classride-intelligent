import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard)
@Controller('driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ─── Owner routes ───────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Post()
  create(@Body() dto: CreateDriverDto, @Req() req: any) {
    return this.driversService.create(dto, req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Get()
  findAll(@Req() req: any) {
    return this.driversService.findAll(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Delete(':phoneNumber')
  remove(@Param('phoneNumber') phoneNumber: string, @Req() req: any) {
    return this.driversService.remove(phoneNumber, req.user.phoneNumber);
  }

  // ─── Driver routes ───────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Get('trips')
  getAssignedTrips(@Req() req: any) {
    return this.driversService.getAssignedTrips(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Get('trips/active')
  getActiveTrip(@Req() req: any) {
    return this.driversService.getActiveTrip(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Get('trips/completed')
  getCompletedTrips(@Req() req: any) {
    return this.driversService.getCompletedTrips(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Put('trips/:id/activate')
  activateTrip(@Param('id') id: string, @Req() req: any) {
    return this.driversService.activateTrip(Number(id), req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Put('trips/:id/complete')
  completeTrip(@Param('id') id: string, @Req() req: any) {
    return this.driversService.completeTrip(Number(id), req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('driver' as any)
  @Put('payments')
  updatePayment(@Body() dto: UpdatePaymentDto, @Req() req: any) {
    return this.driversService.updatePayment(dto, req.user.phoneNumber);
  }
}