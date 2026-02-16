import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../common/prisma.service';

interface EmailParams {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  orderId?: string;
}

const TEMPLATES: Record<string, string> = {
  'order-confirmation': `
    <h1>Order Confirmed!</h1>
    <p>Hi {{firstName}},</p>
    <p>Your StoryForge book "{{bookTitle}}" is being created!</p>
    <p>Order #{{orderId}}</p>
    <p>We'll send you updates as your book progresses through creation and printing.</p>
  `,
  'book-ready': `
    <h1>Your Book is Ready!</h1>
    <p>Hi {{firstName}},</p>
    <p>"{{bookTitle}}" has been sent to our printing partner.</p>
    <p>Estimated delivery: {{estimatedDelivery}}</p>
  `,
  'shipping-update': `
    <h1>Your Book Has Shipped!</h1>
    <p>Hi {{firstName}},</p>
    <p>Great news! "{{bookTitle}}" is on its way.</p>
    <p>Tracking: <a href="{{trackingUrl}}">{{trackingNumber}}</a></p>
  `,
  'subscription-reminder': `
    <h1>Upcoming Book Renewal</h1>
    <p>Hi {{firstName}},</p>
    <p>{{childName}}'s next personalized book will be generated in 30 days!</p>
    <p>Want to update their profile? <a href="{{profileUrl}}">Click here</a></p>
  `,
  'abandoned-cart': `
    <h1>You Left Something Behind!</h1>
    <p>Hi {{firstName}},</p>
    <p>You started creating a book for {{childName}} but didn't finish.</p>
    <p><a href="{{resumeUrl}}">Continue creating your book</a></p>
  `,
  'review-request': `
    <h1>How Did We Do?</h1>
    <p>Hi {{firstName}},</p>
    <p>We hope {{childName}} loved "{{bookTitle}}"!</p>
    <p><a href="{{reviewUrl}}">Leave a review</a></p>
  `,
  'digital-pdf-delivery': `
    <h1>Your Digital Book is Ready!</h1>
    <p>Hi {{firstName}},</p>
    <p>Your digital copy of "{{bookTitle}}" is ready to download.</p>
    <p><a href="{{downloadUrl}}">Download PDF</a></p>
  `,
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    sgMail.setApiKey(config.get('SENDGRID_API_KEY', ''));
  }

  async send(params: EmailParams): Promise<void> {
    const templateSource = TEMPLATES[params.template];
    if (!templateSource) {
      this.logger.error(`Email template not found: ${params.template}`);
      return;
    }

    const compiled = Handlebars.compile(templateSource);
    const html = compiled(params.data);

    try {
      await sgMail.send({
        to: params.to,
        from: this.config.get('SENDGRID_FROM_EMAIL', 'hello@storyforge.ai'),
        subject: params.subject,
        html,
      });

      await this.prisma.emailEvent.create({
        data: {
          orderId: params.orderId,
          email: params.to,
          type: params.template,
          subject: params.subject,
          status: 'sent',
        },
      });

      this.logger.log(`Sent ${params.template} email to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);

      await this.prisma.emailEvent.create({
        data: {
          orderId: params.orderId,
          email: params.to,
          type: params.template,
          subject: params.subject,
          status: 'failed',
          metadata: { error: String(error) } as any,
        },
      });
    }
  }

  async sendOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { book: true } },
      },
    });
    if (!order) return;

    await this.send({
      to: order.user.email,
      subject: `Order Confirmed - ${order.items[0]?.book?.title || 'Your StoryForge Book'}`,
      template: 'order-confirmation',
      data: {
        firstName: order.user.firstName || 'there',
        bookTitle: order.items[0]?.book?.title || 'Your Book',
        orderId: order.id,
      },
      orderId: order.id,
    });
  }

  async sendShippingUpdate(orderId: string, trackingNumber: string, trackingUrl: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { book: true } },
      },
    });
    if (!order) return;

    await this.send({
      to: order.user.email,
      subject: `Your Book Has Shipped! - ${order.items[0]?.book?.title}`,
      template: 'shipping-update',
      data: {
        firstName: order.user.firstName || 'there',
        bookTitle: order.items[0]?.book?.title || 'Your Book',
        trackingNumber,
        trackingUrl,
      },
      orderId: order.id,
    });
  }
}
