import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional } from 'class-validator';

export class CreateBusDto {
  @IsString()
  @IsNotEmpty()
  busName!: string;

  @IsInt()
  @IsPositive()
  capacity!: number;
}