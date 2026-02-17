# Crayons & Quills - Deployment Guide

## Development with Claude Code

You do **not** need Cursor, VS Code, or any IDE. Use **Claude Code** (included with your Claude Max subscription) for all development:

**On the web (easiest):**
```
Go to https://claude.ai/code
Clone the repo and ask Claude to install dependencies, configure .env, and run dev servers.
```

**Locally (alternative):**
```bash
npm install -g @anthropic-ai/claude-code
cd LLM-books
claude
# Then: "Install all dependencies and set up my dev environment"
```

## Prerequisites

- Docker & Docker Compose (for local database/Redis)
- Node.js 20+
- PostgreSQL 16
- Redis 7
- AWS account (S3 bucket)
- Stripe account
- SendGrid account
- OpenAI API key
- Lulu Direct API credentials

## Local Development

### 1. Start infrastructure services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Setup backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### 3. Start worker (separate terminal)

```bash
cd backend
npm run worker
```

### 4. Setup frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 5. Access

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Docs: http://localhost:4000/docs

## Production Deployment

### Option A: Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npx prisma migrate deploy
```

### Option B: Railway.app (Recommended for Solo Founders)

The simplest path. See Chapter 6 of the Business Launch Guide for step-by-step instructions.

```
1. Sign up at https://railway.app with your GitHub account
2. New Project → Deploy from GitHub Repo → select LLM-books
3. Add PostgreSQL and Redis databases (one click each)
4. Configure backend service:
   - Root Directory: backend
   - Build: npm install && npx prisma generate && npm run build
   - Start: npx prisma migrate deploy && npm run start:prod
5. Deploy frontend as separate service:
   - Root Directory: frontend
   - Build: npm install && npm run build
   - Start: npm start
6. Add environment variables (bulk import from .env)
7. Set custom domains in Cloudflare DNS
```

**Estimated cost:** $8–25/month depending on traffic.

### Option C: AWS

#### Infrastructure

| Service | AWS Product | Purpose |
|---------|------------|---------|
| Frontend | Vercel or CloudFront + S3 | SSR/SSG hosting |
| Backend API | ECS Fargate or App Runner | API server |
| Worker | ECS Fargate | Background jobs |
| Database | RDS PostgreSQL | Primary database |
| Cache/Queue | ElastiCache Redis | Job queue + caching |
| Storage | S3 | Asset storage |
| CDN | CloudFront | Static asset delivery |
| DNS | Route 53 | Domain management |
| SSL | ACM | TLS certificates |
| Monitoring | CloudWatch | Logs and metrics |
| Secrets | Secrets Manager | API keys and credentials |

#### Deployment Steps

1. **Database**: Provision RDS PostgreSQL 16 (db.t3.medium minimum)
2. **Redis**: Provision ElastiCache Redis 7 (cache.t3.micro minimum)
3. **S3**: Create bucket with CORS configuration for uploads
4. **ECS**: Create task definitions for backend and worker
5. **Load Balancer**: ALB with HTTPS listener
6. **Frontend**: Deploy to Vercel with environment variables
7. **DNS**: Point domain to ALB and Vercel
8. **Secrets**: Store all API keys in Secrets Manager

#### Environment Variables

Set all variables from `.env.example` in your deployment platform's secrets/environment configuration.

### Option D: GCP

| Service | GCP Product |
|---------|------------|
| Frontend | Cloud Run or Firebase Hosting |
| Backend | Cloud Run |
| Worker | Cloud Run (always-on) |
| Database | Cloud SQL PostgreSQL |
| Cache | Memorystore Redis |
| Storage | Cloud Storage |

## Mac Mini M2 Agent Runner

Your Mac Mini M2 runs local AI agents that monitor and manage the business autonomously. See Chapter 8 of the Business Launch Guide for full setup.

### Quick Start

```bash
# Install tools
brew install node git
npm install -g @anthropic-ai/claude-code pm2

# Clone and set up
cd ~
git clone https://github.com/YourUsername/LLM-books.git
cd LLM-books

# Use Claude Code to generate agent scripts
claude
# "Create agents/ directory with order-monitor, fulfillment-tracker,
#  failed-job-recovery, abandoned-cart, health-monitor, daily-digest scripts"

# Start all agents with pm2
pm2 start agents/order-monitor.ts --name order-monitor
pm2 start agents/fulfillment-tracker.ts --name fulfillment-tracker
pm2 start agents/failed-job-recovery.ts --name failed-recovery
pm2 start agents/abandoned-cart.ts --name abandoned-cart
pm2 start agents/health-monitor.ts --name health-monitor
pm2 start agents/daily-digest.ts --name daily-digest

# Persist across reboots
pm2 save && pm2 startup
```

### Remote Access

- **SSH**: System Settings → Sharing → Remote Login
- **Tailscale** (recommended): Free VPN for accessing Mac Mini from anywhere
- **Screen Sharing**: System Settings → Sharing → Screen Sharing

## Monitoring

- **Application**: Sentry for error tracking
- **Infrastructure**: CloudWatch / GCP Monitoring / Railway dashboard
- **Uptime**: UptimeRobot or Checkly
- **Logs**: Structured JSON logging with correlation IDs
- **Mac Mini agents**: `pm2 status`, `pm2 logs`, `pm2 monit`
- **Daily digest**: Automated email summary from Mac Mini agent every 8 AM

## Scaling Considerations

- Backend API: Horizontal scaling behind load balancer
- Workers: Scale independently based on queue depth
- Database: Read replicas for analytics queries
- Redis: Cluster mode for high-throughput queues
- AI Rate Limiting: Implement per-user and global rate limits for OpenAI API
- CDN: Cache static assets and generated preview thumbnails
- Mac Mini agents: Migrate from Make.com to local agents as confidence grows
