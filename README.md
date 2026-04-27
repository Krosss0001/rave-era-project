# Rave'era Platform

Rave'era is a premium event platform for creating events, promoting events, selling tickets, managing registrations, Telegram confirmation, referrals, organizer analytics, and future QR/check-in/payment flow.

It supports concerts and nightlife, but the product language is broader: conferences, festivals, cultural events, corporate events, ticketing operations, audience growth, and event operations.

Deploy URL:

```text
https://rave-era-project.vercel.app
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase auth and database
- Telegram Bot API webhook
- Lightweight UA/EN website language foundation
- UA/EN Telegram bot flows
- Mock fallback data for public pages
- No real payment provider yet

## Routes

- `/` - product positioning and premium event platform overview
- `/events` - public event discovery
- `/events/[slug]` - event detail, web registration, referral support, Telegram deep link
- `/dashboard` - registrations, tickets, and referrals for signed-in users
- `/organizer` - organizer event creation and operating panels
- `/admin` - admin role-management foundation
- `/superadmin` - superadmin control foundation
- `/api/telegram/webhook` - Telegram webhook

## Environment Variables

Public frontend variables:

```bash
NEXT_PUBLIC_APP_URL=https://rave-era-project.vercel.app
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot_username
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

Server-only variables:

```bash
TELEGRAM_BOT_TOKEN=your_private_bot_token
SUPABASE_SERVICE_ROLE_KEY=your_private_service_role_key
```

Never expose `TELEGRAM_BOT_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` in client code or with a `NEXT_PUBLIC_` prefix.

## Supabase Patch Order

Run these in Supabase SQL Editor in order:

```text
supabase/schema.sql
supabase/patches/002_expand_events.sql
supabase/patches/003_quality_alignment.sql
supabase/patches/004_ticket_insert_policy.sql
supabase/patches/005_registration_ticket_reliability.sql
supabase/patches/006_telegram_registration_state.sql
supabase/patches/007_telegram_user_linking.sql
supabase/patches/008_telegram_language_and_polish.sql
```

Patch `006` creates server-managed Telegram registration sessions. Patch `007` adds Telegram identity linking plus `registrations.telegram_user_id`. Patch `008` stores bot language preferences on `telegram_users` and `telegram_registration_sessions`.

## Telegram Webhook Setup

Set the webhook to the deployed route:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://rave-era-project.vercel.app/api/telegram/webhook"
```

Telegram requires public HTTPS. Local webhook testing needs a secure tunnel.

## Telegram Test Steps

Plain start:

```text
/start
```

Expected: language choice if no preference exists, then UA/EN menu with Search, My Tickets, app placeholder, and website link.

Event deep link:

```text
https://t.me/your_bot_username?start=event_noir-signal
```

Expected: event preview, safe image if `image_url` is valid HTTPS, text fallback if image fails, then confirmation buttons.

Search:

```text
Tap 🔍 Пошук or 🔍 Search
```

Expected: public events with status `live`, `limited`, or `soon`, each with register and website buttons.

My Tickets:

```text
Tap 🎟 Мої квитки or 🎟 My tickets
```

Expected: tickets found through `telegram_user_id`, linked `profile_id`, or `telegram_username`. If no tickets exist, the bot shows the localized empty state and website button.

Registration flow:

1. Open an event deep link.
2. Confirm the event.
3. Enter name.
4. Share or type phone.
5. Enter position and company.
6. Enter industry/company activity.
7. Confirm summary.
8. Tap payment stub.

Expected: registration and reserved ticket are created or reused, with `ticket_code`, `qr_payload`, and `payment_status: pending`.

## Demo Flow

1. Open the website.
2. Browse events.
3. Create an event as organizer.
4. Register on the event page.
5. Continue in Telegram.
6. Search events in the bot.
7. View My Tickets.
8. Confirm the registration and ticket rows in Supabase.
9. Explain that real payment, QR image generation, and check-in scanner are next-phase production work.

## Event Creation

Organizer, admin, and superadmin roles can create events at `/organizer`. Public event discovery only shows `live`, `limited`, and `soon`. Draft events remain private to organizer/admin surfaces.

## Roadmap

Near-term:

- real payments
- QR ticket generation
- check-in scanner
- organizer event CRUD
- email and Telegram confirmations
- referral attribution
- attendee export
- role audit logs

Mid-term:

- promo codes
- ticket tiers
- waitlists
- capacity waves
- organizer CRM
- analytics dashboard
- automated reminders

Long-term:

- mobile app
- white-label organizer pages
- wallet/NFT rewards
- smart access control
- partner marketplace
- AI campaign assistant
