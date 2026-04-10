import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('owner' as any)
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  create(@Body() dto: CreateDestinationDto, @Req() req: any) {
    return this.destinationsService.create(dto, req.user.phoneNumber);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.destinationsService.findAll(req.user.phoneNumber);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.destinationsService.remove(Number(id), req.user.phoneNumber);
  }
}