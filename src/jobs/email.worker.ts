import { Worker, type Job } from 'bullmq';
import { redisConnection } from './queue';
import { sendEmail, buildEmailTemplate } from '@/modules/notification/email.service';
import prisma from '@/lib/prisma';

interface EmailJobData {
  userId:  string;
  type:    string;
  title:   string;
  message: string;
  data?:   Record<string, unknown>;
}

const worker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { userId, title, message, data } = job.data;

    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { email: true, displayName: true, username: true },
    });

    if (!user) {
      console.warn(`[EmailWorker] User not found: ${userId}`);
      return;
    }

    const ctaUrl = data?.orderId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}`
      : data?.disputeId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/disputes/${data.disputeId}`
      : data?.withdrawId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`
      : undefined;

    const html = buildEmailTemplate({
      title,
      message,
      ctaUrl,
      ctaText: 'View Details',
    });

    await sendEmail({
      to:      user.email,
      subject: `ELITE FUT XI - ${title}`,
      html,
      text:    message,
    });

    console.log(`[EmailWorker] Email sent to ${user.email} — ${title}`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed`);
});

export default worker;
