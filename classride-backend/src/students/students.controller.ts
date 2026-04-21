import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ─── Owner routes ───────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Post()
  create(@Body() dto: CreateStudentDto, @Req() req: any) {
    return this.studentsService.create(dto, req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Get()
  findAll(@Req() req: any) {
    return this.studentsService.findAll(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Delete(':phoneNumber')
  remove(@Param('phoneNumber') phoneNumber: string, @Req() req: any) {
    return this.studentsService.remove(phoneNumber, req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Get('join-requests')
  getJoinRequests(@Req() req: any) {
    return this.studentsService.getJoinRequests(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Post('join-requests/accept')
  acceptJoinRequest(@Body('studentPhone') studentPhone: string, @Req() req: any) {
    return this.studentsService.acceptJoinRequest(studentPhone, req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('owner' as any)
  @Post('join-requests/reject')
  rejectJoinRequest(@Body('studentPhone') studentPhone: string, @Req() req: any) {
    return this.studentsService.rejectJoinRequest(studentPhone, req.user.phoneNumber);
  }

  // ─── Any logged in user ───────────────────────────────
  @Post('join-request')
  sendJoinRequest(@Body() dto: JoinRequestDto, @Req() req: any) {
    return this.studentsService.sendJoinRequest(dto, req.user.phoneNumber);
  }

  // ─── Student routes ───────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Get('my/trips')
  getAssignedTrips(@Req() req: any) {
    return this.studentsService.getAssignedTrips(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Get('my/trips/active')
  getActiveTrip(@Req() req: any) {
    return this.studentsService.getActiveTrip(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Get('my/schedule')
  getWeeklySchedule(@Req() req: any) {
    return this.studentsService.getWeeklySchedule(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Get('my/attendance')
  getAttendance(@Req() req: any) {
    return this.studentsService.getAttendance(req.user.phoneNumber);
  }

  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Put('my/attendance')
  updateAttendance(@Body() dto: UpdateAttendanceDto, @Req() req: any) {
    return this.studentsService.updateAttendance(dto, req.user.phoneNumber);
  }
// No role restriction — pending users need this
@Put('my/profile')
updateProfile(@Body('homeAddress') homeAddress: string, @Req() req: any) {
  return this.studentsService.updateProfile(req.user.phoneNumber, homeAddress);
}
  // No role restriction — pending users need this to set up profile
// No role restriction — pending users need this to set up profile
@Post('my/schedule')
saveWeeklySchedule(@Body() dto: any, @Req() req: any) {
  return this.studentsService.saveWeeklySchedule(req.user.phoneNumber, dto);
}

  @UseGuards(RolesGuard)
  @Roles('student' as any)
  @Delete('my/schedule/:day')
  deleteScheduleDay(@Param('day') day: string, @Req() req: any) {
    return this.studentsService.deleteWeeklyScheduleDay(req.user.phoneNumber, parseInt(day));
  }
  // Student can check their own pending request
@Get('my/request')
getMyRequest(@Req() req: any) {
  return this.studentsService.getMyRequest(req.user.phoneNumber);
}
}