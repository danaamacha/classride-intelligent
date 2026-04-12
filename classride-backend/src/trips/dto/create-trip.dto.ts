import { IsInt, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { TripType } from '@prisma/client';

export class CreateTripDto {
  @IsInt()
  busId!: number;

  @IsString()
  @IsNotEmpty()
  driverPhone!: string;

  @IsInt()
  destinationId!: number;

  @IsString()
  @IsNotEmpty()
  pickupTime!: string;

  @IsString()
  @IsOptional()
  dropoffTime?: string;

  @IsEnum(TripType)
  type!: TripType;

  @IsString()
  @IsNotEmpty()
  date!: string;
}