import prisma from '@/lib/prisma';
import { createXenditInvoice } from './xendit.client';
import type { CreatePaymentInput, PaymentResult } from './types';

/**
 * Payment Service.
 * Handles invoice creation and payment record management.
 */
export class PaymentService {
  /**
   * Create a Xendit invoice for an order.
   */
  async createInvoice(
    input: CreatePaymentInput
  ): Promise<PaymentResult> {
    const { orderId, amount, buyerEmail, description } = input;

    // Check if payment already exists (idempotency)
    const existing = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existing && existing.status === 'PENDING') {
      return {
        paymentId:  existing.id,
        invoiceUrl: existing.invoiceUrl,
        expiresAt:  existing.expiresAt,
      };
    }

    // Create Xendit invoice
    const invoice = await createXenditInvoice({
      externalId:  orderId,
      amount:      Number(amount),
      payerEmail:  buyerEmail,
      description,
    });

    const expiresAt = new Date(invoice.expiryDate);

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        xenditInvoiceId: invoice.id,
        amount,
        status:          'PENDING',
        invoiceUrl:      invoice.invoiceUrl,
        expiresAt,
        idempotencyKey:  orderId, // use orderId as idempotency key
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: 'WAITING_PAYMENT' },
    });

    return {
      paymentId:  payment.id,
      invoiceUrl: payment.invoiceUrl,
      expiresAt,
    };
  }
}

export const paymentService = new PaymentService();
