# ELITE FUT XI Market — Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Cloudinary account
- Xendit account
- SMTP provider (Gmail, Resend, etc.)

---

## 1. Clone & Install

```bash
git clone https://github.com/your-org/elite-fut-xi-market
cd elite-fut-xi-market
npm install
```

---

## 2. Environment Variables

Copy and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection URL
- `NEXTAUTH_SECRET` — Minimum 32 characters random string
- `XENDIT_SECRET_KEY` — From Xendit dashboard
- `XENDIT_WEBHOOK_TOKEN` — From Xendit webhook settings
- `CLOUDINARY_*` — From Cloudinary dashboard
- `SMTP_*` — Your email provider

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (production)
npm run db:migrate:prod

# Or push schema directly (development)
npm run db:push

# Seed initial data
npm run db:seed
```

---

## 4. Build & Start

```bash
# Build Next.js app
npm run build

# Start production server
npm run start
```

---

## 5. Start Background Workers

The BullMQ workers MUST run as a separate process:

```bash
# In a separate terminal or as a separate service
npm run workers:dev

# Or with PM2:
pm2 start ecosystem.config.js
```

---

## 6. PM2 Ecosystem Config

Create `ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name:    'elite-fut-xi-app',
      script:  'node_modules/.bin/next',
      args:    'start',
      env: { NODE_ENV: 'production', PORT: 3000 },
    },
    {
      name:    'elite-fut-xi-workers',
      script:  'node_modules/.bin/tsx',
      args:    'src/jobs/worker.ts',
      env: { NODE_ENV: 'production' },
    },
  ],
};
```

---

## 7. Xendit Webhook Setup

1. Go to Xendit Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/xendit`
3. Select events: `invoice.paid`, `invoice.expired`
4. Copy the Webhook Token to `XENDIT_WEBHOOK_TOKEN`

---

## 8. Vercel Deployment (Alternative)

```bash
npm install -g vercel
vercel --prod
```

Add all env vars in Vercel dashboard.

> Note: Workers cannot run on Vercel. Use a separate service (Railway, Render, VPS)
> for the BullMQ workers when deploying to Vercel.

---

## 9. Nginx Config (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
