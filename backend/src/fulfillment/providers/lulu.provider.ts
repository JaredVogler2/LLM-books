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
export class LuluProvider implements FulfillmentProviderInterface {
  private readonly logger = new Logger(LuluProvider.name);
  readonly providerName = 'LULU';
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://api.lulu.com';

  constructor(private config: ConfigService) {
    this.apiKey = config.get('LULU_API_KEY', '');
    this.apiSecret = config.get('LULU_API_SECRET', '');
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/realms/glasstree/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      }),
    });
    const data = await response.json();
    return data.access_token;
  }

  async submitOrder(params: SubmitOrderParams): Promise<SubmitOrderResult> {
    const token = await this.getAccessToken();

    const body = {
      external_id: params.orderId,
      line_items: [
        {
          external_id: params.orderId,
          printable_normalization: {
            interior: { source_url: params.printFileUrl },
            cover: { source_url: params.coverFileUrl || params.printFileUrl },
          },
          quantity: params.quantity,
          title: 'StoryForge Book',
        },
      ],
      shipping_address: {
        name: params.shippingAddress.name,
        street1: params.shippingAddress.line1,
        city: params.shippingAddress.city,
        state_code: params.shippingAddress.state,
        postcode: params.shippingAddress.postalCode,
        country_code: params.shippingAddress.country,
      },
      shipping_level: params.shippingMethod || 'MAIL',
    };

    const response = await fetch(`${this.baseUrl}/print-jobs/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Lulu order submission failed: ${error}`);
      throw new Error(`Lulu API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      externalOrderId: String(data.id),
      status: data.status.name,
      providerResponse: data,
    };
  }

  async getOrderStatus(externalOrderId: string): Promise<OrderStatusResult> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/print-jobs/${externalOrderId}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Lulu API error: ${response.status}`);

    const data = await response.json();
    return {
      status: data.status.name,
      trackingNumber: data.line_items?.[0]?.tracking_id,
      trackingUrl: data.line_items?.[0]?.tracking_urls?.[0],
    };
  }

  async cancelOrder(externalOrderId: string): Promise<boolean> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/print-jobs/${externalOrderId}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.ok;
  }

  async getShippingRates(_params: ShippingRateParams): Promise<ShippingRate[]> {
    return [
      { method: 'MAIL', name: 'Standard Mail', priceCents: 499, estimatedDays: 10 },
      { method: 'PRIORITY_MAIL', name: 'Priority Mail', priceCents: 999, estimatedDays: 5 },
      { method: 'EXPRESS', name: 'Express', priceCents: 1599, estimatedDays: 2 },
    ];
  }
}
