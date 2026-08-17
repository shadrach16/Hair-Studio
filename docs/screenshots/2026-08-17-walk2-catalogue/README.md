# Walk 2 — The catalogue: can a person find the style in their head

Date: 2026-08-17 · Build: HEAD (198dfb7, Walk 1 fixes included)
Browser half at 412x915 against the dev server on port 5199. Signed out, no preferences set.
Device half not required for this walk: everything here is web-bundle behaviour.

## Findings, ranked

### 1. WITHDRAWN — the feed does NOT lose your place

Filed as serious: scrolled to 3200, opened a style, came back at 991. It is a harness
artifact, not app behaviour. Playwright's `click()` scrolls an offscreen target into view
before clicking it, and the card being clicked (`nth(8)`) sits far above the fold at that
scroll position — so the test itself moved the feed to 991 and then measured 991.

Retested the way a thumb actually works, by locating a card fully inside the viewport and
dispatching a tap at its coordinates: before 3200, during 3200, after 3200. Position kept.

Recorded rather than deleted because the wrong version cost real work: a scroll pin-and-
restore was written against Ionic's modal, iterated three times, and reverted once the cause
was understood. The lesson is specific and reusable — when a walk measures interaction, click
by coordinate inside the viewport, never by locator, or the harness will scroll for you.

### 2. FIXED — a misspelled style name returned nothing

`bantoo knots` returns no results at all. Capture `W2-8-misspelling.png`. Bantu knots are in
the catalogue and are one of the styles this audience searches for by name.

Search is exact-match only, so every near miss is a dead end: a person who is not sure how a
style is spelled, which is most people for most styles, gets the same screen as a person
searching for something that does not exist. Real queries work well (below), so this is
specifically the near-miss case.

### 3. FIXED — the no-results state answered a question the user did not ask

Searching `perm rods` shows "No styles match / Try a different category, or clear the filters
to see everything" with a **Clear filters** button. Capture `W2-9-no-results.png`.

The state is otherwise well made: designed icon, plain sentence, one recovery action. But the
user typed a query, and the copy talks about categories and filters. "Clear filters" does not
obviously clear the text they just typed, which is the thing standing between them and
results. The recovery offered does not match the action taken.

### 4. FIXED — two browse surfaces, two different active-chip styles

The feed marks the selected category with a dark fill; the search sheet marks it with a brass
fill. Compare `W2-2-category.png` with `W2-9-no-results.png`. Same control, same job, two
visual languages, one screen apart.

## What passed, and is worth protecting

- **The feed paginates properly and deeply.** 270 of the 289 styles reachable across 9
  pages, no duplicates and no stall. Capture `W2-1-scroll-limit.png`.
- **Every category returns what the API says it should.** All 15 chips sweep clean; spot
  checks match exactly (Afros 22, Straight 21, Braids 30 against the same numbers from
  `/api/hairstyles?category=`).
- **Real search is good.** `box braids` 39, `knotless` 32, `fade` 54 — the vocabulary this
  audience actually types, returning sensible volumes.
- **Filter feedback is immediate**, following the fix earlier today: 16 skeleton cards 180 ms
  after a tap, cleared when results land, built on PinCard's own aspect ratios so the grid
  does not jump.
- **The empty state is designed**, with an icon, a plain sentence and a recovery action. Only
  its wording is wrong (finding 3), not its existence.

## Two corrections, recorded so they are not re-filed

Both were my measurement, not the app. A walk that hides its own false starts is worth less
than one that shows them.

- **"The feed stalls after 60 cards."** My first pass scrolled in 900px steps, which did not
  reliably reach the sentinel, so eight of ten scrolls added nothing and it looked like a hard
  stop. Scrolling to the container bottom instead reached 270 cards across 9 pages.
- **"Afros and Straight return zero styles."** My category sweep sampled at a fixed 2.6s while
  clicking chips in sequence. Re-tested in isolation, both render correctly and immediately:
  Afros 22, Straight 21, no skeletons left on screen, matching the API. Nothing was wrong.

## Fixes applied after the walk

- **Fuzzy search.** The catalogue is 289 styles, small enough to scan in memory, so when an
  exact search returns nothing the backend now falls back to token-level edit distance
  against the name: 1 edit for short words, 2 for longer, and every query token must match so
  "fade" cannot drag in half the catalogue. Only on page one, only on an empty result, so the
  normal path pays nothing. `bantoo knots` now returns **Elegant Bantu Knots**; `perm rods`
  still correctly returns nothing, because the catalogue genuinely has none. The response
  carries a `fuzzy` flag and the sheet says "No exact match for X. Showing the closest
  styles" rather than passing approximate results off as exact. Capture `FIX-fuzzy.png`.
  The fallback drops only the search clause, not the whole `$and`, so a fuzzy match cannot
  escape the gender filter and return men's styles to someone who asked for women's.
- **Empty state.** Now answers what the user did: "No styles like *perm rods*", "Check the
  spelling, or try a shorter word", and the button reads **Clear search**. Capture
  `FIX-empty-state.png`.
- **Chips.** The search sheet's active chip now uses the feed's dark fill. Brass is reserved
  for the one primary action per screen, and a selected filter is not it.

## Verdict

A person who knows what they want can find it here, and browsing genuinely reads as a
lookbook rather than a database: the masonry is deep, the categories are honest, and typing
the words this audience actually uses returns the right styles. On the two questions Walk 2
asks, it passes the second one well.

Where it fell down was the near miss: a single misspelled letter dropped you into a dead end
that read identically to "we do not stock this", which for a catalogue of styles most people
cannot spell is a common and expensive way to lose someone. That is now spelling-tolerant, and
honest about it when it guesses.

The roughest edge was exact-match-only search, and it is fixed. Scroll retention, the finding
that looked worst, turned out to be the harness rather than the app.
