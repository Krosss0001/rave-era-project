# Mobile Readiness

## PWA Install Status

- Manifest route is available at `/manifest.webmanifest`.
- App name is `Rave'era Group`.
- Standalone display mode is configured.
- Theme color and dark color scheme are configured.
- 192, 512, maskable 512, and Apple touch icons exist under `public/icons/`.
- Service worker is registered in production and serves `public/offline.html` for navigation fallback.
- Mobile safe-area CSS is present for header, bottom navigation, install prompt, and page shells.

## Android TWA Plan

- Recommended path: Trusted Web Activity with Bubblewrap.
- Production URL target: `https://rave-era-project.vercel.app`.
- Suggested package name: `com.raveera.app`.
- Generate the TWA from `https://rave-era-project.vercel.app/manifest.webmanifest`.
- Serve Digital Asset Links from `https://rave-era-project.vercel.app/.well-known/assetlinks.json`.
- Keep Android signing keys and passwords outside the repository.

## Solana dApp Store Requirements

- Production HTTPS app URL.
- App name, short description, full description, category, support URL, and privacy policy URL.
- APK/AAB signed with a secure release key.
- Screenshots from Android hardware or emulator.
- Reviewer credentials shared only through the publisher portal.
- Devnet-only payment test instructions.
- Clear disclosure that mainnet payments, Seed Vault, and Mobile Wallet Adapter are not implemented yet.

## Required Screenshots

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

## Test Accounts

Create reviewer-safe accounts before submission and share credentials out of band.

- Attendee reviewer account.
- Organizer reviewer account.
- Check-in reviewer account with organizer/admin/superadmin access.
- Superadmin reviewer account if referral analytics must be reviewed.
- Devnet wallet funded with Devnet SOL only.

## Devnet Payment Test Flow

1. Open `https://rave-era-project.vercel.app` or the packaged TWA build.
2. Sign in as the attendee reviewer.
3. Open a paid event.
4. Connect Phantom or use a compatible wallet browser.
5. Register on the website.
6. Start the Solana Devnet payment flow.
7. Pay with Devnet SOL only.
8. Verify that the ticket changes from reserved/pending to active/paid.
9. Open the ticket QR and confirm it can be validated by an authorized check-in account.

## Check-In Readiness

- `/check-in` is protected by `RoleGate` for organizer, admin, and superadmin.
- Normal users do not see the scanner.
- Signed-out users see an access screen with a login/create account control.
- The scanner uses the mobile rear camera when available and falls back to manual ticket code entry.
- The page now includes camera permission instructions for mobile browsers.

## Known Limitations

- No native Android project exists yet.
- No Seed Vault integration is implemented.
- No Mobile Wallet Adapter integration is implemented.
- Wallet connection currently relies on Phantom/browser provider behavior.
- Solana Pay is Devnet-only.
- Final privacy and support URLs still need production pages.
- Digital Asset Links are not configured until the Android package certificate is known.
