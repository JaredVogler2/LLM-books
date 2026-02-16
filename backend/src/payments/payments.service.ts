import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { StripeService } from './stripe.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createPaymentForOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in pending state');
    }

    const customerId = await this.stripeService.getOrCreateCustomer(userId);
    const paymentIntent = await this.stripeService.createPaymentIntent(
      customerId,
      order.totalCents,
      order.currency,
      { orderId: order.id, userId },
    );

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: order.totalCents,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey: this.stripeService['config'].get('STRIPE_PUBLISHABLE_KEY'),
    };
  }

  async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment) {
      this.logger.warn(`Payment not found for intent ${paymentIntentId}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.PAID },
    });

    this.logger.log(`Payment succeeded for order ${payment.orderId}`);
  }

  async handlePaymentFailure(paymentIntentId: string, message?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureMessage: message,
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.FAILED },
    });

    this.logger.warn(`Payment failed for order ${payment.orderId}: ${message}`);
  }

  async processRefund(orderId: string, amountCents?: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.SUCCEEDED },
    });
    if (!payment || !payment.stripePaymentIntentId) {
      throw new NotFoundException('Successful payment not found for this order');
    }

    const refund = await this.stripeService.createRefund(
      payment.stripePaymentIntentId,
      amountCents,
    );

    const newStatus = amountCents && amountCents < payment.amount
      ? PaymentStatus.PARTIALLY_REFUNDED
      : PaymentStatus.REFUNDED;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        refundedAmount: { increment: refund.amount || 0 },
      },
    });

    if (newStatus === PaymentStatus.REFUNDED) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      });
    }

    this.logger.log(`Refund processed for order ${orderId}: ${refund.amount} cents`);
    return refund;
  }
}
