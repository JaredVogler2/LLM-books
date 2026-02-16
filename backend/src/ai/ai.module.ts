import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StoryEngineService } from './story/story-engine.service';
import { IllustrationEngineService } from './illustration/illustration-engine.service';
import { CharacterEngineService } from './character/character-engine.service';
import { PdfAssemblyService } from './pdf/pdf-assembly.service';
import { BookGenerationProcessor } from './book-generation.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'book-generation' },
      { name: 'illustration-generation' },
    ),
  ],
  providers: [
    StoryEngineService,
    IllustrationEngineService,
    CharacterEngineService,
    PdfAssemblyService,
    BookGenerationProcessor,
  ],
  exports: [
    StoryEngineService,
    IllustrationEngineService,
    CharacterEngineService,
    PdfAssemblyService,
  ],
})
export class AiModule {}
