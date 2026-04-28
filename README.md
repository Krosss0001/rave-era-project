# Rave'era Platform

Rave'era is a premium event platform for creating events, promoting events, managing registrations, Telegram confirmation, QR tickets, check-in, referrals, organizer analytics, and future payment flow.

Deploy URL:

```text
https://rave-era-project.vercel.app
```

## Current Features

- Public event discovery with Supabase data and mock fallback
- Event detail pages with responsive hero, safe image fallback, web registration, Telegram continuation, referrals, and organizer details
- UA/EN website language toggle with localStorage persistence
- Ukrainian-only Telegram bot menu, event search, event deep links, registration flow, QR tickets, and My Tickets
- Telegram broadcast preview and server-side sending for superadmins and organizer event campaigns
- Ticket creation with QR payloads
- Free-event path that confirms registration without payment
- Paid-event path that reserves tickets with payment pending
- Role-gated organizer, admin, superadmin, dashboard, and check-in surfaces

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase auth and database
- Telegram Bot API webhook
- Lightweight UA/EN website language foundation
- Ukrainian-only Telegram bot flows
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
- `/check-in` - role-gated QR/ticket validation and door check-in
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
supabase/patches/011_registration_contact_fields.sql
```

Patch `006` creates server-managed Telegram registration sessions. Patch `007` adds Telegram identity linking plus `registrations.telegram_user_id`. Patch `008` keeps legacy language columns defaulted to `uk`. Patch `009` adds QR check-in support. Patch `010` adds Telegram broadcast tables, recipient tracking, and `telegram_users.is_subscribed`. Patch `011` adds `registrations.phone` and `registrations.instagram_nickname`.

## Telegram Webhook Setup

Set the webhook to the deployed route:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://rave-era-project.vercel.app/api/telegram/webhook"
```

Telegram requires public HTTPS. Local webhook testing needs a secure tunnel.

## Telegram Bot Flow

The bot is Ukrainian-only. `/start` opens the main menu:

- `🔍 Знайти подію`
- `🎟 Мої квитки`
- `🌐 Відкрити сайт`
- `📱 Додаток`

`🔍 Знайти подію` lists public events with title, date, location, and price. Each event has `Зареєструватись`, `Відкрити на сайті`, and `Поділитися`.

`🎟 Мої квитки` finds tickets by `telegram_user_id`, linked profile, or Telegram username. Each ticket shows event, code, and status, with `Показати QR` and `Відкрити подію`. If no tickets exist, the bot replies: `У вас ще немає квитків`.

`🌐 Відкрити сайт` points to `/events`. `📱 Додаток` shows a placeholder message until the app is available. Unknown text returns the user to the main menu so there are no dead ends.

## Telegram Registration Fields

Registration starts from an event deep link or an event card. The bot confirms the event, then collects:

1. Mobile phone, required.
2. Full name, required.
3. Instagram nickname, optional.
4. Email, required.

The summary shows event, phone, name, Instagram, and email. Confirming creates or reuses a registration and creates or reuses a ticket. Free events immediately confirm the registration and activate the ticket. Paid events stay reserved until payment support is connected.

## QR And Check-In

`Показати QR` generates a QR image from the ticket QR payload or ticket code. Active paid/free tickets show the QR and entrance instructions. Reserved, pending, used, or checked-in tickets show a clear status message instead of crashing.

Organizers, admins, and superadmins use `/check-in`. The page supports camera scanning when `BarcodeDetector` is available and manual ticket-code entry otherwise. Check-in validates the QR payload, confirms event ownership through Supabase policies/RPC, and marks active paid tickets as used.

Safe logs include operational details such as event slug, ticket code, Telegram user id, and error message only. Secrets and tokens are never logged.

## Telegram Broadcasts

Superadmins can open `/superadmin` and use Telegram Broadcast Center to preview and send messages to all Telegram users, event audiences, or bot users who have not registered.

Organizers can open `/organizer` and use Campaigns to message audiences for their own events only:

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

## Telegram Test Steps

1. Send `/start`.
   Expected: Ukrainian menu with event search, tickets, website, and app placeholder.

2. Tap `🔍 Знайти подію`.
   Expected: event cards with title, date, location, price, and the three action buttons.

3. Open an event card and tap `Зареєструватись`.
   Expected: event confirmation, then four numbered registration steps.

4. Enter phone, full name, optional Instagram, and email.
   Expected: summary with `Все правильно`, `🔁 Почати спочатку`, and `Скасувати`.

5. Confirm the summary.
   Expected: registration/ticket is created or reused. Free events return an active ticket. Paid events return a reserved ticket.

6. Tap `🎟 Мої квитки`.
   Expected: event, code, status, `Показати QR`, and `Відкрити подію`. Empty users see `У вас ще немає квитків`.

7. Tap `Показати QR`.
   Expected: active paid/free tickets send a QR image. Pending tickets explain that QR is locked. Used tickets explain that the ticket was already used.

8. Scan the QR on `/check-in` as organizer/admin/superadmin.
   Expected: valid active paid ticket can be checked in; invalid QR, event mismatch, pending ticket, or used ticket shows a clear message and logs a safe diagnostic.

## Known Limitations

- Real payments are not connected yet.
- Paid tickets remain pending until manually or future-provider confirmed.
- Telegram-to-web account linking is based on stored Telegram identity and optional profile linkage.
- QR images are generated on demand and are not yet stored as files.

## Demo Flow

1. Open the website.
2. Browse events.
3. Create an event as organizer.
4. Register on the event page or continue in Telegram.
5. Search events in the bot.
6. View My Tickets.
7. Use `Показати QR` for active paid/free tickets.
8. Scan the QR on `/check-in` as organizer/admin/superadmin.
9. Confirm the registration and ticket rows in Supabase.
10. Explain that real payment provider integration is next-phase production work.

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
