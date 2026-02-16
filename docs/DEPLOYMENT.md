# StoryForge AI - Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 16
- Redis 7
- AWS account (S3 bucket)
- Stripe account
- SendGrid account
- OpenAI API key
- Print-on-demand partner account (Printful/Lulu)

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

### Option B: AWS (Recommended)

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

### Option C: GCP

| Service | GCP Product |
|---------|------------|
| Frontend | Cloud Run or Firebase Hosting |
| Backend | Cloud Run |
| Worker | Cloud Run (always-on) |
| Database | Cloud SQL PostgreSQL |
| Cache | Memorystore Redis |
| Storage | Cloud Storage |

## Monitoring

- **Application**: Sentry for error tracking
- **Infrastructure**: CloudWatch / GCP Monitoring
- **Uptime**: UptimeRobot or Checkly
- **Logs**: Structured JSON logging with correlation IDs

## Scaling Considerations

- Backend API: Horizontal scaling behind load balancer
- Workers: Scale independently based on queue depth
- Database: Read replicas for analytics queries
- Redis: Cluster mode for high-throughput queues
- AI Rate Limiting: Implement per-user and global rate limits for OpenAI API
- CDN: Cache static assets and generated preview thumbnails
