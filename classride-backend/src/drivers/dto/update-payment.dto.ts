import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdatePaymentDto {
  @IsNumber()
  tripId!: number;

  @IsString()
  @IsNotEmpty()
  studentPhone!: string;

  @IsNumber()
  amountPaid!: number;

  @IsString()
  @IsOptional()
  note?: string;
}