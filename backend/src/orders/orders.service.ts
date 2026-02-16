import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BooksService } from '../books/books.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private booksService: BooksService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Calculate pricing for each book
    let subtotalCents = 0;
    const itemsData = [];

    for (const item of dto.items) {
      const priceCents = await this.booksService.calculatePrice(item.bookId);
      const totalPrice = priceCents * (item.quantity || 1);
      subtotalCents += totalPrice;
      itemsData.push({
        bookId: item.bookId,
        quantity: item.quantity || 1,
        unitPrice: priceCents,
        totalPrice,
      });
    }

    // Apply coupon if provided
    let discountCents = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode },
      });
      if (!coupon || !coupon.isActive) {
        throw new BadRequestException('Invalid coupon code');
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new BadRequestException('Coupon has expired');
      }
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
        throw new BadRequestException('Order does not meet minimum for this coupon');
      }

      if (coupon.discountPercent) {
        discountCents = Math.round(subtotalCents * coupon.discountPercent / 100);
      } else if (coupon.discountAmountCents) {
        discountCents = coupon.discountAmountCents;
      }
    }

    const shippingCents = dto.shippingMethod === 'express' ? 1299 : 599;
    const taxCents = Math.round((subtotalCents - discountCents) * 0.08); // 8% estimate
    const totalCents = subtotalCents - discountCents + taxCents + shippingCents;

    const order = await this.prisma.order.create({
      data: {
        userId,
        subtotalCents,
        discountCents,
        taxCents,
        shippingCents,
        totalCents,
        shippingAddress: dto.shippingAddress as any,
        billingAddress: dto.billingAddress as any,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });

    // Increment coupon usage
    if (dto.couponCode) {
      await this.prisma.coupon.update({
        where: { code: dto.couponCode },
        data: { currentUses: { increment: 1 } },
      });
    }

    return order;
  }

  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { book: true } },
        payments: true,
        fulfillmentOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { book: true } },
        payments: true,
        fulfillmentOrders: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
