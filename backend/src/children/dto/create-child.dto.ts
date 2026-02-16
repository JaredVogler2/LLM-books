import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChildDto {
  @ApiProperty({ example: 'Emma' })
  @IsString()
  name: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  age: number;

  @ApiPropertyOptional({ example: 'female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: ['dinosaurs', 'painting'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ example: ['purple', 'blue'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteColors?: string[];

  @ApiPropertyOptional({ example: ['curious', 'brave'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalityTraits?: string[];

  @ApiPropertyOptional({ example: ['cats', 'dolphins'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteAnimals?: string[];

  @ApiPropertyOptional({ example: ['space', 'STEM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themes?: string[];
}
