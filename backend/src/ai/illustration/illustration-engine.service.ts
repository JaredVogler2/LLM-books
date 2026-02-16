import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as sharp from 'sharp';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../../common/storage.service';

@Injectable()
export class IllustrationEngineService {
  private readonly logger = new Logger(IllustrationEngineService.name);
  private readonly openai: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
  }

  async generatePageIllustration(
    bookId: string,
    pageNumber: number,
  ): Promise<string> {
    const page = await this.prisma.bookPage.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });
    if (!page) throw new Error(`Page ${pageNumber} not found for book ${bookId}`);

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { characterProfile: true },
    });
    if (!book) throw new Error('Book not found');

    // Build the illustration prompt with character consistency
    let stylePrefix = '';
    if (book.illustrationStyle === 'FULL_COLOR') {
      stylePrefix = 'Children\'s book illustration, vibrant watercolor style, warm lighting, soft edges, whimsical and inviting. High quality, 300 DPI print resolution.';
    } else {
      stylePrefix = 'Clean black and white line art, children\'s coloring book style, clear outlines, no shading, simple shapes suitable for coloring. High quality, 300 DPI print resolution.';
    }

    let characterLock = '';
    if (book.characterProfile) {
      characterLock = `CONSISTENT CHARACTER: ${book.characterProfile.stylePrompt}. Maintain exact same appearance across all pages.`;
    }

    const fullPrompt = `${stylePrefix}\n\n${characterLock}\n\nSCENE: ${page.illustrationPrompt}\n\nIMPORTANT: Child-safe content only. No scary elements. Warm, inviting atmosphere.`;

    const response = await this.openai.images.generate({
      model: this.config.get('OPENAI_IMAGE_MODEL', 'dall-e-3'),
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
    });

    const imageUrl = response.data[0].url!;

    // Download and process for print quality
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upscale to 300 DPI print resolution (2400x2400 for 8x8 at 300 DPI)
    const processedBuffer = await sharp(imageBuffer)
      .resize(2400, 2400, { fit: 'cover', kernel: 'lanczos3' })
      .png({ quality: 100 })
      .toBuffer();

    // Store in cloud storage
    const storageKey = await this.storage.uploadBookAsset(
      processedBuffer,
      bookId,
      `page-${String(pageNumber).padStart(3, '0')}.png`,
      'image/png',
    );

    // Update page record
    await this.prisma.bookPage.update({
      where: { bookId_pageNumber: { bookId, pageNumber } },
      data: {
        imageStorageKey: storageKey,
        imageUrl: this.storage.getPublicUrl(storageKey),
        imageWidth: 2400,
        imageHeight: 2400,
        imageDpi: 300,
        isGenerated: true,
      },
    });

    this.logger.log(`Generated illustration for book ${bookId}, page ${pageNumber}`);
    return storageKey;
  }

  async generateAllIllustrations(bookId: string): Promise<void> {
    const pages = await this.prisma.bookPage.findMany({
      where: { bookId },
      orderBy: { pageNumber: 'asc' },
    });

    // Generate sequentially to maintain character consistency with shared context
    for (const page of pages) {
      if (page.layoutType === 'DEDICATION_PAGE') continue;

      try {
        await this.generatePageIllustration(bookId, page.pageNumber);
      } catch (error) {
        this.logger.error(
          `Failed to generate illustration for page ${page.pageNumber}: ${error}`,
        );
        // Retry once
        try {
          await this.generatePageIllustration(bookId, page.pageNumber);
        } catch (retryError) {
          this.logger.error(
            `Retry failed for page ${page.pageNumber}: ${retryError}`,
          );
          throw retryError;
        }
      }
    }
  }

  async generateCoverImage(bookId: string): Promise<string> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { childProfile: true, characterProfile: true },
    });
    if (!book) throw new Error('Book not found');

    const characterDesc = book.characterProfile?.stylePrompt
      || `a ${book.childProfile.age}-year-old child named ${book.childProfile.name}`;

    const prompt = `Children's book cover illustration. Title: "${book.title}". Featuring ${characterDesc}. Vibrant, eye-catching, whimsical watercolor style. Central character prominently displayed. Magical, inviting atmosphere. High quality, 300 DPI. Child-safe content only.`;

    const response = await this.openai.images.generate({
      model: this.config.get('OPENAI_IMAGE_MODEL', 'dall-e-3'),
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
    });

    const imageUrl = response.data[0].url!;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const processedBuffer = await sharp(imageBuffer)
      .resize(2550, 2550, { fit: 'cover', kernel: 'lanczos3' })
      .png({ quality: 100 })
      .toBuffer();

    const storageKey = await this.storage.uploadBookAsset(
      processedBuffer,
      bookId,
      'cover.png',
      'image/png',
    );

    await this.prisma.book.update({
      where: { id: bookId },
      data: { coverImageUrl: this.storage.getPublicUrl(storageKey) },
    });

    this.logger.log(`Generated cover for book ${bookId}`);
    return storageKey;
  }
}
