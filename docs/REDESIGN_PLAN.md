# Hair Studio — Premium Redesign & Billing Restructure Plan

Date: 2026-08-09 · Status: **approved-pending-review** · Owner: solo founder
References studied: **Retinue** and **Nerve** apps (`Desktop/Retinue/mobile`, `Desktop/Nerve/mobile`) — both built on **@ionic/react 8 + ionicons 7 + Capacitor + Tailwind + framer-motion**, which is the target stack.

---

## 0. Diagnosis — why the app feels "cheap" today

| Symptom | Root cause |
|---|---|
| Feels like a website | Long-press text selection (fixed vc37), browser scroll physics, no native transitions between screens, tap targets from desktop CSS |
| Visual noise | 3 mismatched fonts (Work Sans + Poppins + decorative "Fascinate Inline"/"Emblema One"), shadcn defaults, gradient-heavy buttons, emoji as icons |
| First-run friction | User must understand credits + tiers + upload rules *before* their first wow moment; gallery is a wall of 289 thumbnails with no guidance |
| Results feel "AI" | Output shown in a plain card with a debug-y caption, loud watermark text, no presentation polish — nothing that makes someone *proud* to post it |
| Paywall anxiety | Credit math ("4 cr", "8 cr") forces users to do arithmetic; billing UI leads with money, not value |

North star: **"salon lookbook, not AI tool."** Every screen should feel like a premium beauty editorial; the AI is the invisible engine.

---

## 1. Design system (the Retinue lesson)

Retinue's system works because it is *disciplined*: two typefaces with strict roles, token-based color, system font for chrome. We adopt the same discipline with Hair-Studio-appropriate faces.

### 1.1 Typography — two-typeface system
| Role | Face | Usage rules |
|---|---|---|
| **Display / editorial voice** | **Fraunces** (self-hosted, wght 400–600, SOFT axis high) | Style names, result headline, onboarding headlines, paywall headline. Never below 19px. Warm, magazine-serif = beauty editorial. |
| **UI chrome** | **system-ui** (SF Pro / Roboto) | Everything else: labels, buttons, nav, metadata. This is what premium native apps ship — it *reads native* instantly. |
| Wordmark (optional) | A single lettering face (e.g. Norican-style script) for the "Hair Studio" logotype only | Splash + auth header only. Never UI text. |

Kill: Poppins, Work Sans, Fascinate Inline, Emblema One. Self-host fonts (no Google Fonts request at runtime — offline + privacy + speed).

Type scale (Retinue-derived, px/line): `micro 12/16 · caption 13/18 · label 14/20 · body 15/23 · body-lg 17/26 · title 19/24 (Fraunces) · display 28/34 (Fraunces) · hero 34/40 (Fraunces)`.

### 1.2 Color tokens (CSS variables, Tailwind-mapped)
Evolve amber → **brass/champagne** (premium, less "warning-yellow"):

```css
:root {                      /* light — default; beauty apps photograph best on light */
  --surface:   #FAF8F5;      /* warm paper, not pure white */
  --surface-2: #FFFFFF;      /* cards */
  --ink:       #1C1917;      /* warm near-black */
  --ink-2:     #57534E;      /* secondary */
  --ink-3:     #A8A29E;      /* tertiary/disabled */
  --hairline:  #E7E2DC;      /* 1px separators — replaces boxy borders */
  --brass:     #B98A2F;      /* primary accent (was #F59E0B) — CTAs, selection */
  --brass-ink: #7C5A1A;      /* accent text on light */
  --success:   #3F7A5A;  --danger: #B3402F;
}
.dark { --surface:#141210; --surface-2:#1E1B18; --ink:#F5F2EE; --ink-2:#B8B2AA;
        --ink-3:#736D65; --hairline:#2A2622; --brass:#D4A94C; --brass-ink:#E8C97A; }
```

Rules: **hairlines instead of borders, one shadow level, one accent color.** Gradients only on the single primary CTA per screen — nowhere else.

### 1.3 Iconography
**ionicons 7** everywhere (outline for idle, filled for active — the pattern Ionic tabs use natively). Kill lucide + emoji-as-icon. Emojis remain only inside user-facing *content* (share card is emoji-free).

### 1.4 Motion
framer-motion (already a dep in the reference apps): 250ms spring sheet presentations, 150ms fades, `active:scale-[0.98]` press states everywhere, skeleton shimmer for loading. Never a browser-feeling instant jump between screens.

---

## 2. Stack & packaging migration

Target: **@ionic/react 8 + ionicons 7 + Capacitor (keep 7) + Tailwind + framer-motion** — identical to Retinue/Nerve, so patterns (BottomSheet, ScreenHeader, EmptyState, PermissionPrimer, SearchOverlay) can be ported near-verbatim.

**Staged, not big-bang** (app keeps shipping throughout):

| Stage | Scope | Risk |
|---|---|---|
| M1 | Add `@ionic/react` + ionicons; wrap app in `IonApp`; adopt tokens + fonts + type scale in Tailwind config; global press-states | Low — visual layer only |
| M2 | Rebuild **shell**: `IonTabs` (Try On · Looks · Profile), `IonPage`/`IonNav` transitions, ScreenHeader, BottomSheet primitives (replace 7 ad-hoc modals) | Medium |
| M3 | Rebuild the 4 money screens on the new primitives: Home/Discover, StyleDetail, ConfirmGenerate, **Results** | Medium |
| M4 | Paywall + billing restructure (section 5) — ships together with backend limits | High — gated behind test track |
| M5 | Delete shadcn/lucide/old fonts; bundle audit | Low |

Port from Retinue verbatim: `BottomSheet.tsx`, `ScreenHeader.tsx`, `EmptyState.tsx`, `FadeIn.tsx`, `PermissionPrimer.tsx` (photo permission priming!), `SearchOverlay.tsx`.

---

## 3. First-use UX — "find a style → see it on me" in 3 taps

### 3.1 The golden path (target: <60s install→wow)
```
Open → (no signup) → Home shows STYLES immediately (guest mode, 2 free tries)
Tap a style → StyleDetail sheet: big imagery + "Try it on me"
→ camera/photo picker (system Photo Picker; PermissionPrimer first)
→ generating screen (styled progress, 15–25s, facts carousel)
→ RESULT. Wow. → save/share → NOW invite signup to keep it.
```
Signup moves *after* the first result (guest flow already exists — make it the default path). Nothing about credits/tiers is mentioned until try #2.

### 3.2 Finding a style (the core complaint)
- **Home = editorial lookbook, not a grid dump**: horizontally-scrolling shelves — *For You* (existing recommender), *Trending*, *Braids*, *Locs & Twists*, *Fades*, *Color* — each shelf 6–8 large cards (2 visible), tap-through to full category.
- **Persistent search** (SearchOverlay pattern): search by name/category + quick filter chips: `Braids · Locs · Fades · Short · Long · Color · Protective` and **hair-length + gender** toggles that persist.
- **"Styles like this"** on every StyleDetail (existing `getSimilarStyles` endpoint — currently unused in UI).
- **Face-first entry point**: a prominent "Not sure? Upload your photo first" card — after upload, the shelf reorders to recommendations (upload-first users convert better; both orders must work).
- Skeletons everywhere; images via thumbnail-size Cloudinary transforms (`w_400,q_auto,f_auto`) — the current full-size loads are a big "cheap feel" contributor on mid-range Androids.

### 3.3 Progressive onboarding
Replace the 4-screen intro carousel with **zero-screen onboarding**: land directly on the lookbook with a one-line overlay ("Tap any style to see it on you") + coach-mark on first StyleDetail. Every classic onboarding screen costs ~10–20% of first-opens.

---

## 4. Results & share — "premium enough to post"

This is where "doesn't feel AI-generated" is won. People post what makes *them* look good.

### 4.1 Result screen redesign
- **Full-bleed photo-first**: result fills the screen edge-to-edge; controls float over it (Retinue's photo-forward pattern). No card-in-a-card.
- **Before/After**: draggable divider slider (native-feeling) instead of side-by-side thumbnails; tap toggles.
- Style name set in **Fraunces** italic over the image bottom ("Goddess Braids — Hair Studio") like a lookbook caption.
- Actions: one primary (**Share**), secondary row (Save · Try another quality · Book-this-look note), all ionicons.
- **Quality language**: "Standard/HD/Pro" → **"Preview / Portrait / Studio"** — camera language, not AI language.
- Auto-enhance pass on display (subtle contrast/warmth via CSS filter) — free perceived quality.

### 4.2 Share cards (replace the current canvas collage)
Three exportable formats, all **emoji-free, editorial, 1080×1920 + 1080×1350**:
1. **Clean** — just the result, tiny brass wordmark bottom-corner (paid tiers: watermark optional).
2. **Editorial** — result on `--surface` mat, style name in Fraunces, thin hairline frame — looks like a salon lookbook page.
3. **Before/After** — vertical split with the divider styled as a brass hairline.
No "AI" badges, no robot language on exports. In-app we stay honest ("AI preview — results are approximations" stays in the app UI); the *export* is the user's photo styled like a magazine, with a tasteful watermark = `Hair Studio · @ShadHairStudio` (Free tier) or optional (paid).
- **4K export** (gemini-3.1-flash-image / 3-pro-image support 2K/4K) = Pro-tier perk: "Studio quality, 4K".

### 4.3 Identity quality (the "still looks like me" trust)
Backend already routes Pro → `gemini-3-pro-image` (best likeness per research). Add to the plan: prompt hardening ("change ONLY the hair; preserve facial features, skin tone, lighting") + show a subtle "Likeness check ✓" line on results that pass the existing output-quality gate — quality theater that is actually true.

---

## 5. Billing restructure — subscriptions with a free tier

### 5.1 Unit economics (verified numbers)
Per-generation all-in cost (image call + ~4 aux Gemini calls @ ~$0.015):

| Quality | Model | API cost | All-in | Internal units |
|---|---|---|---|---|
| Preview (Standard) | gemini-2.5-flash-image | ~$0.039 | **~$0.055** | 1 |
| Portrait (HD) | gemini-3.1-flash-image (1K) | $0.067 | **~$0.085** | 2 |
| Studio (Pro) | gemini-3-pro-image (1K/2K) | ~$0.24 | **~$0.26** | 4 |

Worst per-unit cost ≈ **$0.065** (Studio), typical ≈ $0.045–0.055.

### 5.2 Tiers (daily cap for pacing + monthly ceiling for the margin floor)
The **monthly ceiling is what guarantees you can't lose money**; the daily cap creates the comeback habit and the upgrade pressure.

| Tier | Price | Daily cap | Monthly ceiling | Quality access | Extras |
|---|---|---|---|---|---|
| **Free** | $0 | 2 units/day | 20 units/mo | Preview only | Watermark on export; rewarded ad → +1 unit/day (cap 1) |
| **Plus** | **$3.99/mo** (or ₦-localized) | 8 units/day | **80 units/mo** | Preview + Portrait | No watermark, Editorial share cards |
| **Studio** | **$9.99/mo** | 20 units/day | **200 units/mo** | All incl. Studio | 4K export, priority queue, watermark-free everything, early styles |
| Annual | Plus $29.99/yr · Studio $79.99/yr (~5 mo free) | same | same | | 3-day trial on annual only |

**Margin floor check (worst case, 100% ceiling utilization):**
- Plus: 80 × $0.055 = **$4.40 cost vs $3.99** → at absolute max-abuse ≈ −$0.41; but P95 subscription utilization in consumer apps is 25–40% → expected cost **$1.10–1.75 → 56–72% gross margin**. If you want a hard floor, set ceiling 70 (cost $3.85 ≤ price). Tunable in one constant.
- Studio: 200 × $0.065 = **$13 vs $9.99** worst; expected (30%) ≈ $3.90 → **61% margin**. Hard-floor option: ceiling 150 (= $9.75).
- Free: 20 units max = $1.10/mo absolute worst; realistic (~12% util) ≈ **$0.13/mo per free user** — cheap acquisition.
- **Recommendation: ship the generous ceilings (80/200) + a "fair use" clause**, monitor the utilization dashboard for 30 days, then tighten only if P95 > 60%. The handful of max-users are your best word-of-mouth.

### 5.3 Keep top-up packs (important)
Your **only real revenue to date is one-time packs** — zero subscriptions ever converted. Don't delete the thing that sells:
- Over-cap moment ("You've used today's looks") offers **Top-up 10 units — $1.99** or **30 — $4.99** (pure margin, no daily reset).
- This is the industry pattern (Remini, Canva): subs are the floor, consumables the spike.

### 5.4 Migration from the credit system
1. Existing paid credit balances **convert 1:1 to units that never expire** (honor what people bought — trust matters more than the ~$10 total liability).
2. Backend: new `subscriptionTier` + `dailyUnitsUsed`/`monthlyUnitsUsed` counters (reset via existing cron) enforced in `generations.js` *alongside* the legacy credit check for grandfathered balances (spend order: grandfathered credits → daily allowance → top-ups).
3. RevenueCat: new products `plus_monthly_399`, `studio_monthly_999`, `plus_annual_2999`, `studio_annual_7999`, top-ups `units10`, `units30`; new offering; paywall reads the offering (already catalog-driven — no app-store price hardcoding).
4. Paywall UI: **value-first** — "Unlimited daily styling" headline, tier cards showing *looks per day* (not units), price de-emphasized to the trailing chip. Default-select **Plus**. Free tier visible ("what I get now") to anchor.
5. Play Console: create products; keep old credit SKUs live but hidden from the paywall for 60 days (refund safety), then retire.

---

## 6. Component redesign checklist

| Component | Change |
|---|---|
| `AppHeader` | thin, translucent-blur over content, brass wordmark, ionicons |
| `HomePage` → `Lookbook` | shelves + SearchOverlay + For-You reorder (3.2) |
| `StyleDetailSheet` | full BottomSheet redo: hero image, Fraunces title, "Try it on me" CTA, Styles-like-this rail |
| `CameraUpload` | PermissionPrimer before OS dialog; framing guide overlay ("face the light"); replaces raw file input feel |
| `ProcessingState` | branded progress: blurred user photo + shimmer + Fraunces style name + rotating care-facts; no spinners |
| `ResultsViewer` | full-bleed redesign (4.1) + new share cards (4.2) |
| `PricingModal` → `PaywallSheet` | tier cards, looks-per-day language, Plus preselected (5.4) |
| `RewardsCenterModal` | simplify to Referral + daily ad bonus; remove ledger table from the main view (power-user subpage) |
| `OnboardingGuide` | delete (replaced by zero-screen onboarding) |
| Toasts/dialogs | Ionic toasts + action sheets — system-feeling, not web toasts |

---

## 7. Rollout & measurement

- **Phase order:** M1–M2 (2 wks) → M3 (2 wks) → M4 billing (1 wk build + 1 wk internal-track test with real sandbox purchases) → M5 cleanup. Each phase ships as its own vc to the internal track.
- **Guardrail metrics:** install→first-result rate (target >55%), time-to-first-result (<60s median), share rate per result (>15%), D1 retention (>25%), Free→Plus conversion (target 3–5% of MAU), utilization P50/P95 per tier (margin dashboard — the existing analytics events cover most of this; add `units_consumed` event).
- **Risks:** Ionic migration regressions on the camera/purchase flows (mitigate: M3 keeps old flows behind a feature flag until parity); billing migration confusing existing users (mitigate: one-time "your credits are safe" sheet); Play review on changed billing (standard).

---

*Costs, model IDs, and margin data in this plan come from the verified 2026-07 Gemini research (see `memory/gemini-image-models.md`) and live RevenueCat data. Tunable constants: tier ceilings (5.2), top-up prices (5.3).*
