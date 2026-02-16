import { Module } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import { FulfillmentController } from './fulfillment.controller';
import { PrintfulProvider } from './providers/printful.provider';
import { LuluProvider } from './providers/lulu.provider';
import { BlurbProvider } from './providers/blurb.provider';

@Module({
  controllers: [FulfillmentController],
  providers: [
    FulfillmentService,
    PrintfulProvider,
    LuluProvider,
    BlurbProvider,
  ],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
