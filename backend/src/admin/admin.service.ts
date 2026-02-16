import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalBooks,
      totalOrders,
      totalRevenue,
      activeSubscriptions,
      booksByStatus,
      recentOrders,
      topThemes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.book.count(),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.book.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.order.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true } }, items: true },
      }),
      this.prisma.childProfile.findMany({
        select: { themes: true },
      }),
    ]);

    // Calculate theme popularity
    const themeCounts: Record<string, number> = {};
    for (const child of topThemes) {
      for (const theme of child.themes) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    }
    const sortedThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // AOV calculation
    const paidOrders = await this.prisma.order.findMany({
      where: { status: { in: ['PAID', 'PROCESSING', 'FULFILLED', 'SHIPPED', 'DELIVERED'] } },
      select: { totalCents: true },
    });
    const aovCents = paidOrders.length > 0
      ? Math.round(paidOrders.reduce((sum, o) => sum + o.totalCents, 0) / paidOrders.length)
      : 0;

    return {
      totalUsers,
      totalBooks,
      totalOrders,
      totalRevenueCents: totalRevenue._sum.amount || 0,
      activeSubscriptions,
      aovCents,
      booksByStatus,
      recentOrders,
      topThemes: sortedThemes.map(([theme, count]) => ({ theme, count })),
    };
  }

  async getOrderDetails(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: { include: { book: { include: { pages: true, childProfile: true } } } },
        payments: true,
        fulfillmentOrders: true,
        emailEvents: true,
      },
    });
  }

  async getConversionFunnel() {
    const [started, generated, ordered, paid] = await Promise.all([
      this.prisma.book.count(),
      this.prisma.book.count({ where: { status: { not: 'DRAFT' } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: { not: 'PENDING' } } }),
    ]);
    return {
      booksStarted: started,
      booksGenerated: generated,
      ordersCreated: ordered,
      ordersPaid: paid,
      conversionRate: started > 0 ? ((paid / started) * 100).toFixed(1) + '%' : '0%',
    };
  }
}
