# Hair Studio — Premium Redesign & Billing Restructure Plan

Date: 2026-08-09 · Status: **in progress — M1 shipped (vc40) + follow-ups (card de-noise, zero-screen onboarding)** · Owner: solo founder
References studied: **Retinue** and **Nerve** apps (`Desktop/Retinue/mobile`, `Desktop/Nerve/mobile`) — both built on **@ionic/react 8 + ionicons 7 + Capacitor + Tailwind + framer-motion**, which is the target stack.

---

## 0. Diagnosis — why the app feels "cheap" today

| Symptom | Root cause |
|---|---|
| Feels like a website | Long-press text selection (fixed vc37), browser scroll physics, no native transitions between screens, tap targets from desktop CSS |
| Chrome feels web, not app | Header is a white sticky bar with a **dropdown menu** and a hamburger **drawer sidebar** — desktop-web patterns; credits pill shows a raw coin count; bottom nav is an ad-hoc div, not a native tab bar |
| Visual noise | 3 mismatched fonts (Work Sans + Poppins + decorative "Fascinate Inline"/"Emblema One"), shadcn defaults, gradient-heavy buttons, emoji as icons |
| Style browsing feels like an admin panel | Selection UI is a stack of form controls (search Input + Select dropdown + Tabs + Collapsible filters) over a uniform grid; cards carry coin-price badges, gender-colored badges, and a "can't afford" gray-out — spreadsheet energy, not lookbook energy |
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

## 2. Stack & packaging migration — phase map

Target: **@ionic/react 8 + ionicons 7 + Capacitor (keep 7) + Tailwind + framer-motion** — identical to Retinue/Nerve, so patterns (BottomSheet, ScreenHeader, EmptyState, PermissionPrimer, SearchOverlay) can be ported near-verbatim.

**Staged, not big-bang** (app keeps shipping throughout). Headers/chrome and the hairstyle-selection experience each get their own phase — they are the two surfaces users touch on *every* session:

| Stage | Scope | Risk | Status |
|---|---|---|---|
| **M1** | Foundation: `@ionic/react` + ionicons added, `IonApp` wrapper, tokens + fonts + type scale in Tailwind config, global press-states | Low — visual layer only | ✅ shipped vc40 (+ card de-noise & zero-screen onboarding follow-ups) |
| **M2** | **App chrome & navigation** (section 4): chrome bar + large-title header on the verified Retinue/Nerve pattern, native status-bar sync (one-plane rule), `IonTabs` tab bar (Try On · Looks · Profile), hardware-back handling, kill drawer sidebar + dropdown menu + legacy web header, BottomSheet primitive (replace 7 ad-hoc modals) | Medium | — |
| **M3** | **Hairstyle selection redesign** (section 5): StyleCard, lookbook grid, chip filters + SearchOverlay, StyleDetailSheet v2, consolidate the 3 overlapping browse surfaces into one | Medium | — |
| **M4** | **Generate → Results flow** (section 6): CameraUpload + PermissionPrimer, ConfirmGenerate, branded ProcessingState, full-bleed Results, new share cards | Medium | — |
| **M5** | **Paywall + billing restructure** (section 7) — ships together with backend limits | High — gated behind test track | — |
| **M6** | Cleanup: delete shadcn/lucide/old fonts/dead components; bundle audit | Low | — |

Port from Retinue/Nerve verbatim: `BottomSheet.tsx`, `ScreenHeader.tsx`, `TabScreen.tsx` (Nerve — page scaffold), `EmptyState.tsx`, `FadeIn.tsx`, `PermissionPrimer.tsx` (photo permission priming!), `SearchOverlay.tsx`, and `lib/native.ts` (status-bar sync + hardware-back handling + keyboard wiring — see 4.2/4.3).

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

### 3.3 Progressive onboarding — ✅ shipped
Replaced the 4-screen intro carousel with **zero-screen onboarding**: land directly on the lookbook with a one-line overlay ("Tap any style to see it on you") + coach-mark on first StyleDetail. Every classic onboarding screen costs ~10–20% of first-opens.

---

## 4. App chrome — headers, status bar, tab bar, navigation (M2)

The chrome is the frame around every screen; if it reads "website," nothing inside it can feel premium. Today: `AppHeader.tsx` is a white sticky bar with lucide icons, a coin-count pill, and an avatar **dropdown menu**; mobile nav is a hamburger **drawer** (`Sidebar.tsx`) plus an ad-hoc `MobileBottomNavigation.tsx` div; `Header.tsx` is a legacy web/landing header. All three are desktop-web patterns.

**Verified against the reference source** (`Retinue/mobile/src`, `Nerve/mobile/src`): the reference apps do *not* use a translucent-blur bar. Their trick is flatter and better — **status bar, chrome bar, and page are one continuous plane of `--surface`**: no border, no blur, no title text in the top bar, and the status-bar background is set natively to the exact surface hex. Zero seams from the clock down to the content is what reads "premium native." Adopt it as-is.

### 4.1 Header anatomy (the verified Retinue/Nerve pattern)

Three pieces, composed by a `TabScreen` scaffold (port Nerve's `TabScreen.tsx` verbatim):

| Piece | Spec | Source of truth |
|---|---|---|
| **Chrome bar** | The strip at the very top. Flat `bg-surface` — **no border, no blur, no title text**. Left: brass wordmark (small). Right: quiet 44×44 round icon buttons — search + "looks" chip (4.4) — `active:bg-surface-2` press tint + selection haptic. **This bar alone owns `padding-top: env(safe-area-inset-top)`.** | Retinue `ClientSwitcherHeader.tsx` |
| **Large title** | Pinned below the chrome bar, above the scroll: left-aligned large title + optional one-line subtitle + `trailing` slot. Hair Studio voice: title in **Fraunces display** ("Lookbook") — our one deviation from Retinue's sans title, per the two-typeface system (1.1). Keep the `standalone` prop, which adds the safe-area inset ONLY when no chrome bar sits above — Retinue live-caught a double-padding bug here; the rule is **exactly one element owns the top inset**. | Retinue/Nerve `ScreenHeader.tsx` |
| **Scaffold** | `IonPage` → chrome bar + ScreenHeader fixed, `IonContent` scrolls beneath; optional `IonFooter` pins a primary CTA above the tab bar (hairline top + `bg-surface` so it reads as a bar, not a floating chip). Per-tab `ErrorBoundary` so one broken tab can't take the shell down. | Nerve `TabScreen.tsx` |

Pushed screens (full category grid, profile subpages): same scaffold with a compact back row in the chrome-bar slot — ionicon `chevron-back`, 44px target, no title text — and the screen's name rendered as the large title below. Swipe-back enabled.

Deferred polish: collapsing the large title into the chrome bar on scroll (framer-motion `useScroll`). The references ship **without** it — the pinned large title + seamless status bar already carry the premium feel. Don't build the animation before M4 ships.

### 4.2 Status bar — same plane as the header (the detail that sells it)

Port Retinue's `lib/native.ts` wholesale; its `syncStatusBar(theme)` is the whole trick:

- `StatusBar.setStyle` per theme — dark icons on light surface, light icons on dark.
- **Android: `StatusBar.setBackgroundColor` with the exact surface hex** — `#FAF8F5` light / `#141210` dark (our tokens, 1.2). Status bar and header become the same color = no seam; the app visually extends up behind the clock.
- Call it at boot, on every theme change, **and again on a ~1.6s retry** — Retinue does this deliberately to beat the splash-screen/plugin race; copy it, the bug is real.
- Full-bleed screens (Results, camera): flip to light icons + near-black background on enter, restore the surface pairing on leave — a mismatched status bar over a photo is an instant webview tell.
- Corollary of 4.1: never let a second element also pad for the status bar — the chrome bar owns `env(safe-area-inset-top)`; everything below assumes it's handled.

### 4.3 Kill the web patterns
- **Avatar dropdown menu → Profile tab.** Account, help, rewards, sign-out live on the Profile screen as a grouped list. Dropdowns are a mouse pattern; native apps don't hang menus off the header.
- **Drawer sidebar (`Sidebar.tsx`) → delete.** Three tabs replace it entirely.
- **`Header.tsx` (legacy web header) → delete** with the web landing path (Capacitor builds never show it).
- **Android hardware back**: port Retinue's `registerHardwareBack`/`decideBack` (also in `lib/native.ts`) — open sheet closes first → pushed screen pops → tab root **minimizes the app** (never a blank exit). @ionic/react does not do this by itself; Retinue live-caught hardware back closing the app from any screen.

### 4.4 Credits pill → "looks" chip
The header pill currently shows a coin icon + raw number (credit arithmetic in the chrome, all sessions). Replace with a quiet **"3 looks today"** chip — brass dot, system 13px, tap → PaywallSheet (not PricingModal). Guests see nothing in that slot until try #2 (3.1). After M5 it reads from the daily-units allowance; until then it maps credits → "looks" at the Preview rate.

### 4.5 Tab bar
`IonTabs` with 3 tabs — **Try On** (sparkles icon) · **Looks** (heart) · **Profile** (person) — ionicons outline→filled swap on active, brass active tint, hairline top edge, flat `bg-surface` (the references keep the tab bar opaque too — same one-plane rule as the header), `pb-safe-bottom`. Replaces `MobileBottomNavigation.tsx`. Badge dot on Looks when a new result lands there.

---

## 5. Hairstyle selection — the lookbook grid, cards & detail (M3)

This is the screen users spend the most time on, and today it's three overlapping components with three different card designs: `AfricanHairstyleGrid.tsx` (571-line grid with Input + Select + Tabs + Collapsible filter stack), `StyleDiscoveryHome.tsx` (discovery home), and `MobileHairstyleModal.tsx` (494-line modal). Consolidate to **two surfaces**: the **Lookbook** (browse: shelves + full grid) and the **StyleDetailSheet** (act). `MobileHairstyleModal` is deleted.

### 5.1 StyleCard — one card component, used everywhere
Shelves, grid, and "Styles like this" rail all render the same `StyleCard`:

- **4:5 imagery, full-bleed, rounded-2xl** — the photo *is* the card. Cloudinary `w_400,q_auto,f_auto` thumb, blur-up (LQIP) placeholder, shimmer skeleton while loading.
- **Name only**, bottom-left over a soft scrim — system 14px medium, single line. A lookbook page shows a photo and a name; everything else waits for the detail sheet.
- **De-noise (extends vc41's pass): no coin/price badges, no gender-colored badges, no "Custom" chips on cards.** Price, gender, and tier metadata live in the StyleDetailSheet.
- **No affordability gray-out.** The current `opacity-50 + cursor-not-allowed` treatment punishes browsing. Every card is tappable; styles above the user's tier show a small brass **"Studio"** tag and the detail sheet's CTA becomes the upgrade moment. Locked ≠ ugly.
- **Favorite**: small heart top-right, white outline over the image (no black pill), fills **brass** on tap with a spring pop — not red (red hearts read social-media, brass reads brand).
- Press state: `active:scale-[0.98]`, image `scale-105` on press instead of hover (touch app — hover states are dead code).

### 5.2 Selection model — tap goes straight to the sheet
Kill the current select-then-confirm grid state (`border-brand-500 + shadow-glow-amber` ring, `isSelected` prop). **Tap card → StyleDetailSheet opens.** The sheet *is* the selection; there is no "selected card" left behind on the grid. This removes a whole state machine from the grid and matches how every commerce/lookbook app works. Prefetch the hero image on `touchstart` so the sheet opens full-quality.

### 5.3 The grid & filters
- **Layout**: 2-column uniform 4:5 grid, 12px gutters, generous 20px side margins; category section headers in **Fraunces title (19px)**. Shelves on the home per 3.2; "See all" pushes the full category grid with a ScreenHeader.
- **Filter chrome**: replace the Input + Select dropdown + Tabs + Collapsible stack with **one sticky chip row** (horizontally scrolling category chips, brass fill when active) + the search icon in the root header opening **SearchOverlay**. Length/gender/sort live in a small **Filters bottom sheet** (chip toggles, persisted) — one `options` ionicon at the row's end, with an active-filter count dot.
- **Performance**: virtualize the full 289-style grid (`IonContent` infinite scroll, page size 24) — replaces the current `ScrollArea` + `querySelector('[data-radix-scroll-area-viewport]')` pagination hack. Target: 60fps scroll on a mid-range Android.
- **Empty/error states** via the `EmptyState` primitive ("No braids under chin-length — try Medium") with a one-tap clear-filters action, never a blank grid.

### 5.4 StyleDetailSheet v2 (absorbs MobileHairstyleModal)
Full `BottomSheet` redo, one sheet for every entry point:
- **Hero**: 4:5 image edge-to-edge at the sheet top, drag handle floating over it.
- **Title in Fraunces display** + quiet metadata row (category · length · Preview/Portrait/Studio tier tag) — this is where the de-noised card data reappears, styled as editorial credits, not badges.
- **Primary CTA: "Try it on me"** — the single gradient-allowed button; sticky above the safe area.
- **"Styles like this" rail** (`getSimilarStyles`, currently unused) — horizontal StyleCards; tapping swaps the sheet content with a crossfade (browse without dismissing).
- Secondary: favorite heart, share-style link. No price arithmetic anywhere on the sheet — cost surfaces only at ConfirmGenerate, in "looks" language.

---

## 6. Results & share — "premium enough to post" (M4)

This is where "doesn't feel AI-generated" is won. People post what makes *them* look good.

### 6.1 Result screen redesign
- **Full-bleed photo-first**: result fills the screen edge-to-edge; controls float over it (Retinue's photo-forward pattern). No card-in-a-card.
- **Before/After**: draggable divider slider (native-feeling) instead of side-by-side thumbnails; tap toggles.
- Style name set in **Fraunces** italic over the image bottom ("Goddess Braids — Hair Studio") like a lookbook caption.
- Actions: one primary (**Share**), secondary row (Save · Try another quality · Book-this-look note), all ionicons.
- **Quality language**: "Standard/HD/Pro" → **"Preview / Portrait / Studio"** — camera language, not AI language.
- Auto-enhance pass on display (subtle contrast/warmth via CSS filter) — free perceived quality.

### 6.2 Share cards (replace the current canvas collage)
Three exportable formats, all **emoji-free, editorial, 1080×1920 + 1080×1350**:
1. **Clean** — just the result, tiny brass wordmark bottom-corner (paid tiers: watermark optional).
2. **Editorial** — result on `--surface` mat, style name in Fraunces, thin hairline frame — looks like a salon lookbook page.
3. **Before/After** — vertical split with the divider styled as a brass hairline.
No "AI" badges, no robot language on exports. In-app we stay honest ("AI preview — results are approximations" stays in the app UI); the *export* is the user's photo styled like a magazine, with a tasteful watermark = `Hair Studio · @ShadHairStudio` (Free tier) or optional (paid).
- **4K export** (gemini-3.1-flash-image / 3-pro-image support 2K/4K) = Pro-tier perk: "Studio quality, 4K".

### 6.3 Identity quality (the "still looks like me" trust)
Backend already routes Pro → `gemini-3-pro-image` (best likeness per research). Add to the plan: prompt hardening ("change ONLY the hair; preserve facial features, skin tone, lighting") + show a subtle "Likeness check ✓" line on results that pass the existing output-quality gate — quality theater that is actually true.

---

## 7. Billing restructure — subscriptions with a free tier (M5)

### 7.1 Unit economics + tier→model mapping (verified numbers)
Per-generation all-in cost (image call + ~4 aux Gemini calls @ ~$0.015):

| Quality | Model (decision) | API cost | All-in | Internal units |
|---|---|---|---|---|
| Preview (Standard) | **gemini-3.1-flash-lite-image** — *raise the floor* (was 2.5-flash-image) | ~$0.03–0.05 | **~$0.05** | 1 |
| Portrait (HD) | gemini-3.1-flash-image — optionally at **2K** for crisper braid/loc texture (+$0.034) | $0.067 (1K) / $0.101 (2K) | **~$0.085–0.12** | 2 |
| Studio (Pro) | gemini-3-pro-image — best documented likeness preservation | ~$0.24 | **~$0.26** | 4 |

Worst per-unit cost ≈ **$0.065** (Studio), typical ≈ $0.045–0.055.

**Why not "best model for everyone":** Nano Banana Pro everywhere would cost ~$0.26/gen — a maxed free user ≈ $15/mo, Plus at ceiling ≈ $21 vs $3.99. Instead: **raise the floor** (free tier moves off the oldest model onto the 3.1 generation — the first result a new user ever sees is what converts them), and keep the quality ladder as the upgrade motivation. Quality is also lifted model-independently by the existing input gate → hair mask → output-quality-check pipeline + hardened "change only the hair" prompts.

> **⏳ OPEN — model-floor validation (blocked on Gemini billing top-up):** before M5 locks
> the mapping, run a live side-by-side — same selfie, same textured style (e.g. box
> braids) — across 2.5-flash-image / 3.1-flash-lite / 3.1-flash / 3-pro (~$0.45 total)
> and pick the Preview floor by eye. The 2026-07 research explicitly did NOT validate
> textured-hair realism per model; this test closes that gap. If 3.1-lite disappoints,
> fallback floor is keeping 2.5-flash-image (economics unchanged).

### 7.2 Tiers (daily cap for pacing + monthly ceiling for the margin floor)
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

### 7.3 Keep top-up packs (important)
Your **only real revenue to date is one-time packs** — zero subscriptions ever converted. Don't delete the thing that sells:
- Over-cap moment ("You've used today's looks") offers **Top-up 10 units — $1.99** or **30 — $4.99** (pure margin, no daily reset).
- This is the industry pattern (Remini, Canva): subs are the floor, consumables the spike.

### 7.4 Migration from the credit system
1. Existing paid credit balances **convert 1:1 to units that never expire** (honor what people bought — trust matters more than the ~$10 total liability).
2. Backend: new `subscriptionTier` + `dailyUnitsUsed`/`monthlyUnitsUsed` counters (reset via existing cron) enforced in `generations.js` *alongside* the legacy credit check for grandfathered balances (spend order: grandfathered credits → daily allowance → top-ups).
3. RevenueCat: new products `plus_monthly_399`, `studio_monthly_999`, `plus_annual_2999`, `studio_annual_7999`, top-ups `units10`, `units30`; new offering; paywall reads the offering (already catalog-driven — no app-store price hardcoding).
4. Paywall UI: **value-first** — "Unlimited daily styling" headline, tier cards showing *looks per day* (not units), price de-emphasized to the trailing chip. Default-select **Plus**. Free tier visible ("what I get now") to anchor.
5. Play Console: create products; keep old credit SKUs live but hidden from the paywall for 60 days (refund safety), then retire.

---

## 8. Component redesign checklist

| Component | Phase | Change |
|---|---|---|
| `AppHeader` | M2 | Rebuild as the flat chrome bar (4.1): `bg-surface`, no border/blur, owns the top safe-area inset, brass wordmark + "looks today" chip (4.4); dropdown menu contents move to Profile tab |
| `Header.tsx` (legacy web header) | M2 | Delete — never shown in Capacitor builds |
| `Sidebar` (drawer) | M2 | Delete — replaced by tabs |
| `MobileBottomNavigation` | M2 | Replace with `IonTabs` tab bar (4.5): outline→filled ionicons, brass tint, flat surface + hairline |
| new `ScreenHeader` + `TabScreen` | M2 | Port from Retinue/Nerve: large-title header (Fraunces variant) with `standalone` inset prop + page scaffold (IonPage/IonContent/IonFooter) |
| new `lib/native.ts` | M2 | Port from Retinue: `syncStatusBar` (one-plane status bar, 4.2), `registerHardwareBack`/`decideBack` (4.3), keyboard wiring |
| `AfricanHairstyleGrid` | M3 | Rebuild as the Lookbook grid (5.3): StyleCard, chip-row filters, virtualized scroll; form-control filter stack deleted |
| `StyleDiscoveryHome` | M3 | Becomes the shelves home (3.2) rendering the same `StyleCard`; merges with the grid into one Lookbook surface |
| `MobileHairstyleModal` | M3 | **Delete** — absorbed by StyleDetailSheet v2 (5.4) |
| `StyleDetailSheet` | M3 | v2 redo (5.4): hero image, Fraunces title, "Try it on me" CTA, Styles-like-this rail |
| `CameraUpload` | M4 | PermissionPrimer before OS dialog; framing guide overlay ("face the light"); replaces raw file input feel |
| `ProcessingState` | M4 | Branded progress: blurred user photo + shimmer + Fraunces style name + rotating care-facts; no spinners |
| `ResultsViewer` | M4 | Full-bleed redesign (6.1) + new share cards (6.2) |
| `PricingModal` → `PaywallSheet` | M5 | Tier cards, looks-per-day language, Plus preselected (7.4) |
| `RewardsCenterModal` | M5 | Simplify to Referral + daily ad bonus; remove ledger table from the main view (power-user subpage) |
| `OnboardingGuide` | ✅ done | Deleted (replaced by zero-screen onboarding) |
| Toasts/dialogs | M2–M4 | Ionic toasts + action sheets — system-feeling, not web toasts |

---

## 9. Rollout & measurement

- **Phase order:** ~~M1~~ ✅ (vc40) → **M2 chrome (1 wk) → M3 selection (1 wk)** → M4 results flow (1–2 wks) → M5 billing (1 wk build + 1 wk internal-track test with real sandbox purchases) → M6 cleanup. Each phase ships as its own vc to the internal track.
- **Prerequisite before M5:** top up Gemini prepaid billing (currently **depleted** — generation is down entirely), then run the model-floor comparison (7.1) to lock the tier→model mapping. M2–M4 are pure frontend and are NOT blocked by this.
- **Guardrail metrics:** install→first-result rate (target >55%), time-to-first-result (<60s median), share rate per result (>15%), D1 retention (>25%), Free→Plus conversion (target 3–5% of MAU), utilization P50/P95 per tier (margin dashboard — the existing analytics events cover most of this; add `units_consumed` event). For M3 specifically: styles-browsed-per-session and tap-through rate to StyleDetail (the de-noised cards should raise both).
- **Risks:** Ionic migration regressions on the camera/purchase flows (mitigate: M4 keeps old flows behind a feature flag until parity); billing migration confusing existing users (mitigate: one-time "your credits are safe" sheet); Play review on changed billing (standard).

---

*Costs, model IDs, and margin data in this plan come from the verified 2026-07 Gemini research (see `memory/gemini-image-models.md`) and live RevenueCat data. Tunable constants: tier ceilings (7.2), top-up prices (7.3).*

---

## Appendix — catalogue categorisation (2026-08)

Two passes applied to production (rollback records in the session scratchpad):

**Pass 1 (automated, evidence-backed):** 6 styles whose names showed no textured
signal but a clear non-textured target — five styled updos filed under
Traditional/Protective/Afros → Fashion, and "Deep Wave Lace-Front Bob" from
Weaves → Bob.

**Pass 2 (manual review of the 16 the script refused to guess):** 7 changes,
11 left alone. Moved: Sophisticated Chignon → Fashion; Classic Slicked-Back
Gentleman → Modern; Classic Barbershop Gentleman → Low Cut; Fiery Freckled Crop
→ Modern; Sculpted Short Cut → Low Cut; Copper-Toned Pixie → Low Cut; Woven
Blonde Crown Braid Updo → Fashion. Left alone because they were already correct:
Irun Kiko thread wrapping, natural close crops, temple-line barbershop crop,
ringlet crop, "hair system" (wig) under Weaves, styled-edges ponytail,
finger-wave pixie.

**Structural limit — worth knowing before chasing more of these.** The category
enum describes TECHNIQUE, not audience. "Braids" is a braid whether it is
Fulani braids or a blonde crown braid; "Low Cut" is a buzz cut on any hair type.
So ranking by category can only ever approximate "styles for textured hair" —
e.g. "Platinum Blonde Buzz Cut" legitimately belongs in Low Cut and will keep
surfacing. Fixing that properly needs a separate `hairType` / `audience` field
on the model (e.g. coily / curly / straight), not more category edits.

---

## Appendix — `hairType` (2026-08), which resolves the limit above

`Hairstyle.hairType` (`coily | curly | wavy | straight | any`) now states the
audience directly. Populated by `backend/scripts/classifyHairType.js` — keyword
rules, first match wins, dry-run by default. Final distribution over 289 styles:

| coily | any | straight | curly | wavy |
|---|---|---|---|---|
| 211 (73%) | 32 (11%) | 25 (9%) | 17 (6%) | 4 (1%) |

**Consumers.** `sort=featured` in `routes/hairstyles.js` ranks coily → (curly OR
textured category) → any → straight/wavy. `TEXTURED_MATCH` in
`recommendationService.js` drives the For You and Trending shelves; its category
list is deliberately narrower than `TEXTURED_CATEGORIES` — 'Low Cut' and 'Fades'
are universal, and including them put a platinum buzz cut and a quiff on the
first shelf a new user sees.

**Keys that had to be thrown out** — recorded because they all look reasonable
and are all wrong on this corpus, and the next person will be tempted by them:

- `straight` — 95 of 289 descriptions contain it, nearly all meaning a straight
  RAZOR, straight-BACK cornrows, a straight PARTING, or braids hanging straight
  DOWN. Replaced with phrases that describe hair ("pin-straight", "straight
  texture").
- `relaxed` — overwhelmingly a mood word ("a relaxed, effortless sweep"). It had
  labelled *Nordic Blonde Layers* and *Pensive Blonde Coat Flow* as coily.
- `edges` — every barbering description says "clean edges", meaning the edge of
  the cut, not edge control.
- `natural hair` — also matches "natural hairline", "natural hair color", and
  "the natural hair appears to be straight", which asserts the opposite. Kept,
  but guarded by a blocked-phrase list.
- `blonde` / `platinum` — colour, not texture. They had demoted a mid-fade and a
  set of pink rope braids (whose own description says "protective look").
- `curl` — matches "curled into soft sections" in European updo instructions.
  Matched against the style NAME only now.
- `finger wave` — spans 1920s Hollywood glam and Black hairstyling equally; it
  was putting a European chignon in slot 5 of the feed.

**Verification.** 289 styles cross-checked both directions: 2 coily entries whose
text reads European (finger waves on pressed hair — defensible), and **zero**
Black styles demoted to straight/wavy/any. The second direction is the one that
matters for this app's positioning.

**Known residue.** "Middle Part Bone Straight Install" is a weave worn mostly by
Black women but is honestly `straight` in category and texture, so it ranks last.
Fixing it would mean either lying in the texture field or adding an `isInstall`
flag for ~2 styles; neither is worth it. Left as-is deliberately.


---

## Appendix — M4 as built (2026-08)

**§6.1 Results.** Full-bleed; the result covers the shell. The
before/compare/after segmented control is gone — press and hold peeks at the
original, Compare gives a draggable brass-hairline divider. Style name in
Fraunces italic over the image. One primary Share, quiet secondary glyph row,
rating demoted below the actions. Contextual nudges are mutually exclusive
(guest -> sign-in, low credits -> top-up, Pro -> neither).

**§6.1 Quality language.** Preview / Portrait / Studio, in
`lib/generationTiers.ts` and the backend `MODE_PRICING` labels (which are
user-facing: they appear in the insufficient-credits error and every ledger
line). The ids stay standard/hd/pro — that is the wire format. Four components
that had each re-typed the old names now read from the source of truth.

**§6.2 Share cards.** Shipped earlier (`lib/shareCard.ts`).

**§6.3 Likeness.** `PRESERVATION_BLOCK` gained a NO BEAUTIFICATION rule and an
identity test; PROMPT_VERSION -> v2.1.0. The block already forbade changing
pose/features/lighting but nothing stopped the model RETOUCHING — slimming the
jaw, smoothing skin — which is how a result stops looking like the user while
scoring well on every other dimension. The status endpoint now returns
`identityScore` (the scorer always computed it, it just never left the server)
and the result screen shows "Likeness verified" above 80. **Not yet validated on
real output — generation is down while Gemini billing is depleted.**

**Processing.** Was a progress dashboard: spinning conic ring, percentage,
progress bar, four step dots, ETA — six widgets all saying "wait". Now the same
plane the result lands on: the user's own photo full-bleed and defocused, a slow
brass sheen, Fraunces style name, and rotating textured-hair care notes. One
honest brass hairline instead of a percentage.

**Browser testing.** `src/dev/` adds `?preview=results|confirm|processing` with
fixtures, plus `?guest`, `?pro`, `?credits=N`, `?identity=N`, `?progress=N`. All
three screens were otherwise unreachable in a browser — two need a completed
generation, and generation is down app-wide. The flag is read at module load
because the studio hook rewrites the query string to `?studio_status=discover`
on mount. Confirmed stripped from production builds.

**Still open in M4:** CameraUpload + PermissionPrimer.
