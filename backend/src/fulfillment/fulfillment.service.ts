import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { FulfillmentProviderInterface } from './fulfillment.interface';
import { PrintfulProvider } from './providers/printful.provider';
import { LuluProvider } from './providers/lulu.provider';
import { BlurbProvider } from './providers/blurb.provider';
import { FulfillmentProvider, FulfillmentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);
  private readonly providers: Map<string, FulfillmentProviderInterface>;

  constructor(
    private prisma: PrismaService,
    private printful: PrintfulProvider,
    private lulu: LuluProvider,
    private blurb: BlurbProvider,
  ) {
    this.providers = new Map([
      ['PRINTFUL', printful],
      ['LULU', lulu],
      ['BLURB', blurb],
    ]);
  }

  private getProvider(name: string): FulfillmentProviderInterface {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Unknown fulfillment provider: ${name}`);
    return provider;
  }

  async submitToProvider(
    orderId: string,
    providerName: FulfillmentProvider = FulfillmentProvider.PRINTFUL,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { book: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const provider = this.getProvider(providerName);
    const book = order.items[0]?.book;
    if (!book?.printPdfUrl) throw new Error('Print PDF not ready');

    const result = await provider.submitOrder({
      orderId: order.id,
      printFileUrl: book.printPdfUrl,
      coverFileUrl: book.coverImageUrl || undefined,
      quantity: order.items[0].quantity,
      bindingType: book.bindingType,
      paperType: book.paperType,
      bookSize: book.bookSize,
      pageCount: book.pageCount,
      shippingAddress: order.shippingAddress as any,
    });

    const fulfillmentOrder = await this.prisma.fulfillmentOrder.create({
      data: {
        orderId,
        provider: providerName,
        externalOrderId: result.externalOrderId,
        status: FulfillmentStatus.SUBMITTED,
        printFileUrl: book.printPdfUrl,
        providerResponse: result.providerResponse as any,
        submittedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PROCESSING },
    });

    this.logger.log(`Submitted order ${orderId} to ${providerName}: ${result.externalOrderId}`);
    return fulfillmentOrder;
  }

  async syncOrderStatus(fulfillmentOrderId: string) {
    const fo = await this.prisma.fulfillmentOrder.findUnique({
      where: { id: fulfillmentOrderId },
    });
    if (!fo || !fo.externalOrderId) throw new NotFoundException('Fulfillment order not found');

    const provider = this.getProvider(fo.provider);
    const status = await provider.getOrderStatus(fo.externalOrderId);

    const statusMap: Record<string, FulfillmentStatus> = {
      pending: FulfillmentStatus.PENDING,
      in_production: FulfillmentStatus.IN_PRODUCTION,
      shipped: FulfillmentStatus.SHIPPED,
      delivered: FulfillmentStatus.DELIVERED,
      cancelled: FulfillmentStatus.CANCELLED,
      failed: FulfillmentStatus.FAILED,
    };

    const mappedStatus = statusMap[status.status.toLowerCase()] || fo.status;

    await this.prisma.fulfillmentOrder.update({
      where: { id: fulfillmentOrderId },
      data: {
        status: mappedStatus,
        trackingNumber: status.trackingNumber || fo.trackingNumber,
        trackingUrl: status.trackingUrl || fo.trackingUrl,
        shippingCarrier: status.shippingCarrier || fo.shippingCarrier,
        shippedAt: status.shippedAt || fo.shippedAt,
        deliveredAt: status.deliveredAt || fo.deliveredAt,
      },
    });

    // Update parent order status
    if (mappedStatus === FulfillmentStatus.SHIPPED) {
      await this.prisma.order.update({
        where: { id: fo.orderId },
        data: { status: OrderStatus.SHIPPED },
      });
    } else if (mappedStatus === FulfillmentStatus.DELIVERED) {
      await this.prisma.order.update({
        where: { id: fo.orderId },
        data: { status: OrderStatus.DELIVERED },
      });
    }

    return { status: mappedStatus, trackingNumber: status.trackingNumber };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async syncAllPendingOrders() {
    const pending = await this.prisma.fulfillmentOrder.findMany({
      where: {
        status: {
          in: [FulfillmentStatus.SUBMITTED, FulfillmentStatus.ACCEPTED, FulfillmentStatus.IN_PRODUCTION, FulfillmentStatus.SHIPPED],
        },
      },
    });

    for (const fo of pending) {
      try {
        await this.syncOrderStatus(fo.id);
      } catch (error) {
        this.logger.error(`Failed to sync fulfillment order ${fo.id}: ${error}`);
      }
    }
  }
}
