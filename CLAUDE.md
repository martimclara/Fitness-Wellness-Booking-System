# FitBook — Fitness & Wellness Booking System

## Project Overview

A booking platform for a fitness/wellness business. Customers browse **trainer profiles** by expertise, select services, and book sessions. Trainers manage their own schedules and availability.

**Core flows:**
- Customer: browse trainers -> pick service -> choose time slot -> pay -> receive confirmation
- Trainer: set schedule -> manage availability -> view bookings
- Admin: manage trainers/services -> view calendar -> handle customers -> track revenue

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (NextAuth.js) — email/password + Google OAuth |
| Payments | Stripe (PaymentIntents, manual capture) |
| Email | Resend |
| SMS | Twilio |
| Calendar UI | FullCalendar (admin drag-and-drop) |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod + React Hook Form (`@hookform/resolvers/zod`) |
| Data Fetching | SWR (client-side polling for real-time availability) |
| Dates | date-fns + date-fns-tz |
| Calendar Export | ical-generator |
| Unit/Integration Tests | Vitest |
| E2E Tests | Playwright |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Landing page
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (customer)/
│   │   ├── trainers/
│   │   │   ├── page.tsx                # Browse trainers (filter by expertise)
│   │   │   └── [id]/page.tsx           # Trainer profile + booking
│   │   ├── book/
│   │   │   ├── page.tsx                # Service selection
│   │   │   └── [serviceId]/page.tsx    # Trainer + time slot selection
│   │   ├── bookings/
│   │   │   ├── page.tsx                # Booking history
│   │   │   └── [id]/page.tsx           # Booking detail
│   │   └── checkout/page.tsx           # Stripe payment
│   ├── (admin)/admin/
│   │   ├── layout.tsx                  # Admin sidebar layout
│   │   ├── page.tsx                    # Dashboard (stats)
│   │   ├── calendar/page.tsx           # Day/week/month view
│   │   ├── bookings/page.tsx
│   │   ├── services/page.tsx
│   │   ├── trainers/page.tsx
│   │   ├── customers/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── trainers/route.ts
│       ├── trainers/[id]/route.ts
│       ├── services/route.ts
│       ├── services/[id]/route.ts
│       ├── availability/route.ts
│       ├── bookings/route.ts
│       ├── bookings/[id]/route.ts
│       ├── bookings/[id]/cancel/route.ts
│       ├── bookings/[id]/reschedule/route.ts
│       ├── bookings/[id]/calendar/route.ts
│       ├── payments/create-intent/route.ts
│       ├── webhooks/stripe/route.ts
│       ├── admin/
│       │   ├── bookings/route.ts
│       │   ├── services/route.ts
│       │   ├── trainers/route.ts
│       │   ├── schedules/route.ts
│       │   ├── schedule-overrides/route.ts
│       │   ├── customers/route.ts
│       │   └── dashboard/route.ts
│       └── cron/send-reminders/route.ts
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── admin-sidebar.tsx
│   │   └── mobile-nav.tsx
│   └── features/
│       ├── trainers/
│       │   ├── trainer-card.tsx
│       │   ├── trainer-list.tsx
│       │   └── trainer-profile.tsx
│       ├── booking/
│       │   ├── service-picker.tsx
│       │   ├── trainer-picker.tsx
│       │   ├── time-slot-grid.tsx
│       │   ├── booking-summary.tsx
│       │   └── booking-card.tsx
│       ├── calendar/
│       │   ├── admin-calendar.tsx
│       │   ├── event-popover.tsx
│       │   └── drag-drop-handler.tsx
│       ├── payment/
│       │   ├── checkout-form.tsx
│       │   └── payment-status.tsx
│       └── customer/
│           ├── booking-history.tsx
│           └── booking-detail.tsx
├── lib/
│   ├── prisma.ts                       # PrismaClient singleton
│   ├── auth.ts                         # Auth.js configuration
│   ├── stripe.ts                       # Stripe client init
│   ├── availability.ts                 # Slot computation engine
│   ├── booking-service.ts              # Create/cancel/reschedule logic
│   ├── notification-service.ts         # Email + SMS dispatch
│   ├── calendar-export.ts              # .ics generation
│   ├── validators.ts                   # Zod schemas (shared server + client)
│   └── utils.ts                        # Date helpers, formatters
├── hooks/
│   ├── use-availability.ts
│   ├── use-bookings.ts
│   └── use-debounce.ts
└── types/
    └── index.ts
```

## Database Schema (Prisma)

### Key Models

- **User** — customers, trainers, admins (role enum: `CUSTOMER`, `TRAINER`, `ADMIN`)
- **TrainerProfile** — extends User with bio, photo, specialties (string[]), certifications, yearsExperience, color (calendar display). One-to-one with User
- **Service** — name, description, type (`CLASS` | `PERSONAL` | `STUDIO`), durationMinutes, price (cents, EUR), maxParticipants, isActive
- **ServiceOnTrainer** — many-to-many join (which trainers offer which services)
- **Schedule** — recurring weekly availability per trainer (dayOfWeek, startTime, endTime as local time strings)
- **ScheduleOverride** — one-off blocks or extra availability (date, optional time range, isBlocked, reason)
- **Booking** — customerId, trainerProfileId, serviceId, startTime/endTime (UTC), status enum, version (optimistic locking)
- **Payment** — one-to-one with Booking, stripePaymentIntentId, amount (cents), status enum, refundedAmount
- **Notification** — userId, channel (`EMAIL` | `SMS`), type, body, sentAt
- **Reminder** — bookingId, scheduledAt, sentAt, channel

### Double-Booking Prevention (3 Layers)

1. **Application check** — query for conflicts before starting a transaction (fast-fail for UX)
2. **Transactional lock** — `SELECT ... FOR UPDATE` inside `prisma.$transaction` to prevent TOCTOU races
3. **DB exclusion constraint** — PostgreSQL `EXCLUDE USING gist` on `(trainerProfileId, tstzrange(startTime, endTime))` where status is active. Requires `btree_gist` extension. Added via raw SQL migration.

For group classes (`maxParticipants > 1`), use a count query inside the transaction instead.

## Timezone

**Fixed to `Europe/Lisbon`** (WET/WEST).

- All `DateTime` columns store UTC (`timestamptz`)
- Schedule times (`"09:00"`) are strings in Lisbon local time
- Availability engine converts to UTC via `date-fns-tz` with `Europe/Lisbon`
- Use constant `APP_TIMEZONE = "Europe/Lisbon"` in `src/lib/utils.ts`

## Payment Flow (Stripe)

1. Customer selects service + trainer + time slot
2. Server creates `Booking` (`PENDING_PAYMENT`) + Stripe `PaymentIntent` with `capture_method: 'manual'`
3. Customer pays via Stripe Elements
4. Webhook `payment_intent.amount_capturable_updated` -> capture -> `CONFIRMED`
5. Abandoned `PENDING_PAYMENT` bookings >15min cleaned up by cron
6. **Refund policy:** full if >24h, 50% if >12h, none otherwise

Currency: **EUR** (cents).

## Notification System

Queue-based, decoupled from booking flow:
1. Booking events insert `Notification` row with `sentAt = null`
2. `Reminder` rows created at booking time (24h + 1h before)
3. Cron `/api/cron/send-reminders` dispatches via Resend/Twilio every minute

## Conventions

- **Domain language:** "trainer" everywhere (not "staff" or "provider")
- **Route handlers are thin** — validate with Zod, call service in `src/lib/`, return response
- **Zod schemas** in `src/lib/validators.ts` shared server + client
- **Prices** in cents (EUR)
- **Timestamps** UTC in DB, `Europe/Lisbon` in UI

## Development Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npx prisma migrate dev   # Run migrations
npx prisma generate      # Regenerate Prisma client
npx prisma db seed       # Seed sample data
npx prisma studio        # Visual DB browser
```

## Environment Variables

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```
