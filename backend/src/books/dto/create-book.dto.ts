import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty()
  @IsUUID()
  childProfileId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  characterProfileId?: string;

  @ApiProperty({ enum: ['BEDTIME', 'RHYMING', 'ADVENTURE', 'CHOOSE_YOUR_OWN', 'EDUCATIONAL_STEM'] })
  @IsString()
  storyType: string;

  @ApiPropertyOptional({ enum: ['FULL_COLOR', 'BLACK_WHITE_COLORING'], default: 'FULL_COLOR' })
  @IsOptional()
  @IsString()
  illustrationStyle?: string;

  @ApiPropertyOptional({ enum: ['SOFTCOVER', 'HARDCOVER', 'SPIRAL_BOUND', 'SADDLE_STITCH'], default: 'SOFTCOVER' })
  @IsOptional()
  @IsString()
  bindingType?: string;

  @ApiPropertyOptional({ enum: ['STANDARD', 'PREMIUM_MATTE', 'GLOSSY'], default: 'STANDARD' })
  @IsOptional()
  @IsString()
  paperType?: string;

  @ApiPropertyOptional({ enum: ['SQUARE_8X8', 'PORTRAIT_8_5X11', 'LANDSCAPE_11X8_5'], default: 'SQUARE_8X8' })
  @IsOptional()
  @IsString()
  bookSize?: string;

  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(36)
  pageCount?: number;

  @ApiPropertyOptional({ example: 'Kindness and sharing' })
  @IsOptional()
  @IsString()
  moralLesson?: string;

  @ApiPropertyOptional({ example: 'For our little star, Emma. Love, Grandma' })
  @IsOptional()
  @IsString()
  dedicationText?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeAudiobook?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeDigitalPdf?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  giftWrap?: boolean;
}
