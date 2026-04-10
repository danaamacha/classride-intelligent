import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('owner' as any)
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  create(@Body() dto: CreateBusDto, @Req() req: any) {
    return this.busesService.create(dto, req.user.phoneNumber);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.busesService.findAll(req.user.phoneNumber);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.busesService.remove(Number(id), req.user.phoneNumber);
  }
}