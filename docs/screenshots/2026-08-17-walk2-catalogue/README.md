# Walk 2 — The catalogue: can a person find the style in their head

Date: 2026-08-17 · Build: HEAD (198dfb7, Walk 1 fixes included)
Browser half at 412x915 against the dev server on port 5199. Signed out, no preferences set.
Device half not required for this walk: everything here is web-bundle behaviour.

## Findings, ranked

### 1. SERIOUS — the feed loses your place when you come back from a style

Scrolled four screens into the feed (scrollTop 3200), opened a style, closed it with the
sheet's own control, and landed at scrollTop 991. Roughly two thirds of the scroll is thrown
away. Capture `W2-7-after-close.png`.

Walk 2's own rule calls this serious rather than a paper cut, and it is right to: browsing is
this app's core loop, the whole point of a masonry feed is that you dig, and a reader who is
punished for opening anything learns to stop opening things. It is also the single most
likely reason someone gives up before reaching the photo screen.

Not diagnosed here (walks find, they do not fix), but the shape suggests the feed remounts
and drops back to its first page, so the container shortens and the browser clamps the
scroll position to the new height.

### 2. SERIOUS — a misspelled style name returns nothing

`bantoo knots` returns no results at all. Capture `W2-8-misspelling.png`. Bantu knots are in
the catalogue and are one of the styles this audience searches for by name.

Search is exact-match only, so every near miss is a dead end: a person who is not sure how a
style is spelled, which is most people for most styles, gets the same screen as a person
searching for something that does not exist. Real queries work well (below), so this is
specifically the near-miss case.

### 3. PAPER CUT — the no-results state answers a question the user did not ask

Searching `perm rods` shows "No styles match / Try a different category, or clear the filters
to see everything" with a **Clear filters** button. Capture `W2-9-no-results.png`.

The state is otherwise well made: designed icon, plain sentence, one recovery action. But the
user typed a query, and the copy talks about categories and filters. "Clear filters" does not
obviously clear the text they just typed, which is the thing standing between them and
results. The recovery offered does not match the action taken.

### 4. LOOK — two browse surfaces, two different active-chip styles

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

## Verdict

A person who knows what they want can find it here, and browsing genuinely reads as a
lookbook rather than a database: the masonry is deep, the categories are honest, and typing
the words this audience actually uses returns the right styles. On the two questions Walk 2
asks, it passes the second one well.

Where it falls down is the dig. The feed throws away your scroll position every time you look
at something, which punishes exactly the behaviour a browse app wants, and a single misspelled
letter drops you into a dead end that reads identically to "we do not have this". Those two
findings are the same story from different angles: the app is good at showing you styles and
bad at letting you come back from one.

Three roughest edges: losing scroll position, exact-match-only search, and a no-results screen
that offers to clear filters when the problem is the query.
