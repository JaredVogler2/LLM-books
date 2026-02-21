# Crayons & Quills — Claude Code Project Instructions

## Business Context
Crayons & Quills is a personalized children's book company operated by Atman Labs LLC.
Customers enter details about their child, and AI agents automatically generate a custom story,
create illustrations, assemble a print-ready PDF, and ship a physical book via Lulu Direct.

## Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Zustand, Stripe Elements, Framer Motion
- **Backend:** NestJS, Prisma ORM, PostgreSQL, Redis, BullMQ
- **AI:** OpenAI GPT-4o (story), Flux.2 Pro via FAL.ai (illustrations), PDFKit (assembly)
- **Payments:** Stripe (one-time + subscriptions)
- **Print:** Lulu Direct API (primary print-on-demand partner)
- **Email:** SendGrid (transactional)
- **Hosting:** Railway.app (frontend, backend, PostgreSQL, Redis)
- **Agent Runner:** Mac Mini M2 with pm2 (6 autonomous agent scripts)
- **Development:** Claude Code (Claude Max subscription)

## Key Directories
- `backend/` — NestJS API, Prisma schema, AI services (story, illustration, character, PDF)
- `frontend/` — Next.js app with book creation wizard, user dashboard, marketing pages
- `agents/` — Mac Mini agent scripts managed by pm2
- `docs/` — Architecture docs, deployment guide, LaTeX business launch guide
- `infrastructure/docker/` — Dockerfiles for all services

## Database
- PostgreSQL with Prisma ORM
- Dev credentials: `crayonsquills` / `crayonsquills_dev` (see docker-compose.dev.yml)
- Run migrations: `cd backend && npx prisma migrate dev`

## Common Tasks
- **Run dev servers:** `cd backend && npm run start:dev` + `cd frontend && npm run dev`
- **Run worker:** `cd backend && npm run worker`
- **Generate Prisma client:** `cd backend && npx prisma generate`
- **Run tests:** `cd backend && npm test`
- **Check agents:** `pm2 status` (on Mac Mini)

## Important Notes
- The `.env.example` files contain all required environment variables with descriptions
- Stripe webhooks must be configured for payment_intent.succeeded and invoice events
- Lulu Direct webhook URL: `https://api.yourdomain.com/api/v1/fulfillment/webhook/lulu`
- All customer-facing text uses "Crayons & Quills" (never "Atman Labs" to customers)
- Legal/business documents use "Atman Labs LLC" as the entity name
