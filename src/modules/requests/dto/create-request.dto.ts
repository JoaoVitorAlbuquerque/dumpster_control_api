import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { Activity } from '../entities/Activity';
import { Priority } from '../entities/Priority';
import { Status } from '../entities/Status';

export class CreateRequestDto {
  @ApiProperty()
  @IsString()
  // @IsOptional()
  @MaxLength(11)
  @IsNotEmpty()
  cpf: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  // @ApiProperty()
  // @IsNumber({ maxDecimalPlaces: 7 })
  // @IsNotEmpty()
  // // @MaxLength(11)
  // latitude: number;

  // @ApiProperty()
  // @IsNumber({ maxDecimalPlaces: 7 })
  // @IsNotEmpty()
  // // @MaxLength(11)
  // longitude: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({
    enum: Activity,
    required: true,
    description: 'Activity type for the request',
  })
  @IsEnum(Activity)
  @IsNotEmpty()
  activity: Activity;

  @ApiProperty({
    enum: Priority,
    required: true,
    description: 'Priority level for the request',
  })
  @IsEnum(Priority)
  @IsOptional()
  priority: Priority;

  @ApiProperty({
    enum: Status,
    required: true,
    description: 'Current status of the request',
  })
  @IsEnum(Status)
  @IsOptional()
  status: Status;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  deliveryDate?: Date;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: Date;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  completionDate?: Date;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
