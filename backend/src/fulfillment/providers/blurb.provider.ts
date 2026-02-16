import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FulfillmentProviderInterface,
  SubmitOrderParams,
  SubmitOrderResult,
  OrderStatusResult,
  ShippingRateParams,
  ShippingRate,
} from '../fulfillment.interface';

@Injectable()
export class BlurbProvider implements FulfillmentProviderInterface {
  private readonly logger = new Logger(BlurbProvider.name);
  readonly providerName = 'BLURB';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.blurb.com/v1';

  constructor(private config: ConfigService) {
    this.apiKey = config.get('BLURB_API_KEY', '');
  }

  async submitOrder(params: SubmitOrderParams): Promise<SubmitOrderResult> {
    this.logger.log(`Submitting order to Blurb: ${params.orderId}`);
    // Blurb API integration - implementation depends on their specific API
    // This is a structured placeholder matching the interface contract
    throw new Error('Blurb integration not yet configured. Use Printful or Lulu.');
  }

  async getOrderStatus(externalOrderId: string): Promise<OrderStatusResult> {
    throw new Error('Blurb integration not yet configured.');
  }

  async cancelOrder(externalOrderId: string): Promise<boolean> {
    throw new Error('Blurb integration not yet configured.');
  }

  async getShippingRates(_params: ShippingRateParams): Promise<ShippingRate[]> {
    return [
      { method: 'STANDARD', name: 'Standard Shipping', priceCents: 699, estimatedDays: 10 },
    ];
  }
}
