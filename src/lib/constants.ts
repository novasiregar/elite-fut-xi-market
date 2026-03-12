export const PLATFORM_NAME = 'ELITE FUT XI Market';
export const PLATFORM_DESCRIPTION =
  'Peer-to-peer marketplace for football game accounts and digital items';

export const CURRENCY = process.env.CURRENCY ?? 'IDR';
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 5);
export const MIN_WITHDRAWAL_AMOUNT = BigInt(
  process.env.MIN_WITHDRAWAL_AMOUNT ?? 50000
);

// Order auto-confirm after delivery (hours)
export const AUTO_CONFIRM_HOURS = 72;

// Cache TTLs (seconds)
export const CACHE_TTL = {
  listings:     300,  // 5 minutes
  homepage:     120,  // 2 minutes
  userProfile:  600,  // 10 minutes
  wallet:       60,   // 1 minute
};

// Cache key prefixes
export const CACHE_KEYS = {
  listings:       (params: string) => `listings:${params}`,
  listing:        (id: string)     => `listing:${id}`,
  homepageFeatured:               'homepage:featured',
  userWallet:     (id: string)     => `wallet:${id}`,
  userProfile:    (id: string)     => `user:${id}`,
};

// Xendit config
export const XENDIT_INVOICE_EXPIRY_HOURS = 24;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

// Upload limits
export const MAX_LISTING_IMAGES = 8;
export const MAX_IMAGE_SIZE_MB  = 10;

// Dispute reasons
export const DISPUTE_REASONS = [
  'Account does not match description',
  'Account credentials invalid',
  'Account has been reclaimed by seller',
  'Account is banned or restricted',
  'Seller not responding',
  'Wrong account delivered',
  'Other',
] as const;

export type DisputeReason = (typeof DISPUTE_REASONS)[number];
