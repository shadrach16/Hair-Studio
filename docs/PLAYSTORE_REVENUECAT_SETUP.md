# Play Console + RevenueCat — Manual Setup Guide

Last updated: 2026-06-14. Covers the v3.8.1 release, UK/US targeting, and wiring
in‑app purchases so the backend actually grants credits.

**App package:** `com.hairstudio.app`
**Latest build:** AAB `versionCode 33` / `versionName 3.8.1` (photo‑permission fix)
**Backend purchase webhook:** `POST /api/webhooks/revenuecat`

> ✅ **HTTPS is set up.** The backend now answers on
> `https://167-86-112-90.sslip.io` with a valid Let's Encrypt certificate
> (auto‑renewing). Use that as the webhook base URL. Plain HTTP on the raw IP still
> works for the app. (You can swap this free `sslip.io` host for a real branded
> domain later — just re‑issue the cert and update the RevenueCat webhook URL.)

---

## CRITICAL: product IDs must match everywhere

The backend maps a purchase to credits **by product ID** (`findCatalogItemByStorefrontId`).
The ID in **Play Console** must equal the ID in **RevenueCat** must equal the ID in
`backend/services/pricingCatalog.js`. If they differ by even one character, the
purchase succeeds but the user gets **no credits**.

### Credit packs — Play type: **In‑app product → Consumable**
| Product ID | Name | Credits | On Play? |
|---|---|---|---|
| `credits3` | Beginners Pack | 3 | ✅ |
| `credits10` | Novies Pack | 10 | ✅ |
| `credits25` | Starter Pack | 25 | ✅ |
| `credits100` | Essential Pack | 100 | ✅ (mark "popular") |
| `credits250` | Stylist Pack | 250 | ✅ |
| `unlimited` | Lifetime Access | ∞ | ✅ (type: **non‑consumable**) |
| `credits1000` (VIP) | — | 1000 | ❌ web/Dodo only |
| `credits10000` (Premium) | — | 10000 | ❌ web/Dodo only |

### Subscriptions — Play type: **Subscription** (one base plan each)
| Product ID | Base plan | Credits/mo | Notes |
|---|---|---|---|
| `basic_monthly` | monthly | 25 | |
| `plus_monthly` | monthly | 70 | |
| `pro_monthly` | monthly | 150 | |
| `plus_annual` | yearly | 70 (840/yr) | **3‑day free trial**, "recommended" |
| `pro_annual` | yearly | 150 (1800/yr) | |

> `plus_annual` and `pro_annual` may not exist yet — create them (the code already
> expects them).

---

## PART A — Google Play Console

### A1. Upload the new release
1. **Test and release → Production** (or a testing track first) → **Create new release**.
2. Upload `android/app/build/outputs/bundle/release/app-release.aab` (vc33).
3. Confirm **Play App Signing** is enabled (it should be — you upload with the upload key).
4. Add release notes, **Save** (don't roll out yet — finish the rest first).

### A2. Clear the photo/video permission rejection
The new build removed `READ_MEDIA_IMAGES`, so the rejection should disappear on upload.
Also check **Policy → App content → Permissions/Data safety**:
- Remove any "Photos and videos" access declaration that's no longer accurate.
- Re‑submit the Data safety form if it referenced photo permissions.

### A3. Target UK/US
1. **Release → Production → Countries / regions**.
2. Add **United States** and **United Kingdom** (plus any others you want, e.g. Canada,
   Ireland, Australia — all high‑ARPU English markets).
3. This is the single biggest revenue lever: the same pack that localizes to ~$0.21 in
   Nigeria holds near full value (~$0.99+) in the US/UK.

### A4. Store listing (diaspora positioning)
1. **Grow → Store presence → Main store listing.**
2. Set default language **English (United States)**; add **English (United Kingdom)**.
3. Lead the copy with the wedge: *"Try braids, locs, twists, fades & protective styles
   on your own photo — before your salon appointment."* Screenshots should show
   textured/Black hairstyles prominently.
4. Update title/short description with keywords: *braids try on, locs, protective styles,
   Black hairstyles AI*.

### A5. Create in‑app products (credit packs)
1. **Monetize → Products → In‑app products → Create product.**
2. For each row in the **Credit packs** table above, set **Product ID exactly** as listed.
3. `credits3…credits250` = **Consumable**; `unlimited` = **non‑consumable**.
4. Set prices (see **Pricing** below). **Activate** each.

### A6. Create subscriptions
1. **Monetize → Products → Subscriptions → Create subscription.**
2. Create one subscription per ID in the **Subscriptions** table; add a **base plan**
   (monthly or yearly to match).
3. On `plus_annual`, add a **free trial offer = 3 days**.
4. **Activate** each base plan.

### A7. Pricing (set for value, don't over‑discount)
**Margin rule:** a Standard try‑on now costs **2 credits** and ~$0.05–0.08 of AI. Keep
every credit worth **≥ ~$0.05** so each generation clears cost. Suggested USD (Play
auto‑converts to GBP — review, don't undercut):

| Pack | Credits | Suggested USD | $/credit |
|---|---|---|---|
| `credits3` | 3 | $1.99 | $0.66 |
| `credits10` | 10 | $4.99 | $0.50 |
| `credits25` | 25 | $9.99 | $0.40 |
| `credits100` | 100 | $24.99 | $0.25 |
| `credits250` | 250 | $49.99 | $0.20 |
| `unlimited` | ∞ | $99.99 (one‑time) | — |
| `basic_monthly` | 25/mo | $4.99/mo | |
| `plus_monthly` | 70/mo | $9.99/mo | |
| `pro_monthly` | 150/mo | $19.99/mo | |
| `plus_annual` | 840/yr | $59.99/yr | ~50% off monthly |
| `pro_annual` | 1800/yr | $119.99/yr | |

> These are higher than your current web/Dodo prices on purpose — UK/US can bear them,
> and they protect margin. Keep Play and Dodo roughly consistent (update the Dodo prices
> in `pricingCatalog.js` if you want parity).

### A8. Link Play ↔ RevenueCat (service account)
1. **Monetize → Monetization setup → (Google Play Developer API / Licensing).**
2. In **Google Cloud**, create a **service account** with access to your Play account,
   download the JSON key, and grant it **Financial data / Manage orders** in Play Console
   (**Users and permissions**).
3. You'll upload that JSON into RevenueCat in **Part B**.

---

## PART B — RevenueCat

### B1. Project + app
1. Create/open the RevenueCat project → **Add app → Google Play**.
2. Enter package `com.hairstudio.app`.
3. Upload the **Play service account JSON** from A8.

### B2. Import products
1. **Products** tab → **+ New** (or import from Play).
2. Add **every product ID** from the tables above, **exactly** as in Play/code.

### B3. Entitlement
1. **Entitlements** → create one called **`pro`** (or `premium`).
2. Attach the **subscriptions** and **`unlimited`** to it. (The app uses the entitlement
   to unlock pro features on‑device; the backend still grants credits by product ID.)

### B4. Offering + packages
1. **Offerings** → create/keep **`default`** (the app fetches the current offering).
2. Add packages for the products you want shown on the paywall (lead with `plus_annual`,
   `credits100`).

### B5. Webhook → your backend  ← this is what grants credits
1. **Project settings → Integrations → Webhooks → + New.**
2. **URL:** `https://167-86-112-90.sslip.io/api/webhooks/revenuecat`
3. **Authorization header:** set the value to **`Bearer <REVENUECAT_WEBHOOK_TOKEN>`**,
   where the token is the `REVENUECAT_WEBHOOK_TOKEN` value in your server `.env`
   (the backend checks `Authorization: Bearer <token>` and 401s otherwise).
4. Send a **test event** and confirm a `200 OK` + a `[RC Webhook]` line in `pm2 logs hairstudio`.

### B6. App user ID alignment (must‑do)
The webhook looks up the user by `app_user_id` = your **MongoDB user `_id`**. The mobile
app must call **`Purchases.logIn(<backend user id>)`** after login, so RevenueCat's
`app_user_id` equals the backend ID. If it's anonymous (`$RCAnonymous…`), the webhook
can't find the user and credits won't be granted. Verify this in `src/hooks/usePayment.ts`.

### B7. REST key (optional)
If the backend reads RevenueCat REST (`REVENUECAT_REST_API_KEY` in `.env`), paste the
**secret API key** from **Project settings → API keys**.

---

## PART C — Verify end‑to‑end (do before public rollout)
1. Internal testing track → install the vc33 build on a real device.
2. Log in → confirm RevenueCat `app_user_id` == backend user id.
3. Buy `credits3` (use a Play **license tester** for free test purchases).
4. Confirm: Play shows the order → RevenueCat shows the transaction → `pm2 logs hairstudio`
   shows `[RC Webhook] Event` → the user's **credit balance increases** in the app.
5. Buy `plus_annual` (3‑day trial) → confirm the `pro` entitlement unlocks + monthly
   credits land.
6. Only after this works end‑to‑end: **roll out to Production** for US/UK.

## Quick reference
- Package: `com.hairstudio.app`
- Webhook: `POST https://167-86-112-90.sslip.io/api/webhooks/revenuecat`, header `Authorization: Bearer <REVENUECAT_WEBHOOK_TOKEN>`
- `app_user_id` = MongoDB user `_id` (set via `Purchases.logIn`)
- Source of truth for IDs/credits: `backend/services/pricingCatalog.js`
