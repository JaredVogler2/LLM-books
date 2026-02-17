import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('books')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book configuration' })
  @ApiResponse({ status: 201, description: 'Book created' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBookDto) {
    return this.booksService.create(userId, dto);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start book generation pipeline' })
  @ApiResponse({ status: 202, description: 'Generation started' })
  startGeneration(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.booksService.startGeneration(id, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all books for current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.booksService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book details with pages' })
  findOne(@Param('id') id: string) {
    return this.booksService.findById(id);
  }

  @Get(':id/price')
  @ApiOperation({ summary: 'Calculate book price' })
  async getPrice(@Param('id') id: string) {
    const priceCents = await this.booksService.calculatePrice(id);
    return { priceCents, priceFormatted: `$${(priceCents / 100).toFixed(2)}` };
  }

  @Get('estimate/price')
  @ApiOperation({ summary: 'Estimate price based on book options (no saved book required)' })
  @ApiQuery({ name: 'pageCount', required: false, type: Number })
  @ApiQuery({ name: 'bindingType', required: false, enum: ['SOFTCOVER', 'HARDCOVER', 'SADDLE_STITCH'] })
  @ApiQuery({ name: 'paperType', required: false, enum: ['STANDARD', 'PREMIUM_MATTE', 'GLOSSY'] })
  @ApiQuery({ name: 'bookSize', required: false, enum: ['SQUARE_8X8', 'PORTRAIT_8_5X11', 'LANDSCAPE_11X8_5'] })
  @ApiQuery({ name: 'illustrationStyle', required: false, enum: ['FULL_COLOR', 'BLACK_WHITE_COLORING'] })
  @ApiQuery({ name: 'includeAudiobook', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDigitalPdf', required: false, type: Boolean })
  @ApiQuery({ name: 'giftWrap', required: false, type: Boolean })
  estimatePrice(
    @Query('pageCount') pageCount?: string,
    @Query('bindingType') bindingType?: string,
    @Query('paperType') paperType?: string,
    @Query('bookSize') bookSize?: string,
    @Query('illustrationStyle') illustrationStyle?: string,
    @Query('includeAudiobook') includeAudiobook?: string,
    @Query('includeDigitalPdf') includeDigitalPdf?: string,
    @Query('giftWrap') giftWrap?: string,
  ) {
    const result = this.booksService.calculatePriceFromOptions({
      pageCount: pageCount ? parseInt(pageCount, 10) : 24,
      bindingType: bindingType || 'SOFTCOVER',
      paperType: paperType || 'STANDARD',
      bookSize: bookSize || 'SQUARE_8X8',
      illustrationStyle: illustrationStyle || 'FULL_COLOR',
      includeAudiobook: includeAudiobook === 'true',
      includeDigitalPdf: includeDigitalPdf === 'true',
      giftWrap: giftWrap === 'true',
    });
    return {
      ...result,
      priceFormatted: `$${(result.totalCents / 100).toFixed(2)}`,
    };
  }
}
