# ⚽ ELITE FUT XI Market

> **Peer-to-peer football game account marketplace with escrow-ledger transaction system**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://prisma.io)

---

## Architecture

Modular Monolith built with Next.js 14 App Router.

```
Client → Next.js App → PostgreSQL
                    → Redis (cache + queues)
                    → BullMQ Workers
                    → Cloudinary (images)
                    → Xendit (payments)
```

## Financial Model

> This platform is **NOT a digital bank**. It operates as an **Internal Ledger / Accounting System**.

- Real funds flow through Xendit (external payment gateway)
- Platform records financial events in an immutable ledger
- Escrow is a **transaction state**, not real fund custody
- Withdrawals are **manually processed** by admins
- Wallet balances are **derived from ledger calculations**

## Modules

| Module | Responsibility |
|--------|----------------|
| `auth` | Authentication, sessions, RBAC |
| `user` | Profiles, KYC |
| `listing` | Account listings, search, cache |
| `order` | Order lifecycle state machine |
| `escrow` | Escrow state transitions |
| `ledger` | Immutable financial event log |
| `payment` | Xendit integration, webhooks |
| `dispute` | Buyer/seller dispute flow |
| `withdrawal` | Manual payout requests |
| `notification` | In-app + email notifications |
| `admin` | Platform management |

## Quick Start

```bash
# Install
npm install

# Setup env
cp .env.example .env.local
# Fill in all values

# Database
npm run db:generate
npm run db:push
npm run db:seed

# Development
npm run dev

# Workers (separate terminal)
npm run workers:dev
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5
- **UI**: Tailwind CSS + Shadcn UI
- **Images**: Cloudinary (WebP optimized)
- **Cache**: Redis (ioredis)
- **Queue**: BullMQ
- **Payments**: Xendit
- **Email**: Nodemailer

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

---

Built with ❤️ for the FUT trading community.
