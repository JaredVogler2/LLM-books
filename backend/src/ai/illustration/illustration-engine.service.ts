import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fal } from '@fal-ai/client';
import * as sharp from 'sharp';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../../common/storage.service';
import { ContentSafetyService, SafetyGateError } from '../safety/content-safety.service';

@Injectable()
export class IllustrationEngineService {
  private readonly logger = new Logger(IllustrationEngineService.name);
  private readonly maxSafetyRetries = 2;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private storage: StorageService,
    private safety: ContentSafetyService,
  ) {
    fal.config({ credentials: config.get<string>('FAL_API_KEY') });
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
      include: { characterProfile: true, childProfile: true },
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

    // Gate 3: Validate the illustration prompt before sending to Flux
    await this.safety.validateIllustrationPrompt(
      fullPrompt,
      book.childProfile.age,
    );

    // Determine seed and IP-Adapter reference for character consistency
    const seed = book.characterProfile?.seed || undefined;
    let referenceImageUrl: string | null = null;
    if (book.characterProfile?.referenceIllustrationKey) {
      referenceImageUrl = await this.storage.getSignedUrl(
        book.characterProfile.referenceIllustrationKey,
      );
    }

    // Generate with safety retry loop
    let imageBuffer: Buffer;
    let attempts = 0;
    while (true) {
      attempts++;
      imageBuffer = await this.generateWithFlux(
        fullPrompt,
        1024,
        1024,
        seed,
        referenceImageUrl,
      );

      // Gate 4: Validate the generated image
      try {
        const base64 = imageBuffer.toString('base64');
        await this.safety.validateGeneratedImage(
          base64,
          'image/png',
          book.childProfile.age,
        );
        break; // Image passed safety — proceed
      } catch (error) {
        if (error instanceof SafetyGateError && attempts <= this.maxSafetyRetries) {
          this.logger.warn(
            `Image safety check failed for page ${pageNumber} (attempt ${attempts}/${this.maxSafetyRetries + 1}), regenerating: ${error.issues.join('; ')}`,
          );
          continue; // Regenerate
        }
        throw error; // Exhausted retries or non-safety error
      }
    }

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
        // Retry once (separate from safety retries within generatePageIllustration)
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

    // Gate 3: Validate cover prompt
    await this.safety.validateIllustrationPrompt(prompt, book.childProfile.age);

    const seed = book.characterProfile?.seed || undefined;
    let referenceImageUrl: string | null = null;
    if (book.characterProfile?.referenceIllustrationKey) {
      referenceImageUrl = await this.storage.getSignedUrl(
        book.characterProfile.referenceIllustrationKey,
      );
    }

    let imageBuffer: Buffer;
    let attempts = 0;
    while (true) {
      attempts++;
      imageBuffer = await this.generateWithFlux(
        prompt,
        1024,
        1024,
        seed,
        referenceImageUrl,
      );

      // Gate 4: Validate the generated cover image
      try {
        const base64 = imageBuffer.toString('base64');
        await this.safety.validateGeneratedImage(
          base64,
          'image/png',
          book.childProfile.age,
        );
        break;
      } catch (error) {
        if (error instanceof SafetyGateError && attempts <= this.maxSafetyRetries) {
          this.logger.warn(
            `Cover image safety check failed (attempt ${attempts}), regenerating`,
          );
          continue;
        }
        throw error;
      }
    }

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

  /**
   * Generate an image using Flux.2 Pro with optional IP-Adapter for
   * character consistency and seed locking for reproducibility.
   *
   * When a referenceImageUrl is provided, we use the IP-Adapter model
   * which anchors the character's visual features to the reference image.
   * Combined with a consistent seed, this produces characters that look
   * recognizably the same across all pages of the book.
   */
  private async generateWithFlux(
    prompt: string,
    width: number,
    height: number,
    seed?: number,
    referenceImageUrl?: string | null,
  ): Promise<Buffer> {
    // If we have a reference image, use IP-Adapter for character consistency
    if (referenceImageUrl) {
      return this.generateWithIpAdapter(prompt, width, height, seed, referenceImageUrl);
    }

    // Standard Flux.2 Pro generation (no character reference available)
    const model = this.config.get<string>(
      'FAL_IMAGE_MODEL',
      'fal-ai/flux-pro/v1.1',
    );

    const input: Record<string, any> = {
      prompt,
      image_size: { width, height },
      num_images: 1,
      safety_tolerance: '2',
    };
    if (seed !== undefined) {
      input.seed = seed;
    }

    const result = await fal.subscribe(model, { input });

    const imageUrl = result.data.images[0].url;
    const response = await fetch(imageUrl);
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate using IP-Adapter model which takes a reference image to
   * anchor character features. This is the key to visual consistency.
   */
  private async generateWithIpAdapter(
    prompt: string,
    width: number,
    height: number,
    seed: number | undefined,
    referenceImageUrl: string,
  ): Promise<Buffer> {
    const ipAdapterModel = this.config.get<string>(
      'FAL_IP_ADAPTER_MODEL',
      'fal-ai/flux/dev/ip-adapter',
    );

    const input: Record<string, any> = {
      prompt,
      image_url: referenceImageUrl,
      image_size: { width, height },
      num_images: 1,
      safety_tolerance: '2',
      ip_adapter_scale: 0.7, // Balance between reference fidelity and scene creativity
    };
    if (seed !== undefined) {
      input.seed = seed;
    }

    try {
      const result = await fal.subscribe(ipAdapterModel, { input });
      const imageUrl = result.data.images[0].url;
      const response = await fetch(imageUrl);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      // Fallback to standard Flux if IP-Adapter fails
      this.logger.warn(
        `IP-Adapter generation failed, falling back to standard Flux: ${error}`,
      );
      return this.generateWithFlux(prompt, width, height, seed, null);
    }
  }
}
