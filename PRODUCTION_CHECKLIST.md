# ELITE FUT XI Market — Production Checklist

## ✅ Pre-Launch Security

- [ ] `NEXTAUTH_SECRET` is at least 32 random characters
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] All `.env` secrets are stored in server environment, NOT committed to git
- [ ] `XENDIT_WEBHOOK_TOKEN` is set and verified in webhook handler
- [ ] Rate limiting is enabled on all sensitive routes (`/login`, `/checkout`, `/webhook`, `/dispute`)
- [ ] Admin routes are protected by `requireAdmin()` middleware
- [ ] Seller routes are protected by `requireSeller()` middleware

## ✅ Financial System Integrity

- [ ] All wallet/ledger operations run inside `prisma.$transaction()`
- [ ] Ledger entries are NEVER updated or deleted
- [ ] Idempotency keys prevent duplicate webhook processing
- [ ] Wallet balance is derived from ledger (not manually set)
- [ ] Manual withdrawal flow is understood by admin team
- [ ] Platform does NOT hold real funds — all balances are accounting records

## ✅ Database

- [ ] All migrations applied (`npm run db:migrate:prod`)
- [ ] Database backups configured (daily minimum)
- [ ] Indexes exist on: `users.email`, `users.username`, `listings.status`, `orders.buyerId`, `orders.sellerId`, `ledger_entries.userId`, `ledger_entries.referenceId`
- [ ] Connection pooling configured (PgBouncer recommended for production)

## ✅ Infrastructure

- [ ] Redis is persistent (AOF or RDB enabled)
- [ ] BullMQ workers are running as a separate process
- [ ] BullMQ workers have auto-restart (PM2 or systemd)
- [ ] Recurring jobs scheduled: `AUTO_CONFIRM` (30min), `EXPIRE_PAYMENTS` (15min)
- [ ] SSL/TLS certificate installed
- [ ] Domain DNS configured

## ✅ Monitoring

- [ ] Error logging configured (Sentry recommended)
- [ ] Database slow query monitoring
- [ ] Redis memory usage alert
- [ ] BullMQ failed jobs alert
- [ ] Uptime monitoring (Better Uptime, UptimeRobot)

## ✅ Payment Gateway

- [ ] Xendit account verified and activated
- [ ] Webhook URL registered in Xendit dashboard
- [ ] Webhook signature verification working
- [ ] Test payment flow completed end-to-end
- [ ] Invoice expiry time set correctly

## ✅ Image & CDN

- [ ] Cloudinary account configured
- [ ] Cloudinary upload preset created (if needed)
- [ ] Image transformations working (WebP conversion)
- [ ] KYC documents stored in private/restricted folder
- [ ] `next/image` remote patterns configured for Cloudinary

## ✅ Email

- [ ] SMTP credentials working
- [ ] Email templates rendering correctly
- [ ] BullMQ email worker running
- [ ] Test emails delivered (check spam folder)

## ✅ Admin Operations

- [ ] Admin account created and secured (change seed password!)
- [ ] Admin team knows manual withdrawal process
- [ ] KYC review process documented internally
- [ ] Dispute resolution process documented
- [ ] Audit log accessible and working

## ✅ Performance

- [ ] Redis caching working for listings and homepage
- [ ] Images served as WebP from Cloudinary CDN
- [ ] Next.js ISR configured for static pages
- [ ] Database query performance tested

## ✅ Legal & Compliance

- [ ] Terms of Service page created
- [ ] Privacy Policy page created
- [ ] Escrow disclaimer clearly displayed to users
- [ ] Platform is NOT presenting itself as a financial institution
- [ ] KYC data stored securely and compliantly

---

## Default Credentials (Change Immediately!)

| Role   | Email                    | Password      |
|--------|--------------------------|---------------|
| Admin  | admin@elitefutxi.com     | Admin@123456  |
| Seller | seller@elitefutxi.com    | Seller@123456 |
| Buyer  | buyer@elitefutxi.com     | Buyer@123456  |

> ⚠️ **Change all seed passwords immediately after first login in production!**
