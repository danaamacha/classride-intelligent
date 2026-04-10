import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('Phone number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        fullName: dto.fullName,
        password: hashedPassword,
        role: dto.role ?? 'pending',
      },
    });

    const { password, refreshToken, ...result } = user;
    return result;
  }

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.phoneNumber, user.fullName, user.role);
    await this.saveRefreshToken(user.phoneNumber, tokens.refreshToken);

    return {
      ...tokens,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      role: user.role,
    };
  }

  // ─────────────────────────────────────────
  // REFRESH
  // ─────────────────────────────────────────
  async refresh(phoneNumber: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.generateTokens(user.phoneNumber, user.fullName, user.role);
    await this.saveRefreshToken(user.phoneNumber, tokens.refreshToken);

    return tokens;
  }

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  async logout(phoneNumber: string) {
    await this.prisma.user.update({
      where: { phoneNumber },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  private async generateTokens(phoneNumber: string, fullName: string, role: any) {
    const payload = { phoneNumber, fullName, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(phoneNumber: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { phoneNumber },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}