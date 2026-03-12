import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { customAlphabet } from 'nanoid' assert { type: 'json' };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format BigInt IDR amount to human-readable currency string.
 */
export function formatCurrency(
  amount: bigint | number,
  currency = 'IDR'
): string {
  const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style:    'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Generate human-readable order number.
 * Format: ORD-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const date  = new Date();
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  const rand  = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `ORD-${year}${month}${day}-${rand}`;
}

/**
 * Generate URL-friendly slug from title.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${base}-${rand}`;
}

/**
 * Calculate platform fee from listing price.
 */
export function calculatePlatformFee(
  price: bigint,
  feePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? 5)
): { fee: bigint; sellerReceives: bigint } {
  const fee = (price * BigInt(feePercent)) / BigInt(100);
  return { fee, sellerReceives: price - fee };
}

/**
 * Safely parse BigInt from various input types.
 */
export function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.floor(value));
  if (typeof value === 'string') return BigInt(value);
  throw new Error(`Cannot convert ${typeof value} to BigInt`);
}

/**
 * Serialize BigInt values in objects for JSON output.
 */
export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

/**
 * Get the auto-confirm deadline (72 hours from delivery).
 */
export function getAutoConfirmDeadline(deliveredAt: Date): Date {
  const deadline = new Date(deliveredAt);
  deadline.setHours(deadline.getHours() + 72);
  return deadline;
}

/**
 * Mask sensitive text for display (e.g., bank account number).
 */
export function maskSensitive(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}
