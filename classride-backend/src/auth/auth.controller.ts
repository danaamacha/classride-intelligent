import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtGuard } from './guards/jwt.guard';

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
}