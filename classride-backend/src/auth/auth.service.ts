import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if phone number already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('Phone number already exists');
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Save user to database
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        fullName: dto.fullName,
        password: hashedPassword,
        role: dto.role ?? 'pending',
      },
    });

    // 4. Return user without password
    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    // 1. Find user by phone number
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    // 2. Generic error — don't tell hacker if phone exists or not
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Compare password with hash
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Generate JWT token
    const token = await this.jwt.signAsync({
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      role: user.role,
    });

    // 5. Return token + user info (no password)
    return {
      token,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      role: user.role,
    };
  }
}