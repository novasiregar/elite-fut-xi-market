export interface XenditWebhookPayload {
  id:                    string;
  external_id:           string;
  user_id:               string;
  is_high:               boolean;
  payment_method:        string;
  status:                'PAID' | 'EXPIRED' | 'PENDING';
  merchant_name:         string;
  amount:                number;
  paid_amount:           number;
  bank_code?:            string;
  paid_at?:              string;
  payer_email?:          string;
  description:           string;
  adjusted_received_amount: number;
  fees_paid_amount:      number;
  updated:               string;
  created:               string;
  currency:              string;
  payment_channel:       string;
  payment_destination?:  string;
}

export interface CreatePaymentInput {
  orderId:     string;
  amount:      bigint;
  buyerEmail:  string;
  description: string;
}

export interface PaymentResult {
  paymentId:  string;
  invoiceUrl: string;
  expiresAt:  Date;
}
