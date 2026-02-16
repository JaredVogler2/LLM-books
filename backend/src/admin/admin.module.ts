import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BooksModule } from '../books/books.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';

@Module({
  imports: [BooksModule, OrdersModule, PaymentsModule, FulfillmentModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
