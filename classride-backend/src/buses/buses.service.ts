import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';

@Injectable()
export class BusesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBusDto, ownerPhone: string) {
    return this.prisma.bus.create({
      data: {
        busName: dto.busName,
        capacity: dto.capacity,
        ownerPhone,
      },
    });
  }

  async findAll(ownerPhone: string) {
    return this.prisma.bus.findMany({
      where: { ownerPhone },
      orderBy: { busId: 'desc' },
    });
  }

  async remove(busId: number, ownerPhone: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { busId, ownerPhone },
    });

    if (!bus) {
      throw new NotFoundException('Bus not found or not authorized');
    }

    await this.prisma.bus.delete({ where: { busId } });
    return { message: 'Bus removed successfully' };
  }
}