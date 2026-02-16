import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { StoryEngineService } from './story/story-engine.service';
import { IllustrationEngineService } from './illustration/illustration-engine.service';
import { PdfAssemblyService } from './pdf/pdf-assembly.service';
import { BookStatus } from '@prisma/client';

@Processor('book-generation')
export class BookGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(BookGenerationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storyEngine: StoryEngineService,
    private illustrationEngine: IllustrationEngineService,
    private pdfAssembly: PdfAssemblyService,
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
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: BookStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
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

    // Step 1: Generate outline
    this.logger.log(`Generating outline for ${bookId}`);
    await this.storyEngine.generateOutline(bookId);

    // Step 2: Generate page content
    this.logger.log(`Generating pages for ${bookId}`);
    const pages = await this.storyEngine.generatePages(bookId);

    // Step 3: Validate all pages
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { childProfile: true },
    });

    for (const page of pages) {
      const validation = await this.storyEngine.validateContent(
        page.text,
        book!.childProfile.age,
      );
      if (!validation.valid) {
        this.logger.warn(`Validation issues on page ${page.pageNumber}: ${validation.issues.join(', ')}`);
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
