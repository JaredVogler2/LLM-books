# Crayons & Quills - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN / Edge (CloudFront)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐  │
│  │   Next.js     │     │   NestJS     │     │   Worker         │  │
│  │   Frontend    │────▶│   API        │◀───▶│   (BullMQ)       │  │
│  │   (SSR/SSG)   │     │   Server     │     │                  │  │
│  └──────────────┘     └──────┬───────┘     └────────┬─────────┘  │
│                              │                       │            │
│                    ┌─────────┴─────────┐            │            │
│                    │                   │            │            │
│              ┌─────┴─────┐  ┌─────────┴──┐  ┌─────┴───────┐   │
│              │ PostgreSQL │  │   Redis     │  │  S3 Storage  │   │
│              │ (Primary)  │  │ (Queue/Cache│  │  (Assets)    │   │
│              └────────────┘  └────────────┘  └─────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    External Services                        │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────┐ │  │
│  │  │ OpenAI   │ │ Stripe    │ │ SendGrid │ │ Print-on-   │ │  │
│  │  │ (GPT) +  │ │ (Payments)│ │ (Email)  │ │ Demand      │ │  │
│  │  │ FAL.ai   │ │           │ │          │ │ (Lulu       │ │  │
│  │  │          │ │           │ │          │ │  Direct)    │ │  │
│  │  └──────────┘ └───────────┘ └──────────┘ └─────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  Mac Mini M2 Agent Runner (Local)                 │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Order        │ │ Fulfillment  │ │ Failed Job Recovery      │ │
│  │ Monitor      │ │ Tracker      │ │ Agent                    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Abandoned    │ │ Health       │ │ Daily Digest             │ │
│  │ Cart Agent   │ │ Monitor      │ │ Agent                    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│                                                                   │
│  Managed by pm2 · Communicates with Railway backend via API       │
│  Development via Claude Code (Claude Max)                         │
└─────────────────────────────────────────────────────────────────┘
```

## Service Modules

### Frontend (Next.js 14)
- **Server-side rendering** for SEO-optimized landing pages
- **Client-side** multi-step book creation wizard
- **Zustand** for wizard state management
- **Tailwind CSS** for mobile-first responsive design
- **Stripe Elements** for secure payment collection

### Backend API (NestJS)
- RESTful API with versioned endpoints (`/api/v1/`)
- JWT authentication with refresh tokens
- Role-based access control (Customer, Admin, Super Admin)
- Swagger/OpenAPI documentation at `/docs`
- Rate limiting via @nestjs/throttler

### AI Services Layer
- **StoryEngineService**: Parameterized story generation with age-appropriate vocabulary
- **IllustrationEngineService**: Flux.2 Pro (via FAL.ai) image generation with print-quality upscaling
- **CharacterEngineService**: GPT-4 Vision character extraction + consistency locking
- **PdfAssemblyService**: PDFKit-based print-ready and digital PDF generation

### Background Workers (BullMQ)
- Queue: `book-generation` — orchestrates full book pipeline
- Queue: `illustration-generation` — parallel illustration generation
- Retry policies with exponential backoff
- Priority tiers for subscription vs one-time orders

### Database (PostgreSQL + Prisma)
- 14 models with proper indexing
- UUID primary keys
- Enum types for status fields
- JSON columns for flexible metadata

### Mac Mini M2 Agent Runner
- **Always-on local machine** running autonomous business agents via pm2
- 6 agents: order monitor, fulfillment tracker, failed job recovery, abandoned cart, health monitor, daily digest
- Communicates with Railway-hosted backend via REST API
- Can be enhanced with Claude Agent SDK for reasoning-based decision making
- Replaces Make.com for complex automation (Make.com optional as fallback)
- All development done via **Claude Code** (Claude Max subscription)

### Storage (S3)
- Signed URLs for secure file access
- Organized by: `books/{bookId}/`, `characters/{profileId}/`
- Print-quality images at 300 DPI (2400x2400 PNG)

## Book Generation Pipeline

```
1. User completes wizard → Book record created (DRAFT)
2. User triggers generation → Job queued (GENERATING_STORY)
3. Story Engine:
   a. Generate outline (acts, moral arc)
   b. Validate against age rubric
   c. Generate page-by-page text + illustration prompts
   d. Content safety validation
4. Status → GENERATING_ILLUSTRATIONS
5. Illustration Engine:
   a. Generate cover image
   b. Generate each page illustration (sequential for consistency)
   c. Upscale to 300 DPI, store in S3
6. Status → ASSEMBLING_PDF
7. PDF Assembly:
   a. Build print-ready PDF (bleed, CMYK-ready, fonts embedded)
   b. Build digital PDF (RGB, optimized)
8. Status → REVIEW_READY
9. Admin/auto-approval → APPROVED
10. Fulfillment submission → SENT_TO_PRINT
```

## Data Flow

```
User Input → Wizard Store → API → Database
                                     ↓
                              Job Queue (Redis)
                                     ↓
                            AI Services (OpenAI)
                                     ↓
                         Cloud Storage (S3 assets)
                                     ↓
                           PDF Assembly (PDFKit)
                                     ↓
                        Print Partner API (Lulu Direct)
                                     ↓
                          Email Notifications (SendGrid)
```

## Folder Structure

```
crayons-and-quills/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── main.ts                # App entry point
│   │   ├── app.module.ts          # Root module
│   │   ├── auth/                  # Authentication
│   │   ├── users/                 # User management
│   │   ├── children/              # Child profiles CRUD
│   │   ├── books/                 # Book CRUD + generation trigger
│   │   ├── orders/                # Order management
│   │   ├── payments/              # Stripe integration
│   │   ├── subscriptions/         # Subscription management
│   │   ├── fulfillment/           # Print-on-demand integration
│   │   │   └── providers/         # Lulu (primary), Printful, Blurb
│   │   ├── admin/                 # Admin dashboard API
│   │   ├── email/                 # Email templates + sending
│   │   ├── ai/                    # AI service layer
│   │   │   ├── story/             # Story generation engine
│   │   │   ├── illustration/      # Image generation engine
│   │   │   ├── character/         # Character consistency engine
│   │   │   ├── pdf/               # PDF assembly engine
│   │   │   └── book-generation.processor.ts  # BullMQ processor
│   │   ├── common/                # Shared utilities
│   │   │   ├── prisma.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── decorators/
│   │   │   └── guards/
│   │   └── jobs/
│   │       └── worker.ts          # Background worker entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Homepage
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── book/create/       # Book wizard
│   │   │   ├── dashboard/         # User dashboard
│   │   │   └── (marketing)/       # SEO landing pages
│   │   ├── components/
│   │   │   ├── layout/            # Header, Footer
│   │   │   ├── wizard/            # Wizard steps
│   │   │   └── ui/                # Reusable UI components
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   ├── store.ts           # Zustand store
│   │   │   └── utils.ts           # Utilities
│   │   └── types/                 # TypeScript types
│   └── package.json
├── agents/                          # Mac Mini agent scripts (pm2-managed)
│   ├── order-monitor.ts             # Watches for new paid orders
│   ├── fulfillment-tracker.ts       # Polls Lulu for shipping updates
│   ├── failed-job-recovery.ts       # Retries failed book generations
│   ├── abandoned-cart.ts            # Sends reminder emails (daily)
│   ├── health-monitor.ts            # Pings all services (every 15 min)
│   └── daily-digest.ts             # Emails daily business summary
├── infrastructure/
│   └── docker/                    # Dockerfiles
├── docs/                          # Documentation
├── .claude/                       # Claude Code configuration
│   └── settings.json              # SessionStart hooks
├── docker-compose.yml             # Production compose
└── docker-compose.dev.yml         # Dev compose
```
