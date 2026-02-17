import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { BookStatus } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('book-generation') private generationQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateBookDto) {
    const child = await this.prisma.childProfile.findFirst({
      where: { id: dto.childProfileId, userId },
    });
    if (!child) throw new NotFoundException('Child profile not found');

    // Validate option combinations
    this.validateBookOptions(dto);

    const book = await this.prisma.book.create({
      data: {
        userId,
        childProfileId: dto.childProfileId,
        characterProfileId: dto.characterProfileId,
        storyType: dto.storyType,
        illustrationStyle: dto.illustrationStyle,
        bindingType: dto.bindingType,
        paperType: dto.paperType,
        bookSize: dto.bookSize,
        pageCount: dto.pageCount ?? 24,
        moralLesson: dto.moralLesson,
        dedicationText: dto.dedicationText,
        includeAudiobook: dto.includeAudiobook ?? false,
        includeDigitalPdf: dto.includeDigitalPdf ?? false,
        giftWrap: dto.giftWrap ?? false,
        status: BookStatus.DRAFT,
      },
    });

    return book;
  }

  /**
   * Validates that the selected book options are compatible with each other.
   * Lulu Direct has specific constraints on binding/page count/size combinations.
   */
  private validateBookOptions(dto: CreateBookDto) {
    const pageCount = dto.pageCount ?? 24;
    const binding = dto.bindingType ?? 'SOFTCOVER';

    // Saddle stitch is only available for books with 32 or fewer pages
    if (binding === 'SADDLE_STITCH' && pageCount > 32) {
      throw new BadRequestException(
        'Saddle stitch binding is only available for books with 32 or fewer pages. Choose a different binding or reduce page count.',
      );
    }

    // Perfect-bound (softcover/hardcover) requires at least 24 pages on Lulu
    if ((binding === 'SOFTCOVER' || binding === 'HARDCOVER') && pageCount < 24) {
      throw new BadRequestException(
        `${binding === 'HARDCOVER' ? 'Hardcover' : 'Softcover'} binding requires at least 24 pages. Choose saddle stitch for shorter books or increase page count.`,
      );
    }

    // Hardcover is not available in landscape on Lulu
    if (binding === 'HARDCOVER' && dto.bookSize === 'LANDSCAPE_11X8_5') {
      throw new BadRequestException(
        'Hardcover binding is not available in landscape format. Choose portrait or square, or select a different binding.',
      );
    }

    // Spiral binding is not available through Lulu Direct
    if (binding === 'SPIRAL_BOUND') {
      throw new BadRequestException(
        'Spiral bound is not currently available through our print partner. Choose softcover, hardcover, or saddle stitch.',
      );
    }
  }

  /**
   * Calculates estimated price for given options without requiring a saved book.
   * Used by the frontend to show real-time pricing in the wizard.
   */
  calculatePriceFromOptions(options: {
    pageCount: number;
    bindingType: string;
    paperType: string;
    bookSize: string;
    illustrationStyle: string;
    includeAudiobook: boolean;
    includeDigitalPdf: boolean;
    giftWrap: boolean;
  }): { totalCents: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};

    // Base price by page count
    if (options.pageCount <= 12) breakdown.base = 1999;
    else if (options.pageCount <= 24) breakdown.base = 2499;
    else breakdown.base = 3499;

    // Binding surcharge
    if (options.bindingType === 'HARDCOVER') breakdown.binding = 1000;
    else if (options.bindingType === 'SPIRAL_BOUND') breakdown.binding = 500;
    else breakdown.binding = 0;

    // Paper surcharge
    if (options.paperType === 'PREMIUM_MATTE') breakdown.paper = 500;
    else if (options.paperType === 'GLOSSY') breakdown.paper = 800;
    else breakdown.paper = 0;

    // Size surcharge (larger sizes cost more to print)
    if (options.bookSize === 'PORTRAIT_8_5X11') breakdown.size = 300;
    else if (options.bookSize === 'LANDSCAPE_11X8_5') breakdown.size = 300;
    else breakdown.size = 0;

    // Add-ons
    breakdown.audiobook = options.includeAudiobook ? 999 : 0;
    breakdown.digitalPdf = options.includeDigitalPdf ? 499 : 0;
    breakdown.giftWrap = options.giftWrap ? 399 : 0;

    const totalCents = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
    return { totalCents, breakdown };
  }

  async startGeneration(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId },
    });
    if (!book) throw new NotFoundException('Book not found');
    if (book.status !== BookStatus.DRAFT) {
      throw new BadRequestException('Book generation already started');
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING_STORY },
    });

    await this.generationQueue.add(
      'generate-story',
      { bookId },
      { priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return { bookId, status: 'GENERATING_STORY' };
  }

  async findAllByUser(userId: string) {
    return this.prisma.book.findMany({
      where: { userId },
      include: {
        childProfile: true,
        pages: { orderBy: { pageNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        childProfile: true,
        characterProfile: true,
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async getBookWithPages(id: string) {
    return this.prisma.book.findUnique({
      where: { id },
      include: {
        childProfile: { include: { characterProfiles: true } },
        characterProfile: true,
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    });
  }

  async updateStatus(id: string, status: BookStatus, error?: string) {
    return this.prisma.book.update({
      where: { id },
      data: {
        status,
        errorMessage: error || null,
      },
    });
  }

  async calculatePrice(bookId: string): Promise<number> {
    const book = await this.findById(bookId);
    const { totalCents } = this.calculatePriceFromOptions({
      pageCount: book.pageCount,
      bindingType: book.bindingType,
      paperType: book.paperType,
      bookSize: book.bookSize,
      illustrationStyle: book.illustrationStyle,
      includeAudiobook: book.includeAudiobook,
      includeDigitalPdf: book.includeDigitalPdf,
      giftWrap: book.giftWrap,
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: { estimatedPrice: totalCents },
    });

    return totalCents;
  }
}
