import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChildrenModule } from './children/children.module';
import { BooksModule } from './books/books.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './common/prisma.module';
import { StorageModule } from './common/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Job queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Core modules
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ChildrenModule,
    BooksModule,
    OrdersModule,
    PaymentsModule,
    SubscriptionsModule,
    FulfillmentModule,
    AdminModule,
    AiModule,
    EmailModule,
  ],
})
export class AppModule {}
