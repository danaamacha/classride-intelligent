import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsBoolean()
  attendanceMorning!: boolean;

  @IsBoolean()
  attendanceReturn!: boolean;

  @IsString()
  @IsOptional()
  overrideMorningTime?: string;

  @IsString()
  @IsOptional()
  overrideReturnTime?: string;
}