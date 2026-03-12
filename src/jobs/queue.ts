import { Queue } from 'bullmq';
import redis from '@/lib/redis';

const connection = redis;

// Email notification queue
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts:     3,
    backoff:      { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 500 },
  },
});

// Image processing queue
export const imageQueue = new Queue('image-processing', {
  connection,
  defaultJobOptions: {
    attempts:     3,
    backoff:      { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 50 },
    removeOnFail:     { count: 100 },
  },
});

// Reconciliation / scheduled jobs queue
export const reconciliationQueue = new Queue('reconciliation', {
  connection,
  defaultJobOptions: {
    attempts:     2,
    backoff:      { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail:     { count: 50 },
  },
});

// Order auto-confirm queue
export const orderQueue = new Queue('order-jobs', {
  connection,
  defaultJobOptions: {
    attempts:     3,
    backoff:      { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail:     { count: 200 },
  },
});

export { connection as redisConnection };
