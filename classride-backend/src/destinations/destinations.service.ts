import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDestinationDto } from './dto/create-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDestinationDto, ownerPhone: string) {
    return this.prisma.destination.create({
      data: {
        name: dto.name,
        location: dto.location,
        ownerPhone,
      },
    });
  }

  async findAll(ownerPhone: string) {
    return this.prisma.destination.findMany({
      where: { ownerPhone },
      orderBy: { destinationId: 'desc' },
    });
  }

  async remove(destinationId: number, ownerPhone: string) {
    const destination = await this.prisma.destination.findFirst({
      where: { destinationId, ownerPhone },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found or not authorized');
    }

    await this.prisma.destination.delete({ where: { destinationId } });
    return { message: 'Destination removed successfully' };
  }
}