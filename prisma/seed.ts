import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@elitefutxi.com' },
    update: {},
    create: {
      email:        'admin@elitefutxi.com',
      username:     'admin',
      displayName:  'Platform Admin',
      passwordHash: adminHash,
      role:         'ADMIN',
    },
  });
  console.log('Admin created:', admin.email);

  // Create a test seller
  const sellerHash = await bcrypt.hash('Seller@123456', 12);
  const seller = await prisma.user.upsert({
    where:  { email: 'seller@elitefutxi.com' },
    update: {},
    create: {
      email:        'seller@elitefutxi.com',
      username:     'testseller',
      displayName:  'Test Seller',
      passwordHash: sellerHash,
      role:         'SELLER',
    },
  });

  // Create KYC for seller
  await prisma.kyc.upsert({
    where:  { userId: seller.id },
    update: {},
    create: {
      userId:           seller.id,
      identityNumber:   '1234567890123456',
      identityDocument: 'https://placehold.co/600x400',
      selfiePhoto:      'https://placehold.co/400x400',
      status:           'APPROVED',
      reviewedBy:       admin.id,
      reviewedAt:       new Date(),
    },
  });
  console.log('Seller created:', seller.email);

  // Create a test buyer
  const buyerHash = await bcrypt.hash('Buyer@123456', 12);
  const buyer = await prisma.user.upsert({
    where:  { email: 'buyer@elitefutxi.com' },
    update: {},
    create: {
      email:        'buyer@elitefutxi.com',
      username:     'testbuyer',
      displayName:  'Test Buyer',
      passwordHash: buyerHash,
      role:         'BUYER',
    },
  });
  console.log('Buyer created:', buyer.email);

  // Create sample listings
  const slugs = ['fc25-pc-ultimate-squad-92ovr', 'fut-mobile-legend-account', 'xbox-serie-a-squad'];
  const platforms = ['PC', 'MOBILE', 'XBOX'] as const;
  const methods   = ['FULL_ACCESS', 'EMAIL_CHANGE', 'GIFT'] as const;

  for (let i = 0; i < 3; i++) {
    await prisma.listing.upsert({
      where:  { slug: slugs[i] },
      update: {},
      create: {
        sellerId:       seller.id,
        title:          `Sample FUT Account #${i + 1} — ${platforms[i]}`,
        slug:           slugs[i],
        description:    `This is a sample listing for testing purposes. The account includes a great squad with top players, coins, and more. Perfect for competitive play.`,
        price:          BigInt((i + 1) * 500_000),
        coins:          BigInt((i + 1) * 1_000_000),
        rating:         85 + i,
        platform:       platforms[i],
        accountLevel:   100,
        transferMethod: methods[i],
        status:         'ACTIVE',
        publishedAt:    new Date(),
        tags:           ['sample', 'test', platforms[i].toLowerCase()],
      },
    });
  }
  console.log('Sample listings created');

  // System config
  const configs = [
    { key: 'platform_fee_percent',   value: '5',     label: 'Platform fee percentage' },
    { key: 'min_withdrawal_amount',  value: '50000', label: 'Minimum withdrawal (IDR)' },
    { key: 'auto_confirm_hours',     value: '72',    label: 'Auto-confirm after delivery (hours)' },
    { key: 'maintenance_mode',       value: 'false', label: 'Maintenance mode' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where:  { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log('System config seeded');

  console.log('\n=== Seed Complete ===')
  console.log('Admin:  admin@elitefutxi.com  / Admin@123456');
  console.log('Seller: seller@elitefutxi.com / Seller@123456');
  console.log('Buyer:  buyer@elitefutxi.com  / Buyer@123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
