# StoryForge AI - System Architecture

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
│  │  │ (GPT/    │ │ (Payments)│ │ (Email)  │ │ Demand      │ │  │
│  │  │  DALL-E) │ │           │ │          │ │ (Printful/  │ │  │
│  │  │          │ │           │ │          │ │  Lulu)      │ │  │
│  │  └──────────┘ └───────────┘ └──────────┘ └─────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
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
- **IllustrationEngineService**: DALL-E 3 image generation with print-quality upscaling
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
                        Print Partner API (Printful/Lulu)
                                     ↓
                          Email Notifications (SendGrid)
```

## Folder Structure

```
storyforge-ai/
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
│   │   │   └── providers/         # Printful, Lulu, Blurb
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
├── infrastructure/
│   └── docker/                    # Dockerfiles
├── docs/                          # Documentation
├── docker-compose.yml             # Production compose
└── docker-compose.dev.yml         # Dev compose
```
