import { redis } from './redis';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs:  number; // time window in ms
  max:       number; // max requests per window
  keyPrefix: string;
}

/**
 * Redis-backed rate limiter for API routes.
 * Uses sliding window counter algorithm.
 */
export async function rateLimit(
  request:  NextRequest,
  config:   RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const key = `rate:${config.keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.zcard(key);
  pipeline.expire(key, Math.ceil(config.windowMs / 1000));

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  const remaining = Math.max(0, config.max - count);
  const reset = now + config.windowMs;

  return {
    success: count <= config.max,
    remaining,
    reset,
  };
}

/**
 * Rate limit middleware wrapper for API route handlers.
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { success, remaining, reset } = await rateLimit(req, config);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit':     config.max.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset':     reset.toString(),
            'Retry-After':           Math.ceil(config.windowMs / 1000).toString(),
          },
        }
      );
    }

    return handler(req);
  };
}

// Predefined rate limit configs
export const rateLimits = {
  auth: {
    windowMs:  15 * 60 * 1000, // 15 minutes
    max:       10,
    keyPrefix: 'auth',
  },
  checkout: {
    windowMs:  60 * 1000, // 1 minute
    max:       5,
    keyPrefix: 'checkout',
  },
  webhook: {
    windowMs:  60 * 1000,
    max:       100,
    keyPrefix: 'webhook',
  },
  dispute: {
    windowMs:  60 * 60 * 1000, // 1 hour
    max:       5,
    keyPrefix: 'dispute',
  },
  api: {
    windowMs:  60 * 1000,
    max:       60,
    keyPrefix: 'api',
  },
};
