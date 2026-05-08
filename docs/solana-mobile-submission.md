# Solana Mobile Submission Notes

## App Store Metadata

**App name:** Rave'era Group

**Short description:** Mobile-first event discovery, ticket access, wallet connection, and QR check-in for Rave'era events.

**Full description:** Rave'era Group is an event operating system for concerts and cultural events. The app supports event discovery, registration, authenticated ticket access, wallet connection, Solana Devnet payment testing, QR ticket display, staff check-in, organizer analytics, Telegram-assisted operations, and referral analytics. This submission track is for a PWA packaged for future Solana Mobile / dApp Store Android distribution. Mainnet payments and real-money settlement are intentionally out of scope.

**Category recommendation:** Events / Entertainment. If the Solana dApp Store requires a Web3 category, use Utility / dApp as the secondary classification.

## Feature List

- Browse events from a mobile-first interface.
- View event details, venue, price, and availability.
- Create an account or sign in.
- Connect a Solana wallet for Web3-ready access.
- Test Solana Devnet payment flow where enabled.
- View personal tickets and ticket QR codes.
- Run QR check-in for authorized staff.
- Review organizer analytics.
- Review superadmin referral analytics.
- Use standalone PWA display, install prompt support, and offline fallback.

## Devnet Payment Test Flow

1. Open `https://rave-era-project.vercel.app` or the packaged Android build.
2. Sign in with the reviewer attendee account.
3. Open an event with the Solana Devnet payment panel enabled.
4. Connect a supported Solana wallet configured for Devnet.
5. Start the Devnet payment flow.
6. Approve the transaction with Devnet SOL only.
7. Return to Rave'era and verify the registration or ticket status.
8. Confirm that no mainnet payment prompt, mainnet SOL transfer, or real-money settlement path is exposed.

## Test Account Instructions Placeholder

Provide reviewer accounts out of band before submission. Do not commit credentials to this repository.

- Attendee reviewer: `attendee-reviewer@example.com` / password shared privately.
- Organizer reviewer: `organizer-reviewer@example.com` / password shared privately.
- Check-in reviewer: `checkin-reviewer@example.com` / password shared privately.
- Superadmin reviewer: `superadmin-reviewer@example.com` / password shared privately.
- Wallet requirement: Devnet wallet only, funded with Devnet SOL.

## Required Screenshots

- Home
- Events
- Event detail
- Login / Create account
- Wallet connect
- Solana Devnet payment
- Ticket QR
- Check-in
- Organizer analytics
- Superadmin referral analytics

## Required URLs

- Privacy policy URL placeholder: `https://rave-era-project.vercel.app/privacy`
- Support URL placeholder: `https://rave-era-project.vercel.app/support`

Replace placeholders with final public pages before submission.

## Publisher Portal Notes

- Use the production URL: `https://rave-era-project.vercel.app`.
- Use package name `com.raveera.app` unless a final publisher namespace changes.
- Mark payment testing as Devnet-only in reviewer notes.
- State that no seed phrases, private keys, or mainnet payments are collected by the app.
- Provide reviewer credentials privately through the portal fields, not in source control.
- Upload screenshots captured from the production PWA or packaged Android build.

## APK / TWA Next Steps

1. Confirm the production PWA URL, manifest, service worker, HTTPS certificate, and icons.
2. Generate a TWA project with Bubblewrap using package name `com.raveera.app`.
3. Configure Digital Asset Links at `https://rave-era-project.vercel.app/.well-known/assetlinks.json`.
4. Build an internal APK/AAB and install it on Android hardware.
5. Verify login, wallet connect, Devnet payment, ticket QR, check-in, organizer analytics, superadmin referral analytics, offline fallback, and safe-area behavior.
6. Sign release artifacts only after the signing key, `versionCode`, `versionName`, and production URL are finalized.
