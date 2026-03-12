/**
 * Worker entry point.
 * Run separately from the Next.js app:
 *   npx tsx src/jobs/worker.ts
 */
import './email.worker';
import './image.worker';
import './reconciliation.worker';

console.log('[Workers] All BullMQ workers started');
console.log('[Workers] Listening: email | image-processing | reconciliation');

// Schedule recurring reconciliation jobs
import { reconciliationQueue } from './queue';

async function scheduleRecurringJobs() {
  // Auto-confirm check every 30 minutes
  await reconciliationQueue.add(
    'auto-confirm-check',
    { type: 'AUTO_CONFIRM' },
    {
      repeat:   { every: 30 * 60 * 1000 },
      jobId:    'auto-confirm-recurring',
    }
  );

  // Expire payments check every 15 minutes
  await reconciliationQueue.add(
    'expire-payments-check',
    { type: 'EXPIRE_PAYMENTS' },
    {
      repeat: { every: 15 * 60 * 1000 },
      jobId:  'expire-payments-recurring',
    }
  );

  console.log('[Workers] Recurring jobs scheduled');
}

scheduleRecurringJobs().catch(console.error);

process.on('SIGTERM', async () => {
  console.log('[Workers] Shutting down gracefully...');
  process.exit(0);
});
