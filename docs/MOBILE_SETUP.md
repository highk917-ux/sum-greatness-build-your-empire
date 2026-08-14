# Native Mobile Build Setup

## App identity

- Name: SUM GREATNESS: Build Your Empire
- App ID / package: `com.sumgreatness.buildyourempire`
- Web build directory: `dist`
- Android development: Android Studio
- iOS development: Xcode on macOS

## Generate the native projects

Merge the dependencies from `mobile/package.mobile.json` into `package.json`, install them, then run:

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Open each project with:

```bash
npx cap open android
npx cap open ios
```

Do not run `cap add` twice for an existing platform.

## RevenueCat

Use `@revenuecat/purchases-capacitor` and `@revenuecat/purchases-capacitor-ui` 10.3.1 or newer.

Entitlement:

`SUM GREATNESS: Build Your Empire Pro`

Products:

- `com.sumgreatness.cash.small`
- `com.sumgreatness.cash.large`
- `com.sumgreatness.gems.100`
- `com.sumgreatness.founder`
- `com.sumgreatness.pro.monthly`
- `com.sumgreatness.pro.yearly`
- `com.sumgreatness.pro.lifetime`

API keys must be configured through local or CI secrets. Never commit production keys.

Consumable cash and gem purchases are credited after verified purchase completion. Non-consumable and subscription entitlements support Restore Purchases.

## AdMob

Planned placements:

- rewarded-main
- rewarded-interstitial-mission
- shop-banner
- app-open

Use Google's official test ad units during development. Never click production ads during testing. Rewarded ads must remain optional.

## Release blockers requiring owner accounts

- Google Play Console app record and product creation
- Google Play payments profile and license testing
- RevenueCat project, store connections, offerings, and production SDK keys
- AdMob app record and production ad unit IDs
- Android upload key and Play App Signing
- Apple Developer membership, App Store Connect record, certificates, and in-app purchase key
- Physical-device sandbox purchase testing
