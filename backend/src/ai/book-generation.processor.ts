import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { StoryEngineService } from './story/story-engine.service';
import { IllustrationEngineService } from './illustration/illustration-engine.service';
import { PdfAssemblyService } from './pdf/pdf-assembly.service';
import { ContentSafetyService, SafetyGateError } from './safety/content-safety.service';
import { BookStatus } from '@prisma/client';

@Processor('book-generation')
export class BookGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(BookGenerationProcessor.name);
  private readonly maxRegenerationAttempts = 2;

  constructor(
    private prisma: PrismaService,
    private storyEngine: StoryEngineService,
    private illustrationEngine: IllustrationEngineService,
    private pdfAssembly: PdfAssemblyService,
    private safety: ContentSafetyService,
  ) {
    super();
  }

  async process(job: Job<{ bookId: string }>): Promise<void> {
    const { bookId } = job.data;
    this.logger.log(`Processing book generation: ${bookId} (job: ${job.name})`);

    try {
      switch (job.name) {
        case 'generate-story':
          await this.handleStoryGeneration(bookId);
          break;
        case 'generate-illustrations':
          await this.handleIllustrationGeneration(bookId);
          break;
        case 'assemble-pdf':
          await this.handlePdfAssembly(bookId);
          break;
        default:
          // Full pipeline
          await this.handleFullPipeline(bookId);
      }
    } catch (error) {
      this.logger.error(`Book generation failed for ${bookId}: ${error}`);

      const errorMessage = error instanceof SafetyGateError
        ? `Content safety check failed (${error.gate}): ${error.issues.join('; ')}`
        : error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: BookStatus.FAILED,
          errorMessage,
        },
      });
      throw error;
    }
  }

  private async handleStoryGeneration(bookId: string): Promise<void> {
    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING_STORY },
    });

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { childProfile: true },
    });
    if (!book) throw new Error('Book not found');

    // ── Gate 1: Validate user inputs before any AI generation ──
    this.logger.log(`Running input safety validation for ${bookId}`);
    await this.safety.validateUserInputs({
      childName: book.childProfile.name,
      age: book.childProfile.age,
      interests: book.childProfile.interests,
      themes: book.childProfile.themes,
      customText: book.customText || undefined,
      dedicationText: book.dedicationText || undefined,
      moralLesson: book.moralLesson || undefined,
    });
    this.logger.log(`Input safety validation passed for ${bookId}`);

    // ── Generate story outline ──
    this.logger.log(`Generating outline for ${bookId}`);
    await this.storyEngine.generateOutline(bookId);

    // ── Generate page content (with regeneration on safety failure) ──
    let pages;
    let storyAttempt = 0;
    while (true) {
      storyAttempt++;
      this.logger.log(`Generating pages for ${bookId} (attempt ${storyAttempt})`);
      pages = await this.storyEngine.generatePages(bookId);

      // ── Gate 2: Validate complete story content ──
      const fullStoryText = pages.map(p => p.text).join('\n\n');
      try {
        await this.safety.validateStoryContent(fullStoryText, book.childProfile.age);
        this.logger.log(`Story safety validation passed for ${bookId}`);
        break; // Story is safe — proceed
      } catch (error) {
        if (error instanceof SafetyGateError && storyAttempt <= this.maxRegenerationAttempts) {
          this.logger.warn(
            `Story safety check failed for ${bookId} (attempt ${storyAttempt}), regenerating: ${error.issues.join('; ')}`,
          );
          continue; // Regenerate the entire story
        }
        throw error; // Exhausted retries
      }
    }

    // ── Structural validation (word count, sentence length) ──
    for (const page of pages) {
      const validation = await this.storyEngine.validateStructure(
        page.text,
        book.childProfile.age,
      );
      if (!validation.valid) {
        this.logger.warn(
          `Structural issues on page ${page.pageNumber}: ${validation.issues.join(', ')}`,
        );
        // Structural issues are warnings (not safety-critical) — log but continue
      }
    }

    // Queue illustration generation
    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING_ILLUSTRATIONS },
    });
  }

  private async handleIllustrationGeneration(bookId: string): Promise<void> {
    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING_ILLUSTRATIONS },
    });

    // Gates 3 & 4 are enforced inside IllustrationEngineService:
    // - Gate 3: Every illustration prompt is validated before sending to Flux
    // - Gate 4: Every generated image is validated via Claude Vision
    // - Failed images are automatically regenerated (up to maxSafetyRetries)

    // Generate cover
    await this.illustrationEngine.generateCoverImage(bookId);

    // Generate all page illustrations
    await this.illustrationEngine.generateAllIllustrations(bookId);

    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.ASSEMBLING_PDF },
    });
  }

  private async handlePdfAssembly(bookId: string): Promise<void> {
    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.ASSEMBLING_PDF },
    });

    // Assemble print-ready PDF
    await this.pdfAssembly.assemblePrintPdf(bookId);

    // Assemble digital PDF if requested
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (book?.includeDigitalPdf) {
      await this.pdfAssembly.assembleDigitalPdf(bookId);
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.REVIEW_READY },
    });
  }

  private async handleFullPipeline(bookId: string): Promise<void> {
    await this.handleStoryGeneration(bookId);
    await this.handleIllustrationGeneration(bookId);
    await this.handlePdfAssembly(bookId);
    this.logger.log(`Full pipeline completed for book ${bookId}`);
  }
}
