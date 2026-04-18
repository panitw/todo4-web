# `.well-known/` — Universal Links & App Links hosting

These files enable `https://todo4.io/app/*` URLs to open the native mobile app directly on iOS and Android, instead of the browser.

They're static assets served verbatim by Next.js out of `todo-web/public/.well-known/` with no application code in the path. `apple-app-site-association` gets its `Content-Type: application/json` override from `next.config.ts` `headers()`.

## Files

- `apple-app-site-association` — iOS Universal Links config. **No extension.** iOS rejects the file if served as `.json`.
- `assetlinks.json` — Android App Links config.

## Placeholders (must be replaced before first TestFlight / Play Internal Testing build that uses deep links)

| File | Placeholder | Replace with |
|---|---|---|
| `apple-app-site-association` | `REPLACE_WITH_APPLE_TEAM_ID` | 10-character Apple Team ID |
| `assetlinks.json` | `REPLACE_WITH_PRODUCTION_SHA256_FINGERPRINT` | SHA-256 of the production EAS Build Android keystore |
| `assetlinks.json` | `REPLACE_WITH_PREVIEW_SHA256_FINGERPRINT` | SHA-256 of the preview EAS Build Android keystore |

The `io.todo4.mobile` bundle ID / package name is fixed per the mobile-app architecture shard and matches `app.config.ts` in `todo-mobile` (Story 18.9; updated 2026-04-15 from `com.todo4.mobile` to match the `todo4.io` domain).

## How to obtain the real values

### Apple Team ID

1. Sign in to https://developer.apple.com/account
2. Open the **Membership** tab
3. Copy the 10-character **Team ID** (e.g. `AB12CDE345`)

### Android SHA-256 fingerprints (from EAS Build)

Story 18.16 sets up EAS Build + Submit. Once the Android keystore is generated:

```bash
cd todo-mobile
eas credentials --platform android
```

Select the `production` (and `preview`) profile and copy the `SHA-256 Fingerprint` line. The value is already in the uppercase colon-separated format Android expects (e.g. `01:23:45:AB:CD:EF:...`).

## When to update

**Story 18.16** — before the first `eas build --profile production --platform ios` and `eas submit --platform android` that relies on App Links / Universal Links to route push-notification tap-throughs to the app.

Until then, these files ship valid JSON with placeholder strings so the hosting pipeline and CI validator pass. The validator (`pnpm validate:well-known`) only checks shape, not value correctness — the review gate for the real values is this README's checklist.

## Rotation log

- **Story 18.16 (2026-04-18):** Apple Team ID populated in `apple-app-site-association` (replaced `REPLACE_WITH_APPLE_TEAM_ID`). Android SHA-256 fingerprints in `assetlinks.json` remain pending `eas credentials --platform android` output — the release engineer must replace both `REPLACE_WITH_*_SHA256_FINGERPRINT` values before the first `eas submit --profile production` and append a dated entry to this log on every subsequent keystore rotation (Android) or Team ID change (iOS).

## Regression hazards

- **Do not redirect** either path. iOS rejects redirects during AASA verification and silently drops the universal-links claim.
- **Do not rename** `apple-app-site-association` to add `.json`. The file name is fixed by Apple spec.
- **Do not gzip-encode** either response. Some gzip intermediaries change the `Content-Type`; Apple's validator fails on that.
- **Do not put the files behind auth.** The domain verification services fetch these unauthenticated.
