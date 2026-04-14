import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsBoolean()
  attendanceMorning!: boolean;

  @IsBoolean()
  attendanceReturn!: boolean;
}