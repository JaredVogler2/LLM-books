import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  RawBodyRequest,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService,
  ) {}

  @Post('orders/:orderId/pay')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create payment intent for an order' })
  createPayment(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createPaymentForOrder(orderId, userId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeService.constructWebhookEvent(
      req.rawBody!,
      signature,
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as any;
        await this.paymentsService.handlePaymentSuccess(intent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as any;
        await this.paymentsService.handlePaymentFailure(
          intent.id,
          intent.last_payment_error?.message,
        );
        break;
      }
    }

    return { received: true };
  }
}
