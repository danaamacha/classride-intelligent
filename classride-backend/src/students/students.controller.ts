import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

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

  // Any logged in user can send a join request
  @Post('join-request')
  sendJoinRequest(@Body() dto: JoinRequestDto, @Req() req: any) {
    return this.studentsService.sendJoinRequest(dto, req.user.phoneNumber);
  }
}