import { Worker, type Job } from 'bullmq';
import { redisConnection } from './queue';
import { uploadImage } from '@/lib/cloudinary';
import prisma from '@/lib/prisma';

interface ImageJobData {
  listingId:    string;
  imageBase64:  string;
  isPrimary:    boolean;
}

const worker = new Worker<ImageJobData>(
  'image-processing',
  async (job: Job<ImageJobData>) => {
    const { listingId, imageBase64, isPrimary } = job.data;

    console.log(`[ImageWorker] Processing image for listing ${listingId}`);

    const result = await uploadImage(
      Buffer.from(imageBase64, 'base64'),
      'listings',
      { width: 1200, height: 900 }
    );

    // If this is the primary image, unset existing primary first
    if (isPrimary) {
      await prisma.listingImage.updateMany({
        where: { listingId, isPrimary: true },
        data:  { isPrimary: false },
      });
    }

    await prisma.listingImage.create({
      data: {
        listingId,
        url:       result.url,
        publicId:  result.publicId,
        isPrimary,
        sortOrder: 0,
      },
    });

    console.log(`[ImageWorker] Image uploaded for listing ${listingId}: ${result.url}`);
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[ImageWorker] Job ${job?.id} failed:`, err.message);
});

export default worker;
