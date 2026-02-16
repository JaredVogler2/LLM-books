import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  readonly stripe: Stripe;

  constructor(
    private config: ConfigService,
    private users: UsersService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2023-10-16',
    });
  }

  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await this.users.findByIdOrThrow(userId);

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      metadata: { userId },
    });

    await this.users.updateStripeCustomerId(userId, customer.id);
    this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;
  }

  async createPaymentIntent(
    customerId: string,
    amountCents: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      customer: customerId,
      amount: amountCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async createCoupon(params: {
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
    name: string;
  }): Promise<Stripe.Coupon> {
    return this.stripe.coupons.create({
      percent_off: params.percentOff,
      amount_off: params.amountOff,
      currency: params.currency || 'usd',
      duration: params.duration,
      duration_in_months: params.durationInMonths,
      name: params.name,
    });
  }

  async createRefund(
    paymentIntentId: string,
    amountCents?: number,
  ): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountCents,
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET', ''),
    );
  }
}
