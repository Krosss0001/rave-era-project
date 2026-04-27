# Rave'era Web MVP

Premium event platform demo for Rave'era Group.

Raveera helps organizers create, promote, sell, and scale events. The platform is designed for concerts, festivals, conferences, corporate events, cultural events, ticketing, audience growth, Telegram confirmation, referral growth, and organizer analytics. Raves and concerts are one supported use case, not the whole product.

Built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Mock fallback data for the MVP surface
- Supabase auth and database foundation
- Telegram registration handoff foundation
- Solana-ready wallet placeholder
- Server webhook foundation for Telegram Bot API
- No real payments yet
- No real Solana wallet adapter yet

## Routes

- `/` - premium product landing page
- `/events` - event discovery and ticketing surface
- `/events/[slug]` - event detail, referral support, Telegram CTA, wallet placeholder
- `/dashboard` - signed-in user dashboard for registrations, tickets, and referral state
- `/organizer` - organizer tools, event creation, registrations, referrals, Telegram status, analytics
- `/admin` - admin profile and role-management foundation
- `/superadmin` - superadmin-only platform control foundation

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Public frontend variables:

```bash
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/RaveeraBot
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

Server-only variables:

```bash
TELEGRAM_BOT_TOKEN=your_private_bot_token
SUPABASE_SERVICE_ROLE_KEY=your_private_service_role_key
```

Security notes:

- Private Telegram bot tokens must only live in `.env.local` or the deployment provider's server environment.
- Do not hardcode tokens and do not expose `TELEGRAM_BOT_TOKEN` to the browser.
- Supabase service-role keys must never be prefixed with `NEXT_PUBLIC_` or shipped to the browser.

## Supabase Schema

Database foundation:

```bash
supabase/schema.sql
```

Event field patches:

```bash
supabase/patches/002_expand_events.sql
supabase/patches/003_quality_alignment.sql
supabase/patches/004_ticket_insert_policy.sql
supabase/patches/005_registration_ticket_reliability.sql
supabase/patches/006_telegram_registration_state.sql
```

Fresh setup:

1. Open the Supabase project dashboard.
2. Go to SQL Editor.
3. Run the full contents of `supabase/schema.sql`.
4. Sign in with magic link so the `profiles` trigger can create a profile row.

Existing database setup:

1. Run `supabase/patches/002_expand_events.sql` if it has not been applied.
2. Run `supabase/patches/003_quality_alignment.sql`.
3. Run `supabase/patches/004_ticket_insert_policy.sql`.
4. Run `supabase/patches/005_registration_ticket_reliability.sql`.
5. Run `supabase/patches/006_telegram_registration_state.sql`.

The patches are written for existing databases. Patch `005` normalizes registration, ticket, and payment statuses before replacing the related check constraints.
Patch `006` creates the server-managed Telegram registration session table. It intentionally has RLS enabled with no client policies; the webhook route must use `SUPABASE_SERVICE_ROLE_KEY`.

## Telegram Bot Handoff

The event page builds a deep link from:

```bash
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/raveera_bot
```

For event slug `noir-signal`, the generated link is:

```text
https://t.me/raveera_bot?start=event_noir-signal
```

Webhook route:

```text
/api/telegram/webhook
```

The webhook receives Telegram updates, parses `/start event_slug` or `/start event_event_slug`, stores conversation state in `telegram_registration_sessions`, creates or reuses a pending registration, and creates or reuses a reserved ticket. Payment is not implemented yet; the bot replies that payment will be connected in the next phase.

Set the webhook later from a deployed HTTPS URL:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

Local testing note: Telegram requires a public HTTPS webhook URL. Use a secure tunnel only for testing, then set the webhook to the tunnel URL plus `/api/telegram/webhook`.

## Missing Profile Fix

If users existed before the profile trigger was added, run:

```sql
insert into public.profiles (id, email, role)
select id, email, 'user'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
```

Promote the first operator account:

```sql
update public.profiles
set role = 'superadmin'
where email = 'you@example.com';
```

## Roles

- `user` - attendee account with dashboard access.
- `organizer` - can create and manage owned events.
- `admin` - can manage platform records and promote users up to admin.
- `superadmin` - top-level platform operator.

Role-gated surfaces:

- `user` - `/dashboard`
- `organizer` - `/dashboard`, `/organizer`
- `admin` - `/dashboard`, `/organizer`, `/admin`
- `superadmin` - `/dashboard`, `/organizer`, `/admin`, `/superadmin`

RLS is enabled for every table. Current route guards are client-side because the MVP uses Supabase browser sessions; RLS is the real data security boundary. Move auth to cookie-based SSR before production.

## Event Creation Flow

Required role: `organizer`, `admin`, or `superadmin`.

1. Sign in with magic link.
2. Confirm your `profiles.role` is allowed.
3. Open `/organizer`.
4. Click **Create event**.
5. Fill required fields: title, slug, date/time, capacity.
6. Optional fields include subtitle, description, address, organizer info, Telegram URL, lineup, tags, doors open, event type, ticket wave label, urgency note, referral toggle, wallet toggle, and image URL.
7. Save to Supabase.

Public visibility:

- `live`, `limited`, and `soon` appear on `/events`.
- `draft` stays private to organizer/admin surfaces.

## Next Steps

1. Payment provider backend for Telegram and web checkout
2. QR check-in
3. Referral attribution on server-created registrations
4. Organizer-facing live Telegram registration dashboard
