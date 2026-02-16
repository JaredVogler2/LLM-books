import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { BooksService } from '../books/books.service';
import { PaymentsService } from '../payments/payments.service';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private booksService: BooksService,
    private paymentsService: PaymentsService,
    private fulfillmentService: FulfillmentService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('conversions')
  @ApiOperation({ summary: 'Get conversion funnel metrics' })
  getConversions() {
    return this.adminService.getConversionFunnel();
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get detailed order info for admin' })
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrderDetails(id);
  }

  @Post('orders/:id/regenerate')
  @ApiOperation({ summary: 'Regenerate a book for an order' })
  async regenerateBook(@Param('id') orderId: string) {
    const order = await this.adminService.getOrderDetails(orderId);
    if (!order?.items[0]?.bookId) throw new Error('No book found');
    return this.booksService.startGeneration(order.items[0].bookId, order.userId);
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: 'Process refund for an order' })
  refundOrder(
    @Param('id') orderId: string,
    @Body('amountCents') amountCents?: number,
  ) {
    return this.paymentsService.processRefund(orderId, amountCents);
  }

  @Post('orders/:id/fulfill')
  @ApiOperation({ summary: 'Submit order to fulfillment provider' })
  fulfillOrder(
    @Param('id') orderId: string,
    @Body('provider') provider?: string,
  ) {
    return this.fulfillmentService.submitToProvider(orderId, provider as any);
  }
}
