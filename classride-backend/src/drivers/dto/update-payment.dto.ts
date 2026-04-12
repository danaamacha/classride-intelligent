import { IsString, IsNotEmpty, IsBoolean, IsInt } from 'class-validator';

export class UpdatePaymentDto {
  @IsInt()
  tripId!: number;

  @IsString()
  @IsNotEmpty()
  studentPhone!: string;

  @IsBoolean()
  paid!: boolean;
}