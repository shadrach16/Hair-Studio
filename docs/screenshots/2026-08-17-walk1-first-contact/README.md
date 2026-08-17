# Walk 1 — First contact: a stranger installs this

Date: 2026-08-17 · Build: HEAD (0e22e13 + working tree) · Device: Samsung SM-N975F, Android 12
Browser half: Playwright chromium 412x915 against `npm run dev` on port 5199.
Device half: debug APK built from HEAD, `adb shell pm clear com.hairstudio.app` before each run.

## What was walked

Personas A (Black woman, London, considering going short), B (man, Atlanta, showing his
barber a fade, permission-shy) and C (never signs in). Feed to style sheet to photo door on
both halves, plus the edge cases the walk names. Generation is down (depleted Gemini
billing) so the value moment under test today is reaching a style you would want on your own
head, per standing rule 3.

## Process note, so nobody re-files it

The first four browser runs landed on a sign-in wall branded **TRAIZA**, with
"Create new account" and "© 2026 Traiza Ltd". It looked exactly like a hard signup wall in
front of the whole app, which would have been the headline blocker of this walk.

It is not Hair Studio. Port 5173 was serving `<title>Traiza - Enterprise Workspace</title>`;
a different project's dev server had taken the port. Hair Studio's own server was not
running. Verified by title, and by grepping this repo for `auth/selection`, which does not
appear anywhere in `src/`. Re-run on port 5199 and the app behaved correctly.

Recorded because it is a plausible false blocker that would waste a day, and because any
future walk that finds a strange brand on 5173 should check the port before believing it.

## Findings, ranked

### 1. BLOCKER — "Take a photo" dead-ends on a fresh install

Tapping the primary action on the photo screen shows a full-screen black overlay reading
"Opening Camera…" and stays there indefinitely. No camera preview, no OS permission dialog,
no error. Captures `D4-after-take-photo.png` (2.5s) and `D5-camera-8s-later.png` (8s later,
identical).

A first-run user cannot get a photo in through the camera at all, which is the app's primary
flow and the only path to its only feature.

Where it lives: `CameraUpload.tsx`. `handleCameraClick` calls `setMode('camera')` *before*
`capturePhoto()`. `capturePhoto()` correctly returns early to raise the PermissionPrimer on
first use, but the primer is rendered only inside the `mode === 'choice'` branch, which
`setMode('camera')` has already left. The primer mounts nowhere, `getPhoto` is never called,
and the camera view sits on its placeholder forever. Introduced with the primer earlier
today; the in-code comment claiming the capture buttons "live only here" is the wrong
assumption.

The library path is unaffected: `handleUploadClick` does not change mode, so its primer shows
correctly (finding 6 below, a pass).

### 2. BLOCKER — hardware back exits the app instead of dismissing the overlay

From the stuck camera screen, the system back button left Hair Studio entirely and put
`com.nerve.app` in the foreground. Capture `D6-back-from-camera.png`; focus confirmed with
`dumpsys window` (`mCurrentFocus=Window{... com.nerve.app/...}`).

Compounds finding 1: the user is in a dead end and the instinctive escape closes the app.
This is the hardware-back issue the board already records as unresolved, now with a concrete
first-run reproduction rather than a general note.

### 3. SERIOUS — the first mention of money is in a currency the app no longer uses

The photo screen carries a sign-up card reading **"🎁 5 free credits when you sign up"**.
Captures `A4-after-cta.png`, `D3-photo-screen.png`.

Two problems in one line. It says "credits" where every other money surface now speaks in
looks, so the first number a new user ever sees is one they have to convert. And it uses an
emoji as an icon, which the design system explicitly kills (plan §1.3). It is also the only
place on the activation path where money appears at all, so it carries more weight than its
size suggests.

Note the *placement* is right and should not change: money appears only after the persona has
chosen a style, never on the first screen.

### 4. WITHDRAWN — the left-edge control is not ours

Filed during the walk as a floating button clipping the "TRYING ON" eyebrow. It is the
Samsung One UI edge-panel handle, a system overlay drawn over every app on this handset.
Confirmed with `document.elementFromPoint` at that coordinate, which returns a PinCard image
and no control, and by the absence of any matching element in `src/`. Left in the report
rather than deleted, because a walk that quietly drops a finding teaches nobody, and the next
walk on this device will see the same handle.

### 5. LOOK — two unlabelled filter rows, both starting with "All"

The feed stacks the audience row (All / Women / Men) directly above the category row (All /
Afros / Bob / …). Neither is labelled and both begin with "All", so a skimming persona reads
"All … All" and cannot tell what the first row is for without tapping it. Capture
`A1-first-screen.png`.

## What passed, and is worth protecting

- **Zero-screen onboarding holds.** No signup wall anywhere on the path. Persona C reached
  the photo screen signed out, with no "sign in to continue" gate. Capture
  `C1-guest-photo-screen.png`.
- **Time to first style visible: 3.79 s** from cold navigation, measured to the first card
  image being visible, not to DOM ready.
- **Nothing about money on the first screen.** Checked by string sweep, not by eye.
- **The feed paginates.** 120 cards loaded after six scroll gestures, no stall or repeat.
- **Audience, standing rule 8.** All six cards visible without scrolling were textured hair
  on Black faces. Capture `A1-first-screen.png`.
- **The library permission primer works exactly as designed** — appears before any OS dialog,
  says plainly that the app receives only the chosen photo and never browses the library,
  and offers "Not now". Capture `D7-library-path.png`. This is the behaviour finding 1 should
  have had.
- **Double-tapping a card** opens one sheet, no duplicate navigation.

## Not covered

- DEVICE-GATED, blocked by finding 1: Persona B's full permission-decline path, and anything
  after a photo is chosen.
- BILLING-GATED: the real generation and its result, per standing rule 3.
- Not reached this pass: airplane mode on the feed and on generate, rotation on feed and
  result, kill-and-relaunch mid-flow, keyboard over the search field. These belong to the
  next Walk 1 pass once finding 1 is fixed, since three of them need a photo in hand.

## Fixes applied after the walk

All findings except the withdrawn one were fixed and re-verified on the device the same
session; captures `FIX1` to `FIX5`.

Finding 2's root cause turned out to be better than the board's note. Hardware back was not
generally broken: `decideBack` matched on `pathname` alone, and the studio keeps its state in
the QUERY STRING, so the photo screen, the confirm screen and the result all report pathname
`/` and were treated as roots to minimise from. It now reads `studio_status`, with the
decision table proved before shipping: `/` and `?studio_status=discover` minimise, `upload`
and `results` navigate back, an open sheet always closes first. Verified live: back from the
photo screen returns to the feed, back from the feed still minimises.

## Verdict

A stranger who installs this from an ad gets a genuinely good first ten seconds. The feed is
fast, it is unmistakably a lookbook rather than a form, nothing asks them to sign in, and
every face on the first screen looks like the audience the app is sold to. On look alone the
opening is the strongest part of the product.

Then they tap the one button the screen is built around and the app stops working. "Take a
photo" leads to a black screen that never resolves, and pressing back closes the app. They do
not reach a result, they do not reach the paywall, and nothing they saw is recoverable on the
next launch because there is nothing to come back to.

So: no, they would not come back tomorrow, and the reason is one bug on one line of ordering
in `handleCameraClick`, not anything about the design. Fix that and this walk's verdict
changes completely, which is the most useful thing it can report.
