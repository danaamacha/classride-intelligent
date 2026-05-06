import { Controller, Get, Post, Delete, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('owner' as any)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() dto: CreateTripDto, @Req() req: any) {
    return this.tripsService.create(dto, req.user.phoneNumber);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.tripsService.findAll(req.user.phoneNumber);
  }
@Get(':id/suggested-students')
  getSuggestedStudents(@Param('id') id: string, @Req() req: any) {
    return this.tripsService.getSuggestedStudents(Number(id), req.user.phoneNumber);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tripsService.findOne(Number(id), req.user.phoneNumber);
  }
@Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTripDto>,
    @Req() req: any,
  ) {
    return this.tripsService.update(Number(id), dto, req.user.phoneNumber);
  }
  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.tripsService.updateStatus(Number(id), status, req.user.phoneNumber);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tripsService.remove(Number(id), req.user.phoneNumber);
  }

  @Post(':id/assign')
  assignStudent(
    @Param('id') id: string,
    @Body('studentPhone') studentPhone: string,
    @Req() req: any,
  ) {
    return this.tripsService.assignStudent(Number(id), studentPhone, req.user.phoneNumber);
  }

  @Delete(':id/assign/:studentPhone')
  unassignStudent(
    @Param('id') id: string,
    @Param('studentPhone') studentPhone: string,
    @Req() req: any,
  ) {
    return this.tripsService.unassignStudent(Number(id), studentPhone, req.user.phoneNumber);
  }
}