import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('owner' as any)
@Controller('owner')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.ownersService.getDashboard(req.user.phoneNumber);
  }
}