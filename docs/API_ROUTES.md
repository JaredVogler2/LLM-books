# StoryForge AI - API Routes

Base URL: `/api/v1`

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new user account |
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/refresh` | Public | Refresh access token |

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Get current user profile |

## Children Profiles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/children` | JWT | Create child profile |
| GET | `/children` | JWT | List all child profiles |
| GET | `/children/:id` | JWT | Get child profile by ID |
| PUT | `/children/:id` | JWT | Update child profile |
| DELETE | `/children/:id` | JWT | Delete child profile |

## Books

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/books` | JWT | Create book configuration |
| GET | `/books` | JWT | List all user books |
| GET | `/books/:id` | JWT | Get book with pages |
| POST | `/books/:id/generate` | JWT | Start generation pipeline |
| GET | `/books/:id/price` | JWT | Calculate book price |

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | JWT | Create new order |
| GET | `/orders` | JWT | List user orders |
| GET | `/orders/:id` | JWT | Get order details |

## Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/orders/:orderId/pay` | JWT | Create payment intent |
| POST | `/payments/webhook` | Public | Stripe webhook handler |

## Subscriptions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/subscriptions` | JWT | Create subscription |
| GET | `/subscriptions` | JWT | List subscriptions |
| DELETE | `/subscriptions/:id` | JWT | Cancel subscription |

## Fulfillment

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/fulfillment/orders/:orderId/submit` | Admin | Submit to print provider |
| GET | `/fulfillment/orders/:id/status` | JWT | Get fulfillment status |
| POST | `/fulfillment/webhook/:provider` | Public | Provider webhook |

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | Admin | Dashboard statistics |
| GET | `/admin/conversions` | Admin | Conversion funnel metrics |
| GET | `/admin/orders/:id` | Admin | Detailed order info |
| POST | `/admin/orders/:id/regenerate` | Admin | Regenerate book |
| POST | `/admin/orders/:id/refund` | Admin | Process refund |
| POST | `/admin/orders/:id/fulfill` | Admin | Submit to fulfillment |

## Background Jobs

| Queue | Job Name | Description |
|-------|----------|-------------|
| `book-generation` | `generate-story` | Generate story outline + pages |
| `book-generation` | `generate-illustrations` | Generate all page illustrations |
| `book-generation` | `assemble-pdf` | Assemble print + digital PDFs |

## Scheduled Tasks

| Schedule | Description |
|----------|-------------|
| Daily 9 AM | Birthday subscription reminders (30-day advance) |
| Daily midnight | Process auto-generation for due subscriptions |
| Hourly | Sync fulfillment order statuses |
