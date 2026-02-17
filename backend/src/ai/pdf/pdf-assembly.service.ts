import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../../common/storage.service';

interface PdfOptions {
  bleedMm: number;
  trimMm: number;
  dpi: number;
  cmyk: boolean;
  embedFonts: boolean;
}

const BOOK_DIMENSIONS: Record<string, { widthPt: number; heightPt: number }> = {
  SQUARE_8X8: { widthPt: 576, heightPt: 576 },        // 8" x 8" at 72 DPI
  PORTRAIT_8_5X11: { widthPt: 612, heightPt: 792 },   // 8.5" x 11"
  LANDSCAPE_11X8_5: { widthPt: 792, heightPt: 612 },  // 11" x 8.5"
};

@Injectable()
export class PdfAssemblyService {
  private readonly logger = new Logger(PdfAssemblyService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async assemblePrintPdf(bookId: string): Promise<string> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        pages: { orderBy: { pageNumber: 'asc' } },
        childProfile: true,
      },
    });
    if (!book) throw new Error('Book not found');

    const dimensions = BOOK_DIMENSIONS[book.bookSize] || BOOK_DIMENSIONS.SQUARE_8X8;
    const bleedPt = 9; // ~3mm bleed = ~9pt

    const doc = new PDFDocument({
      size: [dimensions.widthPt + bleedPt * 2, dimensions.heightPt + bleedPt * 2],
      margin: 0,
      info: {
        Title: book.title || 'My Crayons & Quills Book',
        Author: 'Crayons & Quills',
        Subject: `A personalized book for ${book.childProfile.name}`,
        Creator: 'Crayons & Quills Platform',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Cover Page
    if (book.coverImageUrl) {
      try {
        const coverResponse = await fetch(book.coverImageUrl);
        const coverBuffer = Buffer.from(await coverResponse.arrayBuffer());
        doc.image(coverBuffer, 0, 0, {
          width: dimensions.widthPt + bleedPt * 2,
          height: dimensions.heightPt + bleedPt * 2,
        });
      } catch {
        // Fallback: colored cover with title
        doc.rect(0, 0, dimensions.widthPt + bleedPt * 2, dimensions.heightPt + bleedPt * 2)
          .fill('#4A90D9');
        doc.fontSize(36)
          .fill('#FFFFFF')
          .text(book.title || 'My Story', bleedPt + 50, dimensions.heightPt / 2 - 20, {
            width: dimensions.widthPt - 100,
            align: 'center',
          });
      }
    }

    // Dedication page
    if (book.dedicationText) {
      doc.addPage();
      doc.fontSize(16)
        .fill('#333333')
        .text(book.dedicationText, bleedPt + 72, dimensions.heightPt / 2 - 40, {
          width: dimensions.widthPt - 144,
          align: 'center',
        });
    }

    // Content pages
    for (const page of book.pages) {
      doc.addPage();

      const contentX = bleedPt + 36;
      const contentY = bleedPt + 36;
      const contentWidth = dimensions.widthPt - 72;
      const contentHeight = dimensions.heightPt - 72;

      // Place illustration if available
      if (page.imageUrl) {
        try {
          const imgResponse = await fetch(page.imageUrl);
          const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());

          switch (page.layoutType) {
            case 'FULL_PAGE_ILLUSTRATION':
              doc.image(imgBuffer, 0, 0, {
                width: dimensions.widthPt + bleedPt * 2,
                height: dimensions.heightPt + bleedPt * 2,
              });
              // Text overlay at bottom
              doc.rect(contentX, contentY + contentHeight - 100, contentWidth, 80)
                .fillOpacity(0.85).fill('#FFFFFF');
              doc.fillOpacity(1).fontSize(14).fill('#333333')
                .text(page.text, contentX + 20, contentY + contentHeight - 90, {
                  width: contentWidth - 40,
                  align: 'center',
                });
              break;

            case 'TEXT_LEFT_IMAGE_RIGHT':
              doc.fontSize(14).fill('#333333')
                .text(page.text, contentX, contentY + 20, {
                  width: contentWidth / 2 - 20,
                });
              doc.image(imgBuffer, contentX + contentWidth / 2 + 10, contentY, {
                width: contentWidth / 2 - 10,
                height: contentHeight,
                fit: [contentWidth / 2 - 10, contentHeight],
              });
              break;

            case 'TEXT_RIGHT_IMAGE_LEFT':
              doc.image(imgBuffer, contentX, contentY, {
                width: contentWidth / 2 - 10,
                height: contentHeight,
                fit: [contentWidth / 2 - 10, contentHeight],
              });
              doc.fontSize(14).fill('#333333')
                .text(page.text, contentX + contentWidth / 2 + 10, contentY + 20, {
                  width: contentWidth / 2 - 10,
                });
              break;

            case 'TEXT_BELOW_IMAGE':
            default:
              doc.image(imgBuffer, contentX, contentY, {
                width: contentWidth,
                height: contentHeight * 0.65,
                fit: [contentWidth, contentHeight * 0.65],
              });
              doc.fontSize(14).fill('#333333')
                .text(page.text, contentX + 20, contentY + contentHeight * 0.7, {
                  width: contentWidth - 40,
                  align: 'center',
                });
              break;
          }
        } catch {
          // Fallback: text only
          doc.fontSize(16).fill('#333333')
            .text(page.text, contentX + 40, contentY + contentHeight / 3, {
              width: contentWidth - 80,
              align: 'center',
            });
        }
      } else {
        // Text-only page
        doc.fontSize(16).fill('#333333')
          .text(page.text, contentX + 40, contentY + contentHeight / 3, {
            width: contentWidth - 80,
            align: 'center',
          });
      }

      // Page number
      doc.fontSize(10).fill('#999999')
        .text(String(page.pageNumber), 0, dimensions.heightPt + bleedPt - 20, {
          width: dimensions.widthPt + bleedPt * 2,
          align: 'center',
        });
    }

    // Back cover
    doc.addPage();
    doc.rect(0, 0, dimensions.widthPt + bleedPt * 2, dimensions.heightPt + bleedPt * 2)
      .fill('#F5F5F5');
    doc.fontSize(12).fill('#666666')
      .text('Created with Crayons & Quills', bleedPt + 50, dimensions.heightPt / 2, {
        width: dimensions.widthPt - 100,
        align: 'center',
      });
    // ISBN placeholder
    doc.fontSize(10).fill('#999999')
      .text('ISBN: 000-0-00-000000-0', bleedPt + 50, dimensions.heightPt - 60, {
        width: dimensions.widthPt - 100,
        align: 'center',
      });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Upload print PDF
    const printKey = await this.storage.uploadBookAsset(
      pdfBuffer,
      bookId,
      'print-ready.pdf',
      'application/pdf',
    );

    await this.prisma.book.update({
      where: { id: bookId },
      data: { printPdfUrl: this.storage.getPublicUrl(printKey) },
    });

    this.logger.log(`Assembled print PDF for book ${bookId} (${pdfBuffer.length} bytes)`);
    return printKey;
  }

  async assembleDigitalPdf(bookId: string): Promise<string> {
    // Digital PDF is similar but optimized for screen viewing (RGB, lower DPI)
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        pages: { orderBy: { pageNumber: 'asc' } },
        childProfile: true,
      },
    });
    if (!book) throw new Error('Book not found');

    const dimensions = BOOK_DIMENSIONS[book.bookSize] || BOOK_DIMENSIONS.SQUARE_8X8;

    const doc = new PDFDocument({
      size: [dimensions.widthPt, dimensions.heightPt],
      margin: 36,
      info: {
        Title: book.title || 'My Crayons & Quills Book',
        Author: 'Crayons & Quills',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Simplified digital layout
    doc.fontSize(28).fill('#333333')
      .text(book.title || 'My Story', 36, dimensions.heightPt / 2 - 40, {
        width: dimensions.widthPt - 72,
        align: 'center',
      });

    if (book.dedicationText) {
      doc.addPage();
      doc.fontSize(14).fill('#666666')
        .text(book.dedicationText, 72, dimensions.heightPt / 2 - 20, {
          width: dimensions.widthPt - 144,
          align: 'center',
        });
    }

    for (const page of book.pages) {
      doc.addPage();
      doc.fontSize(16).fill('#333333')
        .text(page.text, 50, dimensions.heightPt / 2 - 40, {
          width: dimensions.widthPt - 100,
          align: 'center',
        });
    }

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const digitalKey = await this.storage.uploadBookAsset(
      pdfBuffer,
      bookId,
      'digital.pdf',
      'application/pdf',
    );

    await this.prisma.book.update({
      where: { id: bookId },
      data: { digitalPdfUrl: this.storage.getPublicUrl(digitalKey) },
    });

    this.logger.log(`Assembled digital PDF for book ${bookId}`);
    return digitalKey;
  }
}
