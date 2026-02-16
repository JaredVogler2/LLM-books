export interface FulfillmentProviderInterface {
  readonly providerName: string;

  submitOrder(params: SubmitOrderParams): Promise<SubmitOrderResult>;
  getOrderStatus(externalOrderId: string): Promise<OrderStatusResult>;
  cancelOrder(externalOrderId: string): Promise<boolean>;
  getShippingRates(params: ShippingRateParams): Promise<ShippingRate[]>;
}

export interface SubmitOrderParams {
  orderId: string;
  printFileUrl: string;
  coverFileUrl?: string;
  quantity: number;
  bindingType: string;
  paperType: string;
  bookSize: string;
  pageCount: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingMethod?: string;
}

export interface SubmitOrderResult {
  externalOrderId: string;
  status: string;
  estimatedDelivery?: Date;
  providerResponse?: Record<string, unknown>;
}

export interface OrderStatusResult {
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface ShippingRateParams {
  destinationCountry: string;
  destinationState?: string;
  quantity: number;
}

export interface ShippingRate {
  method: string;
  name: string;
  priceCents: number;
  estimatedDays: number;
}
