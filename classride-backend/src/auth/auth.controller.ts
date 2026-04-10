import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtGuard } from './guards/jwt.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.phoneNumber, dto.refreshToken);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.phoneNumber);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return req.user;
  }

@UseGuards(JwtGuard, RolesGuard)
@Roles('owner' as any)
@Get('owner-only')
ownerOnly() {
  return { message: 'Welcome owner!' };
}

@UseGuards(JwtGuard, RolesGuard)
@Roles('driver' as any)
@Get('driver-only')
driverOnly() {
  return { message: 'Welcome driver!' };
}

}