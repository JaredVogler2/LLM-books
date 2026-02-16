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
    let basePriceCents = 2499; // $24.99 base

    // Page count adjustments
    if (book.pageCount === 12) basePriceCents = 1999;
    if (book.pageCount === 36) basePriceCents = 3499;

    // Binding adjustments
    if (book.bindingType === 'HARDCOVER') basePriceCents += 1000;
    if (book.bindingType === 'SPIRAL_BOUND') basePriceCents += 500;

    // Paper adjustments
    if (book.paperType === 'PREMIUM_MATTE') basePriceCents += 500;
    if (book.paperType === 'GLOSSY') basePriceCents += 800;

    // Add-ons
    if (book.includeAudiobook) basePriceCents += 999;
    if (book.includeDigitalPdf) basePriceCents += 499;
    if (book.giftWrap) basePriceCents += 399;

    await this.prisma.book.update({
      where: { id: bookId },
      data: { estimatedPrice: basePriceCents },
    });

    return basePriceCents;
  }
}
