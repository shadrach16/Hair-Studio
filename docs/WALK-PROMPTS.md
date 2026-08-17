# Hair Studio — Live Walk Prompts

Six walks that make an AI session test the app the way a person would, plus a readiness
verdict that reads them all. To run one, open a fresh Claude Code session in this repo and
say:

> Read docs/WALK-PROMPTS.md and run Walk N exactly as written.

The handset is needed only for the surfaces that exist nowhere else; standing rule 1b
routes everything else through a phone-sized browser, so a walk runs with or without the
device and says plainly which half it proved.

Each walk produces a screenshots folder and a README of findings. Walks find; they do not
fix. Fixes are their own work afterwards, one commit per fix, so a walk's report stays an
honest record rather than a diary of patches.

---

## Standing rules, for every walk

1. **Setup.** Frontend: `npm run dev` (Vite on 5173). Backend is live on the VPS and the
   app talks to it; you do not need to run it locally, and you must not restart or redeploy
   it. Expect the Samsung SM-N975F (Android 12) at `adb devices`. Never an emulator. The
   unlock PIN is known to the operator and is never typed into any file, commit, or capture.

1b. **The phone only where only the phone proves it.** The app is a web bundle in a
   Capacitor shell, so walk everything you can in a phone-sized browser first: the feed,
   search, the style sheet, the photo screen, the tier picker, the paywall, the copy, the
   empty and error states. The harness is already in the repo:
   `node scripts/shot.cjs <outfile> <url> [--dark] [--wait=ms]`, which drives Playwright
   chromium at 412x915 with safe-area insets simulated. Six screens are otherwise
   unreachable in a browser because they need a completed generation or a native
   permission, so they have DEV-only preview routes, stripped from production builds:

   ```
   ?preview=results     &guest  &pro  &credits=N  &identity=N
   ?preview=confirm     &credits=N  &pro  &guest
   ?preview=processing  &progress=N
   ?preview=photo
   ?preview=primer      &kind=photos
   ?preview=paywall     &tier=plus  &capped
   ```

   Reserve the device for what exists nowhere else: the native splash and cold start, the
   camera and photo-picker permission dialogs, the share sheet, real purchases, hardware
   back, haptics, and the honest look on real hardware (density, fonts, the status bar,
   the keyboard pushing layouts). If the handset is busy or absent, run the browser half
   now and mark every device-only item DEVICE-GATED in the README rather than skipping it
   silently. A walk that never says which half it proved has not finished.

2. **Read the board first.** Read `docs/REDESIGN_PLAN.md` before touching anything,
   including its appendices, which record what shipped and what was deliberately left. Test
   what is marked shipped. A feature belonging to an unshipped milestone is an expected
   absence: note it in one line, do not file it as a defect. A shipped item failing live is
   the headline finding of the walk. When something unbuilt is asked of the app anyway, the
   pass is an honest refusal or absence; the fail is the app pretending.

3. **Known blockers, which are not your findings.** Three things are broken by circumstance
   rather than by code, and filing them as defects wastes the walk:
   - **Generation is down app-wide.** Gemini prepaid billing is depleted, so every real
     try-on fails. The failure path itself is fair game and should be judged hard: the app
     must say the user was not charged and must not advise a retry that cannot succeed.
   - **No subscription products exist yet** in RevenueCat, so tier CTAs read "Coming soon".
     Top-up packs are the live purchase path.
   - **The production database holds no user history.** One user, zero generations, zero
     payments. Anything that renders a history or a saved look will legitimately be empty.

4. **Be the persona, not the developer.** Act only on what the screen shows. You know this
   codebase; the persona does not. Never use code knowledge to find a hidden path, name a
   screen, or explain away confusion. Every moment you hesitate about where to tap next is a
   finding, written down as one, because the real user hesitating has no README.

5. **Judge the look, every time.** Every walk answers two questions: does it work, and does
   it look like something somebody would pay for. The bar for the feed is Pinterest; the bar
   for the chrome is the Retinue and Nerve apps in the Desktop folder. Inconsistent spacing,
   type without hierarchy, controls that do not look pressable, blank empty states, text
   under the status bar, anything that shifts or flashes on load: all findings. Check light
   and dark. Say how it looks in the report, not only that it functions.

6. **Evidence.** Screenshot every state you judge, into
   `docs/screenshots/<date>-walk<N>-<slug>/`, and write a `README.md` there: what was
   walked, findings ranked, captures named inline. Browser captures come from
   `scripts/shot.cjs`; device captures from `adb exec-out screencap -p > file.png`. API
   proofs go through curl against the live backend, read-only, and are quoted in the README.

7. **Findings format.** For each: severity (blocker, serious, paper cut, look), what
   happened in one sentence, what a user would feel in one sentence, the capture name, and
   optionally one line on where in the code it probably lives.

8. **The audience is the product.** This app is aimed at textured-hair wearers in the UK and
   US diaspora. A screen that works but shows a stranger's hair type is a finding, not a
   detail. Walk 6 exists entirely for this, but every walk carries it.

---

## Walk 1. First contact: a stranger installs this

You are a person who just installed this from an ad, not an engineer. Clear the app's data
first (`com.hairstudio.app`) so this is a true first run, and do the same before each
persona.

**Persona A**: a Black woman in London, 27, has worn box braids for years and is deciding
whether to go short. Impatient, skims, will not read a paragraph on a screen.
**Persona B**: a man in Atlanta, 33, wants to show his barber a fade before he sits down.
Suspicious of permissions, grants nothing he does not have to.
**Persona C**: signed out entirely, never creates an account, tries to get to a result
anyway.

For each run, record:

- Time from app open to the moment of value, and what that moment actually is. Generation
  is down, so the honest value moment today is seeing a style on the feed that they want on
  their own head. Say whether the app delivers that, and how fast.
- Every hesitation: any screen where the next tap was not obvious within about three
  seconds, with a capture. This is the walk's main product.
- Whether the first screen makes it clear what this app does, before any tap.
- Whether the permission primer arrives before the OS dialog, says plainly what happens to
  the photo, and whether declining leaves a working app rather than a dead end.
- Where the app first mentions money, and whether that arrives before or after the persona
  has seen anything worth paying for.

**Edge cases, all of them run:** the system back button on every screen, including from the
photo screen and the full-bleed result (where does it land, is anything lost); kill the app
mid-flow and relaunch (does it resume or restart); airplane mode on the feed and again on
the generate tap (is the failure designed and honest, or a spinner); a first tap straight
onto a style before any photo exists; the same style tapped twice quickly; rotating the
device on the feed and on the result; the keyboard covering the search field it belongs to.

Verdict paragraph: would a stranger who installed this from an ad reach something they
wanted without help, and would they open it again tomorrow. Answer plainly.

---

## Walk 2. The catalogue: can a person find the style in their head

This is the app's core loop and the surface every session touches, so it gets its own walk.
Start on the feed, signed out, with no preferences set.

1. **The open.** What is on the first screen without scrolling, and is it obviously
   browsable rather than a form? Scroll ten screens. The masonry must keep loading; note
   the moment it stops, stalls, or repeats a style you have already passed.
2. **Filter by category.** Every chip in the row, one at a time. Each must change the feed,
   keep the chip row reachable, and never strand you with an empty grid and no way back.
3. **The audience filter.** Switch All, Women, Men. Confirm the feed genuinely changes,
   that the choice survives a relaunch, and that nothing about it reads like a demand for
   personal information.
4. **Search.** Search for things a real person types: "box braids", "knotless", "fade",
   "short cut", "colour", a misspelling ("bantoo knots"), a style the catalogue does not
   have ("perm rods"), and an empty query. Judge the empty state and the misspelling most
   harshly; those are where a browse app loses people.
5. **The style sheet.** Open a style. Is the image big enough to judge the hair, is the
   name readable, is the next action obvious, and do the recommendations below it actually
   look like the style you opened rather than a random shelf?
6. **The long scroll back.** After ten screens of feed and a style sheet, go back. Does the
   feed hold its position, or dump you at the top? Losing scroll position on a browse app
   is a serious finding, not a paper cut.

**Edge cases, all of them run:** a style whose name runs to twenty-eight characters or more;
tapping a card while its image is still loading; the feed with the device offline from cold;
the feed after the backend returns an error (block the API host in the browser and watch);
double-tapping a card; opening and closing the style sheet ten times in a row; the chip row
scrolled to its end and then a category selected.

Verdict paragraph: could a person who knows what they want find it here in under a minute,
and does browsing feel like a lookbook or like a database. Name the three roughest edges.

---

## Walk 3. The result: does it look like me, and would I post it

This walk judges the payoff. Generation is down, so it runs in two halves and you must say
which half produced each finding.

**Half A, the shipped screens, browser.** Use `?preview=results` and its flags. Judge:

- The full-bleed result: does the photo own the screen, do the controls float without
  fighting it, is the style name legible over a light image and over a dark one?
- Hold to peek at the original, and Compare with the divider dragged to both extremes and
  to the middle. Does the interaction explain itself without the hint, and does the hint
  appear once and stay gone?
- The likeness line at `&identity=92` and `&identity=40`. It must appear only when earned
  and must never degrade into a lower grade.
- The contextual nudges: `&guest`, `&credits=0`, `&credits=1`, `&pro`. Exactly one may show
  at a time, and each must read like a next step rather than a demand.
- The processing screen at several `&progress=` values. Does the wait feel like anticipation
  or like a loading bar with better clothes? Read the care notes as a person with 4C hair
  would read them: are they true, useful, and free of the tone of a brand pretending to
  know you?

**Half B, the real generation, device, when billing is restored.** Run at least five real
try-ons across different hair types, including one buzz cut, one loc style, one braided
install, and one silk press. For each, answer in one sentence each: is it still my face, is
the hair convincing at the hairline, and would I post this. Then the honest one: how many of
the five would a person actually share, and what killed the others.

**The failure path, runnable today and required.** Tap generate with billing depleted.
Confirm the message says the user was not charged, does not promise a retry that cannot
succeed, and that the credit balance is genuinely unchanged afterwards. A message that
sends the user into a retry loop is a blocker.

Verdict: for each result you saw, would a paying user believe this was worth what it cost,
yes or no, with the one detail that decided it.

---

## Walk 4. Money: the paywall, the packs, and telling the truth

Open the paywall from every entry it has: the header chip, the low-balance nudge on the
result, and the shortfall state on the confirm screen. Then judge it as someone deciding
whether to spend.

1. **The tiers.** Does the sheet lead with what you get rather than what it costs? Read the
   three cards aloud. Is the difference between Preview, Portrait and Studio clear enough to
   choose from, without knowing anything about models or resolutions?
2. **The anchoring.** Free is shown as the current plan. Does that help you understand what
   you have, or does it read as an upsell dressed as information?
3. **Coming soon.** The subscription products do not exist yet, so those CTAs are inert.
   Judge how that reads to a person who wants to pay you right now. A dead primary button
   with no explanation is a serious finding; an honest one is a pass.
4. **The packs.** Buy a top-up pack on the device. This is the only live purchase path, so
   walk it fully: the sheet, the Play dialog, the return to the app, and whether the balance
   updates without a manual refresh.
5. **Restore purchases.** Run it on an account with a past pack purchase. It must recover
   the credits, say how many, and be safe to run twice with no double grant. Given the
   database lost its user history, this is the recovery path for every past customer, so
   test it like it matters.
6. **The language.** The app should no longer ask anyone to convert credits into looks.
   Sweep every money surface for a stray "credit", a coin glyph, or a number the user has to
   divide. Two mentions are deliberate and correct: "no credits to track" on the paywall,
   and the promise that existing credits never expire.

**Edge cases:** the paywall opened while offline; a purchase cancelled at the Play dialog; a
purchase completed with the app backgrounded mid-flow; the paywall at exactly zero balance
and at one look remaining; tapping the primary button twice fast.

Verdict: which paths took money end to end, which refused honestly, which pretended. Any
pretending is the headline.

---

## Walk 5. The paying-customer squint: look, copy and feel

No functionality in this walk. Walk every screen the app has, in light and dark, and judge
it against Pinterest for the browse surfaces and against Retinue and Nerve for the chrome,
with captures for everything you call out.

- **The one-plane rule.** Status bar, chrome bar and page share one surface colour, and
  exactly one element owns the top safe-area inset. Hunt for the seam: any hairline of a
  different white at the top of any screen is a finding. Cold-start the app on the device
  and watch the first second frame by frame if you have to.
- **Typography.** Fraunces is the voice and system-ui is the chrome, and the split should be
  legible without knowing the rule. Find every place a display serif is doing a UI job or a
  UI sans is doing an editorial job. Check that no Fraunces string falls below 19px.
- **Layout.** Spacing consistent, alignment on a grid, type with clear hierarchy, touch
  targets that look pressable, nothing under the status bar, nothing that shifts or flashes
  on load. The feed's masonry must interlock without a visible gutter mismatch between the
  two columns.
- **Brass discipline.** Brass is the accent and there should be exactly one primary action
  per screen wearing it. Find every screen with two, and every screen with none where one
  is needed.
- **States.** Every empty state designed (no search results, no saved looks, a filtered feed
  with nothing in it); every loading state deliberate (the feed's first paint, a card's
  image, the result's blur-up); every error state written for a human. A raw exception
  string or a bare spinner anywhere is a finding.
- **Stress the surfaces.** A style name of twenty-eight characters or more in a card, in the
  sheet, and in the result caption. A card image that fails to load. The result screen with
  a very light photo and again with a very dark one, checking the caption and the floating
  controls survive both.
- **Copy audit.** Read every visible string aloud: plain words, no marketing fluff, no
  internal vocabulary reaching a user ("units", "entitlement", "standard/hd/pro", "credits"
  outside the two deliberate mentions), and nothing that promises what the app cannot
  currently do.
- **The squint test per screen.** Blur your eyes at the feed, a style sheet, the photo
  screen, the confirm screen, the result, the paywall: does the important thing pull the eye
  first? Name what pulls instead when it does not.
- **The splash and the boot.** On the device, cold start ten times. The launch must not
  flash white at any point, and the brand beat must read as one continuous screen into the
  app rather than two different screens. Record what the native splash actually shows on
  this handset; the monogram is known not to render on this OEM and the wordmark beat in the
  web layer is the compensation, so judge whether that compensation is convincing.

Deliverable: a look verdict per screen in one sentence each, a ranked top-ten fix list by
embarrassment, and captures for all ten. End with the one-line answer to the board's
question: does this look like a product somebody would pay for.

---

## Walk 6. The audience audit: is this app for the people it says it is for

This walk is unique to Hair Studio and it may be the most valuable one here. The product is
positioned for textured hair, the catalogue was reclassified for it, and the ranking was
rebuilt around it. This walk checks whether a person from that audience would believe it.

You are a Black woman with 4C hair who has been burned by beauty apps that show her
European styles and call it inclusive. You are not hostile; you are tired.

1. **The first screen, counted.** Open the feed cold, signed out, and count the first
   twenty-four cards. How many show hair like yours? How many show a white face? Write the
   numbers down before you interpret them. Repeat with the audience filter on Women and on
   Men.
2. **Every category.** Walk each chip and do the same count for the first twelve cards. Name
   any category that collapses into styles for a different hair type, and any that is empty
   or nearly so.
3. **The names.** Read fifty style names. Do they use the vocabulary the audience actually
   uses (knotless, stitch, feed-in, wash-and-go, silk press, retwist), or a generic beauty
   vocabulary that could describe anything?
4. **The descriptions.** Open ten style sheets and read the text. Anything that describes a
   protective style without knowing how it is worn, gets maintenance wrong, or reads as
   written by someone who has never had this hair is a finding, quoted.
5. **The recommendations.** From a loc style, a braided install, and a buzz cut, judge the
   "more like this" shelf. Does it understand that these are different jobs, or does it
   drift back to whatever is globally popular?
6. **The app's own voice.** The care notes on the processing screen, the framing tip on the
   photo screen, the paywall copy. Would this audience read these as written for them, or as
   written about them?
7. **The icon and the store.** The launcher icon still shows four European faces on a
   navy-and-gold badge. Judge it as the first thing this audience sees in the Play Store,
   before anything else in this walk.

Deliverable: the counts as a table, every quoted string that misses, and one honest
paragraph: would this person trust the app enough to put her own face into it, and what is
the single thing that would most change that answer.

---

## Readiness verdict

Runs last, after the six walks have filed their READMEs in `docs/screenshots/`. Read all
six, read the board's current state, and write the one page the owner actually needs:
`docs/READINESS.md`.

It contains: the verdict, READY or NOT READY, for putting this in front of paid traffic; the
blockers ranked, each with its source walk and capture; the paper cuts worth batching into
one fix pass; the DEVICE-GATED list that must be walked when the handset frees up, so
nothing silently ships unproven; the BILLING-GATED list that cannot be judged until Gemini
is topped up; and the three numbers that matter (time to the value moment from Walk 1, the
audience counts from Walk 6, and how many of five real results a person would actually post
from Walk 3).

No hedging in the verdict. If it is NOT READY, the first line says so and the second line
says the shortest path to READY. If Walk 6 found that the first twenty-four cards do not
look like the audience the app is sold to, that is a blocker rather than a paper cut,
because it is the whole positioning and no amount of polish elsewhere survives it.
