import prisma from '@/lib/prisma';
import { auditService } from './audit.service';

export class AdminService {
  async getDashboardMetrics() {
    const now      = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      totalOrders,
      todayOrders,
      openDisputes,
      pendingWithdrawals,
      pendingKyc,
      completedOrdersValue,
      escrowValue,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: dayStart } } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.withdrawRequest.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.kyc.count({ where: { status: 'PENDING' } }),
      prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { price: true } }),
      prisma.order.aggregate({ where: { status: 'ESCROW_HOLD' }, _sum: { price: true } }),
    ]);

    return {
      users:       { total: totalUsers, sellers: totalSellers },
      listings:    { total: totalListings, active: activeListings },
      orders:      { total: totalOrders, today: todayOrders },
      disputes:    { open: openDisputes },
      withdrawals: { pending: pendingWithdrawals },
      kyc:         { pending: pendingKyc },
      financials:  {
        totalVolume: completedOrdersValue._sum.price ?? BigInt(0),
        escrowValue: escrowValue._sum.price ?? BigInt(0),
      },
    };
  }

  async reviewKyc(params: {
    kycId:   string;
    adminId: string;
    status:  'APPROVED' | 'REJECTED' | 'RESUBMIT';
    note?:   string;
  }) {
    const kyc = await prisma.kyc.findUnique({
      where:   { id: params.kycId },
      include: { user: { select: { id: true } } },
    });
    if (!kyc) throw new Error('KYC not found');

    await prisma.$transaction(async (tx) => {
      await tx.kyc.update({
        where: { id: params.kycId },
        data: {
          status:     params.status,
          reviewNote: params.note,
          reviewedBy: params.adminId,
          reviewedAt: new Date(),
        },
      });
      if (params.status === 'APPROVED') {
        await tx.user.update({
          where: { id: kyc.userId },
          data:  { role: 'SELLER' },
        });
      }
    });

    await auditService.log({
      action:      params.status === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      targetId:    kyc.userId,
      targetType:  'USER',
      createdById: params.adminId,
      description: `KYC ${params.status} for user ${kyc.userId}`,
      metadata:    { note: params.note },
    });
  }

  async banUser(params: {
    userId:  string;
    adminId: string;
    reason:  string;
  }) {
    await prisma.user.update({
      where: { id: params.userId },
      data:  { isBanned: true, bannedReason: params.reason, bannedAt: new Date() },
    });
    await auditService.log({
      action:      'USER_BANNED',
      targetId:    params.userId,
      targetType:  'USER',
      createdById: params.adminId,
      description: `User ${params.userId} banned: ${params.reason}`,
    });
  }

  async suspendListing(params: {
    listingId: string;
    adminId:   string;
    reason:    string;
  }) {
    await prisma.listing.update({
      where: { id: params.listingId },
      data:  { status: 'SUSPENDED' },
    });
    await auditService.log({
      action:      'LISTING_SUSPENDED',
      targetId:    params.listingId,
      targetType:  'LISTING',
      createdById: params.adminId,
      description: `Listing ${params.listingId} suspended: ${params.reason}`,
    });
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip  = (page - 1) * limit;
    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { username: { contains: search, mode: 'insensitive' as const } }] }
      : {};
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: { kyc: { select: { status: true } }, _count: { select: { ordersAsBuyer: true, ordersAsSeller: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async getPendingKyc(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await prisma.$transaction([
      prisma.kyc.findMany({
        where:   { status: 'PENDING' },
        include: { user: { select: { id: true, email: true, username: true, createdAt: true } } },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.kyc.count({ where: { status: 'PENDING' } }),
    ]);
    return { items, total, page, limit };
  }

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const skip  = (page - 1) * limit;
    const where = status ? { status: status as never } : {};
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          buyer:   { select: { username: true } },
          seller:  { select: { username: true } },
          listing: { select: { title: true } },
          payment: { select: { status: true, paidAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit };
  }

  async getAllDisputes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [disputes, total] = await prisma.$transaction([
      prisma.dispute.findMany({
        include: {
          buyer:  { select: { username: true } },
          seller: { select: { username: true } },
          order:  { select: { orderNumber: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count(),
    ]);
    return { disputes, total, page, limit };
  }

  async getAllWithdrawals(page = 1, limit = 20, status?: string) {
    const skip  = (page - 1) * limit;
    const where = status ? { status: status as never } : {};
    const [withdrawals, total] = await prisma.$transaction([
      prisma.withdrawRequest.findMany({
        where,
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawRequest.count({ where }),
    ]);
    return { withdrawals, total, page, limit };
  }
}

export const adminService = new AdminService();
