# Android Packaging Plan

## Recommended Path: TWA / Bubblewrap First

Use Trusted Web Activity packaging with Bubblewrap first. Rave'era is already a PWA and should remain hosted at the production web origin. TWA keeps the existing web app as the source of truth, avoids duplicating frontend or backend logic, and lets the Android package point directly to the production URL.

Production URL target:

```text
https://rave-era-project.vercel.app
```

Suggested Android package name:

```text
com.raveera.app
```

## Alternative Path: Capacitor Later

Use Capacitor later only if the app needs native Android APIs, deeper app-switching behavior, native push notification handling, native wallet integration, or store requirements that TWA cannot satisfy. Capacitor adds native project maintenance and more Android WebView testing, so it should not be the first packaging path for this PWA.

## Required Tools

- Node.js and npm.
- Java JDK.
- Android Studio with Android SDK and build tools.
- Bubblewrap CLI.
- Android device or emulator for local APK testing.
- Access to the production domain for Digital Asset Links.

## Signing Key Warning

Never commit the Android keystore, keystore passwords, upload keys, signing configs with secrets, service-account files, or portal credentials. Store release signing material in a secure password manager or secret store. Losing the release key can block future app updates depending on the store signing setup.

## Versioning Notes

- `versionCode` is the monotonically increasing Android build number. Increment it for every APK/AAB uploaded to a store or reviewer portal.
- `versionName` is the user-facing version string, for example `0.1.0`.
- Record which web production deployment each Android version points to.
- Do not reuse a submitted `versionCode`.

## How The APK Points To Production

For TWA/Bubblewrap, initialize the Android project from the live manifest served by:

```text
https://rave-era-project.vercel.app/manifest.webmanifest
```

The generated Android shell launches `https://rave-era-project.vercel.app` in a Trusted Web Activity. The production site must serve the manifest, service worker, icons, and `/.well-known/assetlinks.json` for Android ownership verification.

## First Build Sequence

1. Install required tools.
2. Run Bubblewrap initialization against `https://rave-era-project.vercel.app/manifest.webmanifest`.
3. Use package name `com.raveera.app`.
4. Configure app label `Rave'era Group`.
5. Generate or attach the release signing key outside the repository.
6. Build an internal APK/AAB.
7. Install on Android hardware.
8. Verify login, wallet connect, Devnet payment, QR ticket, check-in, organizer analytics, superadmin referral analytics, and offline fallback.
