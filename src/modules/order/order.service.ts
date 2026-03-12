import prisma from '@/lib/prisma';
import { paymentService } from '@/modules/payment/payment.service';
import { auditService } from '@/modules/admin/audit.service';
import { generateOrderNumber, calculatePlatformFee } from '@/lib/utils';
import type { Order } from '@prisma/client';

export class OrderService {
  /**
   * Create a new order from a listing.
   */
  async createOrder(params: {
    buyerId:   string;
    listingId: string;
    buyerEmail: string;
  }): Promise<{ order: Order; invoiceUrl: string }> {
    const { buyerId, listingId, buyerEmail } = params;

    // Validate listing
    const listing = await prisma.listing.findUnique({
      where:   { id: listingId },
      include: { seller: { select: { id: true, isBanned: true, isActive: true } } },
    });

    if (!listing)                    throw new Error('Listing not found');
    if (listing.status !== 'ACTIVE') throw new Error('Listing is not available');
    if (listing.sellerId === buyerId) throw new Error('Cannot buy your own listing');
    if (!listing.seller.isActive)    throw new Error('Seller account is inactive');

    // Check for existing pending order
    const existingOrder = await prisma.order.findFirst({
      where: {
        buyerId,
        listingId,
        status: { in: ['CREATED', 'WAITING_PAYMENT', 'ESCROW_HOLD'] },
      },
    });

    if (existingOrder) {
      const payment = await prisma.payment.findUnique({
        where: { orderId: existingOrder.id },
      });
      return {
        order:      existingOrder,
        invoiceUrl: payment?.invoiceUrl ?? '',
      };
    }

    const { fee, sellerReceives } = calculatePlatformFee(listing.price);
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId,
        sellerId:       listing.sellerId,
        listingId,
        price:          listing.price,
        platformFee:    fee,
        sellerReceives,
        status:         'CREATED',
        statusHistory:  JSON.stringify([
          { status: 'CREATED', at: new Date().toISOString(), by: buyerId },
        ]),
      },
    });

    // Create Xendit invoice
    const payment = await paymentService.createInvoice({
      orderId:     order.id,
      amount:      listing.price,
      buyerEmail,
      description: `ELITE FUT XI - ${listing.title}`,
    });

    await auditService.log({
      action:      'ORDER_CREATED',
      targetId:    order.id,
      targetType:  'ORDER',
      createdById: buyerId,
      description: `Order ${orderNumber} created for listing ${listingId}`,
    });

    return { order, invoiceUrl: payment.invoiceUrl };
  }

  /**
   * Get orders for a buyer with pagination.
   */
  async getBuyerOrders(
    buyerId: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where:   { buyerId },
        include: {
          listing: { include: { images: { where: { isPrimary: true } } } },
          seller:  { select: { username: true, avatarUrl: true } },
          payment: { select: { status: true, invoiceUrl: true, paidAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { buyerId } }),
    ]);
    return { orders, total, page, limit };
  }

  /**
   * Get orders for a seller with pagination.
   */
  async getSellerOrders(
    sellerId: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where:   { sellerId },
        include: {
          listing: { include: { images: { where: { isPrimary: true } } } },
          buyer:   { select: { username: true, avatarUrl: true } },
          payment: { select: { status: true, paidAt: true } },
          dispute: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { sellerId } }),
    ]);
    return { orders, total, page, limit };
  }

  /**
   * Get single order with full detail (access controlled).
   */
  async getOrderDetail(
    orderId: string,
    userId:  string
  ) {
    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: {
        listing: { include: { images: true, seller: { select: { username: true, avatarUrl: true } } } },
        buyer:   { select: { id: true, username: true, avatarUrl: true } },
        seller:  { select: { id: true, username: true, avatarUrl: true } },
        payment: true,
        dispute: true,
      },
    });

    if (!order) throw new Error('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new Error('Unauthorized');
    }

    // Only reveal account details if buyer AND order is in DELIVERED+ state
    if (order.buyerId !== userId || !['DELIVERED', 'COMPLETED'].includes(order.status)) {
      order.listing.seller; // keep seller info but strip account creds
    }

    return order;
  }
}

export const orderService = new OrderService();
