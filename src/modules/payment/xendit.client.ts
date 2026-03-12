import Xendit from 'xendit-node';
import type { CreateInvoiceRequest } from 'xendit-node/invoice/models';

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

export const { Invoice } = xenditClient;

export interface CreateInvoiceParams {
  externalId:   string;   // our orderId (used as idempotency key)
  amount:       number;
  payerEmail:   string;
  description:  string;
  successUrl?:  string;
  failureUrl?:  string;
}

export interface XenditInvoiceResult {
  id:         string;
  invoiceUrl: string;
  expiryDate: string;
  status:     string;
}

/**
 * Create a Xendit hosted invoice.
 */
export async function createXenditInvoice(
  params: CreateInvoiceParams
): Promise<XenditInvoiceResult> {
  const expiryHours = Number(process.env.XENDIT_INVOICE_EXPIRY_HOURS ?? 24);
  const expiryDate  = new Date();
  expiryDate.setHours(expiryDate.getHours() + expiryHours);

  const request: CreateInvoiceRequest = {
    externalId:  params.externalId,
    amount:      params.amount,
    payerEmail:  params.payerEmail,
    description: params.description,
    successRedirectUrl:
      params.successUrl ??
      `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.externalId}?status=paid`,
    failureRedirectUrl:
      params.failureUrl ??
      `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.externalId}?status=failed`,
    invoiceDuration:     expiryHours * 3600,
    currency:            'IDR',
    paymentMethods:      ['QRIS', 'OVO', 'DANA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA'],
  };

  const invoice = await Invoice.createInvoice({ data: request });

  return {
    id:         invoice.id!,
    invoiceUrl: invoice.invoiceUrl!,
    expiryDate: invoice.expiryDate!,
    status:     invoice.status!,
  };
}

/**
 * Verify Xendit webhook signature.
 * Xendit sends X-CALLBACK-TOKEN header.
 */
export function verifyXenditWebhook(token: string): boolean {
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error('[Xendit] XENDIT_WEBHOOK_TOKEN not configured');
    return false;
  }
  return token === expectedToken;
}
