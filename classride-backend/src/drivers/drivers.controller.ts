import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('owner' as any)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  create(@Body() dto: CreateDriverDto, @Req() req: any) {
    return this.driversService.create(dto, req.user.phoneNumber);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.driversService.findAll(req.user.phoneNumber);
  }

  @Delete(':phoneNumber')
  remove(@Param('phoneNumber') phoneNumber: string, @Req() req: any) {
    return this.driversService.remove(phoneNumber, req.user.phoneNumber);
  }
}