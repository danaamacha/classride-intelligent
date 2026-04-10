import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET')!,
    });
  }

  async validate(payload: { phoneNumber: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: payload.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const { password, ...result } = user;
    return result;
  }
}