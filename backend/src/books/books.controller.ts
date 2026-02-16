import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}
