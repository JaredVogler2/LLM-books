import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'book-generation' }),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
