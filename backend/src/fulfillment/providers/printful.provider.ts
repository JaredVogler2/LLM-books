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
export class PrintfulProvider implements FulfillmentProviderInterface {
  private readonly logger = new Logger(PrintfulProvider.name);
  readonly providerName = 'PRINTFUL';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.printful.com';

  constructor(private config: ConfigService) {
    this.apiKey = config.get('PRINTFUL_API_KEY', '');
  }

  async submitOrder(params: SubmitOrderParams): Promise<SubmitOrderResult> {
    const body = {
      recipient: {
        name: params.shippingAddress.name,
        address1: params.shippingAddress.line1,
        address2: params.shippingAddress.line2,
        city: params.shippingAddress.city,
        state_code: params.shippingAddress.state,
        zip: params.shippingAddress.postalCode,
        country_code: params.shippingAddress.country,
      },
      items: [
        {
          quantity: params.quantity,
          files: [
            { type: 'inside', url: params.printFileUrl },
            ...(params.coverFileUrl ? [{ type: 'outside', url: params.coverFileUrl }] : []),
          ],
        },
      ],
      external_id: params.orderId,
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Printful order submission failed: ${error}`);
      throw new Error(`Printful API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      externalOrderId: String(data.result.id),
      status: data.result.status,
      providerResponse: data.result,
    };
  }

  async getOrderStatus(externalOrderId: string): Promise<OrderStatusResult> {
    const response = await fetch(`${this.baseUrl}/orders/${externalOrderId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    if (!response.ok) throw new Error(`Printful API error: ${response.status}`);

    const data = await response.json();
    const order = data.result;

    return {
      status: order.status,
      trackingNumber: order.shipments?.[0]?.tracking_number,
      trackingUrl: order.shipments?.[0]?.tracking_url,
      shippingCarrier: order.shipments?.[0]?.carrier,
      shippedAt: order.shipments?.[0]?.ship_date ? new Date(order.shipments[0].ship_date) : undefined,
    };
  }

  async cancelOrder(externalOrderId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/orders/${externalOrderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    return response.ok;
  }

  async getShippingRates(params: ShippingRateParams): Promise<ShippingRate[]> {
    return [
      { method: 'STANDARD', name: 'Standard Shipping', priceCents: 599, estimatedDays: 7 },
      { method: 'EXPRESS', name: 'Express Shipping', priceCents: 1299, estimatedDays: 3 },
    ];
  }
}
