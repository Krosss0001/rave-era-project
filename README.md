# Rave'era Platform

Rave'era is a premium event platform for creating events, promoting events, selling tickets, managing registrations, Telegram confirmation, referrals, organizer analytics, and future QR/check-in/payment flow.

It supports concerts and nightlife, but the product language is broader: conferences, festivals, cultural events, corporate events, ticketing operations, audience growth, and event operations.

Deploy URL:

```text
https://rave-era-project.vercel.app
```

## Current Features

- Public event discovery with Supabase data and mock fallback
- Event detail pages with responsive hero, safe image fallback, web registration, Telegram continuation, referrals, and organizer details
- UA/EN website language toggle with localStorage persistence
- UA/EN Telegram bot menu, search, event deep links, registration flow, and My Tickets
- Telegram broadcast preview and server-side sending for superadmins and organizer event campaigns
- Ticket creation with QR payload placeholder
- Free-event path that confirms registration without payment
- Paid-event path that reserves tickets with payment pending
- Organizer event creation and role-gated dashboards

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
- `/api/telegram/broadcast/preview` - estimate Telegram broadcast recipients
- `/api/telegram/broadcast/send` - send Telegram broadcasts through the server-side bot

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
supabase/patches/009_qr_checkin.sql
supabase/patches/010_telegram_broadcasts.sql
```

Patch `006` creates server-managed Telegram registration sessions. Patch `007` adds Telegram identity linking plus `registrations.telegram_user_id`. Patch `008` stores bot language preferences on `telegram_users` and `telegram_registration_sessions`. Patch `009` adds QR check-in support. Patch `010` adds Telegram broadcast tables, recipient tracking, and `telegram_users.is_subscribed`.

## Telegram Broadcasts

Superadmins can open `/superadmin` and use **Telegram Broadcast Center** to preview and send messages to all Telegram users, event audiences, or bot users who have not registered.

Organizers can open `/organizer` and use **Campaigns** to message audiences for their own events only:

- registered
- confirmed
- pending payment
- paid
- checked-in

Broadcast safety:

- Telegram messages are sent only from server routes.
- `TELEGRAM_BOT_TOKEN` stays server-only and is never exposed to the browser.
- Preview and send routes require a signed-in Supabase session.
- Organizers are restricted to event-scoped audiences for events they own.
- Unsubscribed users are excluded by `telegram_users.is_subscribed = true`.
- Users can send `/stop` to the bot to unsubscribe from future broadcasts.

## Payment And QR Behavior

Free events:

- Website shows `FREE` / `БЕЗКОШТОВНО` instead of `0 UAH`.
- Telegram shows `FREE` / `БЕЗКОШТОВНО`.
- Telegram confirmation creates or reuses a registration, sets it to `confirmed`, sets ticket status to `active`, sets payment status to `paid`, and shows the QR payload placeholder.

Paid events:

- Payment provider is intentionally not connected yet.
- Registration remains `pending`.
- Ticket remains `reserved`.
- Ticket `payment_status` remains `pending`.

Telegram images:

- The bot uses the original Supabase `events.image_url`.
- Only direct HTTPS URLs are attempted with `sendPhoto`.
- Invalid URLs, localhost URLs, blocked hosts, or Telegram send failures fall back to text-only previews.
- Server logs include event slug and error message only, never secrets.

## Telegram Webhook Setup

Set the webhook to the deployed route:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://rave-era-project.vercel.app/api/telegram/webhook"
```

Telegram requires public HTTPS. Local webhook testing needs a secure tunnel.

## Telegram Product Flow

The bot is designed as the main event companion:

1. `/start` opens language selection for new Telegram users.
2. Saved users go straight to the main menu.
3. Website event links pass the event slug through the Telegram `start` payload.
4. The bot shows the correct event preview, image when Telegram accepts it, and a text fallback when image sending fails.
5. Registration collects name, phone, company/role, and field/context.
6. Free events confirm immediately and unlock the QR.
7. Paid events create a reserved ticket with payment pending; QR stays locked until payment is confirmed.
8. **My tickets** finds tickets by Telegram user id, Telegram username, or linked profile.
9. **Show QR** generates a real QR image from `qr_payload` or `ticket_code`.
10. Organizers scan QR codes on `/check-in`.

Language behavior:

- New users choose between `🇺🇦 Українська` and `🇬🇧 English`.
- The choice is saved to `telegram_users.language`.
- The main menu includes `🌐 Змінити мову` / `🌐 Change language`.
- `/language` and `/lang` also reopen language selection.

QR and check-in behavior:

- QR is sent as a Telegram photo when possible.
- If QR image generation or Telegram upload fails, the bot falls back to the ticket code.
- Active paid tickets show the QR and door instructions.
- Pending-payment tickets explain that QR is locked.
- Used or checked-in tickets explain that the ticket was already used.
- `/check-in` is role-gated to organizer, admin, and superadmin users.
- The check-in page supports camera scan when the browser exposes `BarcodeDetector`, plus manual ticket-code entry.

Known limitations:

- Real payments are not connected yet.
- Paid tickets remain pending until manually or future-provider confirmed.
- Telegram-to-web account linking is based on stored Telegram identity and optional profile linkage; users who register on the web without a Telegram username may still need to continue through the event Telegram deep link.
- QR images are generated server-side for Telegram and client-side for dashboard display, but they are not yet stored as files.

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

Expected: event preview, direct Supabase `image_url` photo if it is valid HTTPS, text fallback if Telegram rejects the image, then confirmation buttons.

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

Show QR:

```text
Tap Show QR on an active paid ticket
```

Expected: Telegram sends a QR image with event title, ticket code, status, payment status, and entrance instructions. Pending tickets show a locked message. Used tickets show an already-used message.

Change language:

```text
Tap 🌐 Change language or send /language
```

Expected: the bot shows UA/EN buttons, saves the selection, and returns to the menu or active event confirmation.

Registration flow:

1. Open an event deep link.
2. Confirm the event.
3. Enter name.
4. Share or type phone.
5. Enter position and company.
6. Enter industry/company activity.
7. Confirm summary.
8. Tap payment/confirmation button.

Expected for paid events: registration and reserved ticket are created or reused, with `ticket_code`, `qr_payload`, and `payment_status: pending`.

Expected for free events: registration is confirmed, ticket status is active, payment status is paid, and QR payload is shown immediately.

Event detail conversion order:

1. Ticket wave / price / capacity.
2. Telegram execution layer.
3. Referral growth loop.
4. Solana-ready access placeholder.
5. Compact web registration fallback for users who prefer not to use Telegram.

## Demo Flow

1. Open the website.
2. Browse events.
3. Create an event as organizer.
4. Register on the event page.
5. Continue in Telegram.
6. Search events in the bot.
7. View My Tickets.
8. Show QR for active paid/free tickets.
9. Scan the QR on `/check-in` as organizer/admin/superadmin.
10. Confirm the registration and ticket rows in Supabase.
11. Explain that real payment provider integration is next-phase production work.

## Event Creation

Organizer, admin, and superadmin roles can create events at `/organizer`. Public event discovery only shows `live`, `limited`, and `soon`. Draft events remain private to organizer/admin surfaces.

## Roadmap

Near-term:

- real payments
- payment confirmation webhook
- stored QR image assets if needed
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
