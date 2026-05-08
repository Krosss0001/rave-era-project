# Solana Mobile Submission Notes

## App Name

Rave'era Group

## Short Description

Mobile-first event discovery, ticket access, wallet connection, Devnet payment testing, and QR check-in for Rave'era events.

## Full Description

Rave'era Group is a PWA event operating system for concerts and cultural events. It supports event discovery, account-based registration, ticket QR access, staff check-in, organizer analytics, referral analytics, Telegram-assisted operations, wallet connection, and Solana Devnet payment testing for paid website registrations.

This submission path prepares the hosted PWA for future Android TWA packaging and Solana dApp Store review. Mainnet payments, Seed Vault, Mobile Wallet Adapter, and native Android code are not implemented yet.

## Features

- Browse events and event details.
- Register on the website for free events after sign-in.
- Register for paid events with Phantom/wallet connection and Solana Devnet payment.
- View ticket status and QR codes.
- Validate tickets through mobile-first check-in.
- Restrict check-in to organizer, admin, and superadmin roles.
- Review organizer analytics.
- Review superadmin referral analytics.
- Use PWA install, standalone mode, mobile safe-area layout, and offline fallback.

## Screenshots Needed

- Home
- Events
- Event detail
- Login / Create account
- Wallet connect
- Solana Devnet payment
- Ticket QR
- Check-in scanner
- Organizer analytics
- Superadmin referral analytics

## APK / TWA Plan

- Recommended path: TWA/Bubblewrap first.
- Production URL: `https://rave-era-project.vercel.app`.
- Manifest URL: `https://rave-era-project.vercel.app/manifest.webmanifest`.
- Suggested package name: `com.raveera.app`.
- Configure Digital Asset Links after the Android signing certificate is finalized.
- Keep the signing keystore and passwords out of git.
- Capacitor remains a later option only if native Android APIs become necessary.

## Publisher Portal Notes

- Category recommendation: Events / Entertainment, with Utility / dApp as secondary if required.
- Privacy policy URL placeholder: `https://rave-era-project.vercel.app/privacy`.
- Support URL placeholder: `https://rave-era-project.vercel.app/support`.
- Provide reviewer credentials only through private publisher portal fields.
- State clearly that payments are Devnet-only and no mainnet payments are available.
- State clearly that Seed Vault and Mobile Wallet Adapter are not implemented in this PWA build.

## Devnet Testing Instructions

1. Open `https://rave-era-project.vercel.app` or the packaged TWA.
2. Sign in with the attendee reviewer account.
3. Open a paid event.
4. Connect Phantom or open the app in a compatible wallet browser.
5. Complete website registration.
6. Start the Solana Devnet payment panel.
7. Pay with Devnet SOL only.
8. Confirm the ticket becomes active/paid and QR is available.
9. Sign in as an organizer/admin/superadmin reviewer and validate the QR on `/check-in`.

## Test Account Placeholder

- Attendee reviewer: provide privately.
- Organizer reviewer: provide privately.
- Check-in reviewer: provide privately.
- Superadmin reviewer: provide privately if superadmin analytics must be reviewed.
- Devnet wallet: provide funding instructions, not private keys.
