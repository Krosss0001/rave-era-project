# Hackathon Readiness

## What Is Live

- Public website routes: `/`, `/events`, and `/events/[slug]`.
- Supabase-backed event discovery, event detail pages, registration/ticket state, referral tracking, and role-gated dashboards.
- Telegram bot webhook at `/api/telegram/webhook` with event discovery, registration collection, ticket lookup, QR delivery, and `/stop` unsubscribe support.
- Telegram Broadcast Center for superadmins and event-scoped organizer campaigns through `/api/telegram/broadcast/preview` and `/api/telegram/broadcast/send`.
- QR check-in route at `/check-in` with camera scanning when supported and manual ticket-code fallback.
- Organizer, admin, superadmin, and user dashboard surfaces behind Supabase auth and role checks.

## What Is Demo Or Devnet

- Solana Pay is connected as a Devnet-only demo path through `/api/solana/pay/create` and `/api/solana/pay/verify`.
- Web3 registration is available for signed-in wallet users through `/api/web3/registrations`.
- Payment conversion uses configured Devnet values and should be presented as a technical proof, not production settlement.
- Paid Telegram registrations reserve tickets but do not process real-money payment inside Telegram.

## What Is Mocked Or Placeholder

- No mainnet payment provider is enabled.
- No real-money card/acquiring provider is enabled.
- Telegram paid ticket payment remains a reserved/pending state unless manually confirmed or completed through the Devnet web path.
- Mobile app messaging is a placeholder where shown.
- AI organizer assistance is positioning/demo copy, not a connected automation engine.

## What To Show In Demo

- Open `/` and show the premium event platform positioning plus the moving Trusted by partner marquee on desktop and mobile width.
- Open `/events`, filter/browse events, then open an event detail page.
- Start Telegram registration from the event page and complete the bot flow with phone, name, optional Instagram, and email.
- Show the created registration/ticket in `/dashboard` or the organizer panel.
- Show referral link creation/tracking from organizer or superadmin surfaces.
- Preview and send a Telegram broadcast from `/superadmin` or an event-scoped organizer campaign, noting that broadcast copy no longer appends the unsubscribe footer.
- Show QR generation and `/check-in` validation for an active paid/free ticket.
- Show Solana Devnet payment as a demo-only Web3 proof when relevant.

## Remaining Risks

- Production payment settlement is not implemented; Devnet payments are not real revenue.
- Telegram delivery depends on users starting the bot and not blocking it.
- Broadcast sending depends on `TELEGRAM_BOT_TOKEN` and Supabase service role configuration.
- QR check-in requires correct role access and valid ticket state; camera support varies by browser/device.
- Supabase patch order must be applied consistently before judging.
- Public event stats and referral analytics depend on the expected RPCs/tables being present.

## Submission Checklist

- Confirm deployment uses `main` branch.
- Confirm no PWA branch work is merged into the submission.
- Confirm `NEXT_PUBLIC_APP_URL` points to the deployed HTTPS URL.
- Confirm `NEXT_PUBLIC_TELEGRAM_BOT_URL` points to the active bot.
- Confirm `TELEGRAM_BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are server-only.
- Confirm Telegram webhook is set to `/api/telegram/webhook`.
- Confirm Supabase patches through `017_solana_payment_uah_conversion.sql` are applied.
- Run `npm.cmd run build` before submission.
- Prepare one seeded event, one organizer account, one admin/superadmin account, and one test Telegram user.

## Judge Demo Flow

1. Show homepage positioning and partner marquee.
2. Browse `/events` and open a featured event.
3. Register through Telegram and show the resulting confirmation state.
4. Open `/dashboard` to show user tickets/referral state.
5. Open `/organizer` to show event operations, registrations, campaign broadcasting, and analytics.
6. Open `/superadmin` to show platform-level broadcast and referral controls.
7. Generate or open an active ticket QR and validate it at `/check-in`.
8. Show Devnet Web3 registration/payment as the optional technical proof.
9. Close by stating clearly: live platform and Telegram/QR/referrals are implemented; mainnet and real-money payments remain future production work.
