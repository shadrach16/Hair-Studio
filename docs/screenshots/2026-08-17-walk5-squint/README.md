# Walk 5 — The paying-customer squint: look, copy and feel

Date: 2026-08-17 · Build: HEAD at `0b02246` (Walks 1–4 fixed) · Device: Samsung SM-N975F,
Android 12. Browser half at 412x915 against the dev server on 5199. Ten cold starts recorded
on the handset with `screenrecord` and analysed frame by frame with ffmpeg.

No functionality was tested. Everything below is about how it looks, reads and feels.

## Findings, ranked by embarrassment

### 1. BLOCKER — the app has THREE brand screens on cold start and shows the worst one

The launch is not one continuous beat. Frame-by-frame over ten cold starts:

| | what is on screen | how long |
|---|---|---|
| 1 | Native splash — **flat `#FAF8F5`, nothing on it**. The monogram does not render on this OEM, as the board records. | ~2.2 s |
| 2 | **`AppLoader`: a pure-white screen** with a navy-and-gold badge, "Hair Studio", "AI Try-On Studio" and a brass progress bar | ~0.2–0.3 s visible here, but see below |
| 3 | The feed | — |

Captures `W5-boot-a-016.png` (the blank paper splash at 1.6 s),
`W5-boot-white-frame.png` (the loader), `W5-boot-c-034.png` (still blank at 3.4 s).

Five things are wrong at once, and they compound:

- **The badge is the retired launcher icon — four European faces** labelled ORIGINAL /
  STYLE CHANGE / COLOR CHANGE / FINAL LOOK. It is the first image the app shows anyone, and
  Walk 6 is about to judge exactly that artwork. It is also fetched from a **remote
  Cloudinary URL at boot**, so on a slow connection the brand moment is an empty circle.
- **It is `bg-white`, not `--surface`.** The one-plane rule holds perfectly through the
  native splash and again on the feed — measured at `rgb(250,247,245)` = `#FAF8F5` on every
  frame — and then this screen breaks it with pure white between them. That is the seam the
  walk says to hunt for, and it is the biggest one in the app.
- **The wordmark is set in `"Fascinate Inline", system-ui`.** Fascinate Inline is one of the
  three faces plan §1.1 explicitly kills, and it is not bundled — so it silently falls back
  to system sans, which is a UI face doing the most editorial job in the product.
- **"AI Try-On Studio"** is the app describing itself as an AI tool at the exact moment the
  north star says it should read as a salon lookbook.
- **It is on a fixed 3-second timer** (`setTimeout(onFinish, 3000)` in `AppLoader.tsx`),
  gated on nothing. `showLoader` starts `true` and only that timer clears it. It is short on
  screen here only because the native splash happens to cover most of it; on a slower start
  it is three seconds of white.

### 2. BLOCKER — the wordmark beat that exists to compensate for the OEM cannot be seen

`index.html` carries a deliberate `#boot` beat: "Hair Studio" in Fraunces 46px, brass, over
`#FAF8F5`, with a brass rule under it. Its comment says exactly why it exists — the Android
12 system splash will not render the animated icon on this handset, so the mark is drawn in
the HTML instead "so the two beats read as one continuous screen".

**It never appears.** Verified two ways rather than by eye:

- I looked at the extracted frames: blank paper.
- Then I scanned **all 165 frames** of a 30 fps capture for any pixel near brass `#B98A2F`
  in the centre band. The first brass pixel in the whole boot arrives at frame 104 (3.47 s),
  and it is the feed's "Everyone" chip. Before that: zero.

The cause is finding 1. `AppLoader` is `fixed inset-0 z-[100]`, so it covers `#boot`, and the
native splash covers both. Three brand beats are stacked and the only one that is designed
is the one nobody sees.

So, to answer the question the walk asks: **the compensation does not convince, because it
is not on screen.** What a real user gets is 2.2 seconds of blank cream, a white flash of
four white faces, then the feed.

### 3. SERIOUS — there is no dark mode, but the boot screen has one

`tailwind.config.ts` sets `darkMode: ["class"]` and **nothing anywhere adds the `dark`
class** — verified by sweeping `src/`. The app is light-only, which is defensible on its own
terms (plan §1.2: "light — default; beauty apps photograph best on light").

But `index.html` *does* respond to `prefers-color-scheme: dark`, painting `html` and `#boot`
in `#141210`. So on a phone set to dark, the launch is: **dark near-black → white AppLoader →
light app.** Two hard inversions before the first screen. Either the app gets a dark theme or
the boot stops pretending it has one; right now it is the worst of both.

Corollary for future walks: `scripts/shot.cjs --dark` sets Playwright's `colorScheme` only,
which the class-based theme ignores, so **every "dark" capture in walks 1–5 is identical to
its light one**. Not a bug in the app; a limitation of the harness that should stop being
described as a dark-mode check.

### 4. SERIOUS — the full-bleed screens never repaint the status bar

`lib/native.ts` exports `setFullBleedStatusBar()` — light icons on `#0B0B0C`, for the Results
and camera screens — with a comment quoting §4.2: "a mismatched status bar over a photo is an
instant webview tell". **It is called from nowhere.** The symbol appears exactly once in
`src/`, at its own definition.

So the result screen keeps a `#FAF8F5` status bar with dark icons directly above a full-bleed
photograph. Not captured on device — the result screen needs a completed generation, and
generation is down — so this is filed from the code with the device check owed.

### 5. SERIOUS — brass marks the upsell, not the action

Measured, not squinted at. The exact computed background of every large button:

| screen | primary | colour |
|---|---|---|
| Photo | Take a photo | `rgb(182,137,47)` — `--brass`, flat |
| Primer | Choose photo | `rgb(182,137,47)` — flat |
| Result | Share your look | `rgb(182,137,47)` — flat |
| Paywall (on sale) | Get Plus | `rgb(182,137,47)` — flat |
| **Confirm** | **Generate** | **`rgb(17,24,39)`** |
| **Confirm, short of looks** | **Get more looks** | **brass *gradient*, `#B98A2F → #8E6A22`** |

Every screen has exactly one primary, so that half of the rule holds. But on the confirm
screen — the screen where the user commits to the thing the app exists to do — **the action
is not brass and the upsell is.** The one moment brass appears there is when you cannot
afford to continue.

`rgb(17,24,39)` is Tailwind's default `gray-900`, a cool blue-black. The design system's
near-black is `--ink` `#1C1917`, deliberately warm. So the app's most important button is
also off-palette. And it is the only flat-vs-gradient inconsistency: four primaries are flat
brass, one is a brass gradient.

Captures `W5-04-confirm.png`, `W5-02-photo.png`, `W5-06-results.png`.

### 6. SERIOUS — the photo screen washes out the face it is selling

`W5-02-photo.png`. The style hero has a white scrim over its lower two-thirds so heavy that
the model's face is erased to near-white — you can see the hairline and the eyes, and then
the picture dissolves. On a screen whose entire job is "here is the style you are about to
put on your head", the scrim removes the evidence. It reads as a broken image rather than a
designed fade.

### 7. PAPER CUT — "Credit back if it fails" on the processing screen

`W5-05-processing.png`. Walks 1–4 converted every money surface to looks and this line
survived, on a screen every single generation shows. It should say the look is returned.

### 8. PAPER CUT — a hard vertical seam across the processing backdrop

`W5-05-processing.png`, at roughly 40% of the width, running the full height: the defocused
photo behind the copy has a visible straight edge where the blurred layer stops. On a screen
built to feel like anticipation, it is the one thing that looks unfinished.

### 9. PAPER CUT — mixed icon sets on the confirm screen

The quality cards use lucide glyphs (image / aperture / gem) while the chrome uses ionicons.
Plan §1.3 says ionicons everywhere and kill lucide. Same screen, two icon languages.

### 10. PAPER CUT — the style name truncates hard at the confirm thumbnail

"Purple-Tinted Freeform Locs" becomes "Purple-Tinted Freef…" at about 20 characters
(`W5-04-confirm.png`), while the same name sets in full two screens earlier on the photo
screen and again in the result caption. The 28-character stress case only fails here.

## What passed, measured rather than assumed

- **No Fraunces below 19px anywhere.** Every `.font-display` element on every reachable
  screen, with its computed size: paywall 19/19/19/26, photo 24/26, primer 24, processing 28,
  result 26. The type rule holds exactly.
- **No horizontal overflow** on any screen at 412px.
- **One primary action per screen**, everywhere (see finding 5 for the treatment).
- **The one-plane rule holds everywhere except the loader.** The native splash, the WebView
  background and the feed all measure `rgb(250,247,245)`, and the status bar is painted the
  same hex through the whole boot. `capacitor.config.ts`, `index.html` and the Android
  resources agree on `#FAF8F5`, and `scripts/gen-splash.cjs` checks it.
- **No white flash between the splash and the WebView** — the failure the `html{background}`
  rule in `index.html` was added to fix. Across ten cold starts, zero frames of white before
  the loader. That fix works; the loader is a separate screen arriving after it.
- **The result screen is the best-looking thing in the app.** Photo owns the screen, controls
  float without fighting it, Fraunces italic caption legible over both the light background
  and the dark shoulder, one brass primary, quiet secondary glyph row.
  `W5-06-results.png`.
- **The empty search state** is designed, plain-spoken and offers one recovery action
  (`W5-08-search-empty.png`) — Walk 2's fix holds.

## Not judged this pass

- **DEVICE-GATED:** the result and camera screens on real hardware, which is where finding 4
  has to be confirmed and where the status bar over a full-bleed photo can actually be seen.
  Both need a completed generation.
- **The squint test on the style sheet** — reachable, but not captured this pass.
- **A card image that fails to load**, and the result screen against a very light and a very
  dark photo. Both need fixtures this walk did not build.

## Look verdict, one line per screen

- **Feed** — the strongest surface in the product; a real lookbook, and it earns the Pinterest
  comparison.
- **Photo** — editorial and calm, ruined in the middle by a scrim that erases the face.
- **Primer** — honest, well-set, one clear action; nothing to fix.
- **Confirm** — clear and legible, but the hierarchy says "buy more" louder than "go", and it
  leaves the bottom 40% of the screen empty.
- **Processing** — genuinely feels like anticipation rather than a progress bar, undercut by
  one seam and one stray word.
- **Result** — would not embarrass the product in a screenshot; the best screen here.
- **Paywall** — reads as a plan chooser rather than a till, which is what §7.4 wanted.
- **Boot** — the worst-looking twenty seconds-per-day in the app, and the only place a
  stranger's face appears.

## The board's question

**Does this look like a product somebody would pay for?** Once it is open, yes — the feed, the
result and the paywall are all at a standard someone would pay for. It is the first three
seconds that say otherwise: a blank cream screen, then a white card of four European faces
under a font the design system deleted. Everything after the launch is a premium app; the
launch belongs to a different one.
