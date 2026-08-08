# Deep Linking + Attribution — Hair Studio × "Shad Hair Studio"

Turns content taps into attributed installs that land on the *specific* look referenced,
surviving an install (deferred). Built lean/free — no paid MMP.

## What was built / verified

| Area | Status | Notes |
|---|---|---|
| Hard paywall (server-side credit gate) | ✅ verified, untouched | `generations.js` blocks generation w/o credits |
| Native share sheet | ✅ verified | `@capacitor/share` in `ResultsViewer` |
| Referral (codes, rewards, UI, tracking) | ✅ verified | now uses a **deep link** (was a plain web URL) |
| Watermark | ✅ fixed | now `Made with Hair Studio AI · @ShadHairStudio` |
| `shared` analytics event | ✅ added | fires on collage + result share |
| Custom scheme + Android App Links | ✅ built | `hairstudio://` + verified `https://…/go` |
| Deferred install attribution | ✅ built | native Play Install Referrer plugin (no 3rd-party dep) |
| UTM/campaign capture + persist | ✅ built | `src/lib/attribution.ts` |
| `install_attributed` POST | ✅ built | once per install, deduped server-side |
| Backend store + endpoints | ✅ built | `Attribution` model + `/api/attribution/*` |
| Contextual paywall on deep link | ✅ built | banner tied to the referenced look |
| Build + tests | ✅ pass | vite build clean; 14/14 backend tests pass |

## The deep-link generator (per content)

**Canonical format** — one https App Link with UTM baked in:

```
https://167-86-112-90.sslip.io/go?content=<ARTIFACT_ID>&utm_source=youtube&utm_medium=video&utm_campaign=<VIDEO_ID>&ref=<REFERRAL_CODE?>
```

- `content` = the hairstyle/result id the video references → app deep-links straight to it.
- `utm_campaign` = the **video id** (so installs roll up per video).
- `utm_source` = channel/source (default `youtube`).
- `ref` (optional) = a referral code to also credit a referrer.

**Generate one via the backend** (no need to hand-build):

```
GET /api/attribution/share-link?artifactId=<ID>&videoId=<VID>&source=youtube&ref=<CODE>
->
{ "url": "https://…/go?…",           // put THIS in the video description
  "scheme": "hairstudio://go?…",      // for QR / in-app
  "playStoreUrl": "https://play.google.com/…&referrer=<utm…>" }  // deferred fallback
```

**Behavior**
- App installed (App Link verified): Android opens the app directly → routes to the look + contextual paywall, records `deep_link` attribution.
- App not installed: `/go` → tries the scheme, then Play Store **with the install referrer** → after install, first launch reads the Play Install Referrer → routes to the look + POSTs `install_attributed` (`install_referrer`). **Deferred deep link achieved.**

## Reporting

```
GET /api/attribution/campaigns        (admin or x-cron-secret)
-> { total, campaigns: [{ campaign(video_id), source, installs, signedIn, lastInstall }] }
```

## GO-LIVE checklist (activation)

1. **Deploy backend** (new routes serve `/go` + `/.well-known/assetlinks.json`).
2. **Add your Play App Signing SHA-256** to `ANDROID_CERT_SHA256` (env) — get it from
   Play Console → App integrity → App signing. Without it, App Links won't verify on
   Play builds (deferred + scheme paths still work).
3. **Rebuild + upload the AAB** (manifest intent-filters + native Install Referrer plugin
   are native — they need a new build).
4. Verify App Links: `adb shell pm verify-app-links --re-verify com.hairstudio.app` and
   `https://167-86-112-90.sslip.io/.well-known/assetlinks.json` returns your fingerprint.

> A branded domain (e.g. `links.shadhairstudio.com`) later → swap `PUBLIC_APP_LINK_HOST`
> + `VITE_APP_LINK_HOST`, reissue cert, update the manifest host. One-time.

## Privacy disclosure (add to the privacy page)

> **Install & campaign attribution.** When you install or open Hair Studio from a link in
> our "Shad Hair Studio" videos or a friend's referral, we read the campaign parameters
> attached to that link (e.g. the video it came from and the style referenced) — on
> Android via Google Play's Install Referrer. We use this to show you the style you tapped,
> to credit referrals, and to measure which content brings people in. We store a random
> per-install identifier (not tied to your device's advertising ID), the campaign/source,
> and the referenced item. We do **not** sell this data or use a paid third-party tracking
> SDK. You can request deletion of your attribution record at any time via support.
