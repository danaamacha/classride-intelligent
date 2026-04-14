import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('owner')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  // ✅ Public — any user can browse owners to send join request
  @Get('list')
  getOwnersList() {
    return this.ownersService.getOwnersList();
  }

  // ✅ Protected — owner only
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('owner' as any)
  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.ownersService.getDashboard(req.user.phoneNumber);
  }
}