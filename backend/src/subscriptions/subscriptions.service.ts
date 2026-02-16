import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { SubscriptionStatus, SubscriptionType } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async create(userId: string, type: SubscriptionType, childProfileId: string) {
    const customerId = await this.stripeService.getOrCreateCustomer(userId);

    // Map subscription type to Stripe price ID
    const priceMap: Record<SubscriptionType, string> = {
      BIRTHDAY_YEARLY: 'price_birthday_yearly',
      HOLIDAY_SEASONAL: 'price_holiday_seasonal',
      QUARTERLY_ADVENTURE: 'price_quarterly_adventure',
    };

    const stripeSubscription = await this.stripeService.createSubscription(
      customerId,
      priceMap[type],
      { userId, childProfileId, type },
    );

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        type,
        childProfileId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceMap[type],
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        nextBillingDate: new Date((stripeSubscription as any).current_period_end * 1000),
      },
    });

    this.logger.log(`Created ${type} subscription for user ${userId}`);
    return {
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: string, userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, userId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    if (sub.stripeSubscriptionId) {
      await this.stripeService.cancelSubscription(sub.stripeSubscriptionId);
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkBirthdayReminders() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcoming = await this.prisma.subscription.findMany({
      where: {
        type: SubscriptionType.BIRTHDAY_YEARLY,
        status: SubscriptionStatus.ACTIVE,
        nextGenerationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: { user: true },
    });

    for (const sub of upcoming) {
      this.logger.log(`Birthday subscription reminder for user ${sub.userId}`);
      // TODO: Trigger reminder email via EmailService
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processAutoGenerations() {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextGenerationDate: { lte: new Date() },
      },
    });

    for (const sub of due) {
      this.logger.log(`Auto-generation due for subscription ${sub.id}`);
      // TODO: Trigger book generation via BooksService
    }
  }
}
