# Walk 3 — The result: does it look like me, and would I post it

Date: 2026-08-17 · Build: HEAD (beec28a, Walks 1 and 2 fixed)
Half A (the shipped screens) run in the browser at 412x915 via the DEV preview routes.
Half B (real generations) is **BILLING-GATED**: Gemini prepaid billing is depleted, so no
try-on can run and the walk's central question cannot be answered this pass.

## Findings, ranked

### 1. SERIOUS — the result screen reports credits as looks, and overstates them

With one credit the nudge reads **"1 left — get more"**. One credit buys zero looks: a Preview
costs two. So the screen tells a user they have something left at the exact moment they have
nothing, and the next tap is a wall.

`ResultsViewer.tsx` prints `${availableCredits} left` beside "Out of looks", so the sentence
mixes two currencies: the noun is looks, the number is credits. The nudge threshold
(`availableCredits < 3`) is in credits too, so it fires at arbitrary points in looks.

This is the last screen the credit-to-looks conversion missed. Every other money surface was
converted earlier today, which is exactly why it stands out now: the app is consistent
everywhere else, so this reads as a bug rather than a convention.

### 2. LOOK — the compare handle clips off-screen at the extremes

Dragged to roughly 6%, the brass divider handle is cut in half by the left edge. Capture
`W3-2-compare-extreme.png`. Nothing breaks, but the grab target is the thing the user is
holding, and letting it leave the screen makes the control feel like it slipped rather than
stopped.

## What passed, and is worth protecting

- **Contextual nudges never stack.** All five states show exactly one or none: guest gets
  sign-in, zero looks and one look get the top-up, five looks gets nothing, and a Pro user at
  zero gets nothing. This is the rule most likely to rot as states multiply, and it holds.
- **The likeness line is exact.** Shown at identity 92 and 80, hidden at 79 and 40. It is a
  real measurement from the output-quality scorer, and it stays absent rather than degrading
  to a lower grade.
- **Compare and peek both work**, including the divider dragged to both extremes and
  press-and-hold to see the original. Captures `W3-2` and `W3-3`.
- **The caption survives the image.** Fraunces italic over the photo stays legible against
  both the light and dark regions of the fixture, and "Likeness verified" sits beside the
  AI-preview disclaimer without crowding it.
- **Processing reads as anticipation**, not a progress meter: the user's own defocused photo,
  one brass hairline, rotating care notes. Captures `W3-4-processing-15.png` and `-85.png`.

## BILLING-GATED, not judged

The half of this walk that matters most cannot run:

- Five real try-ons across a buzz cut, a loc style, a braided install and a silk press, each
  answering: is it still my face, is the hair convincing at the hairline, would I post this.
- How many of five a person would actually share, and what killed the others.
- The v2.1.0 anti-beautification prompt, which has never been validated against real output.
- The failure path end to end. The message logic was proved in isolation (a depleted balance
  and a rate limit now produce different advice, both leading with "You have not been
  charged"), but no real 429 has been observed through the UI, and the credit refund on
  failure has not been watched happen.

## Verdict

On the screens themselves: yes. The result gets the whole screen, the comparison explains
itself without instructions, the likeness claim is earned rather than decorative, and the wait
is filled with something worth reading. Nothing here would embarrass the product in a
screenshot.

Whether a paying user would believe it was worth the money is still unanswered, and no amount
of screen-level polish can answer it. That verdict needs one generation to look at, and today
there are none.
