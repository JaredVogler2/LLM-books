import { Controller, Post, Get, Param, Body, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FulfillmentService } from './fulfillment.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('fulfillment')
@Controller('fulfillment')
export class FulfillmentController {
  constructor(private fulfillmentService: FulfillmentService) {}

  @Post('orders/:orderId/submit')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Submit order to print provider (admin only)' })
  submitOrder(
    @Param('orderId') orderId: string,
    @Body('provider') provider?: string,
  ) {
    return this.fulfillmentService.submitToProvider(orderId, provider as any);
  }

  @Get('orders/:id/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get fulfillment status' })
  getStatus(@Param('id') id: string) {
    return this.fulfillmentService.syncOrderStatus(id);
  }

  @Post('webhook/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook for print provider status updates' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    // Provider-specific webhook handling
    // Each provider sends different payload formats
    return { received: true };
  }
}
