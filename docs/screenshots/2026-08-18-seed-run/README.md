# Catalogue Seed Run — 2026-08-18

Batch of 15 new styles, sourced free-to-use, validated by eye, descriptions authored
from the images. This README is the run's summary; per-candidate verdicts and the
full rejection log live in [VALIDATIONS.md](VALIDATIONS.md); the inserted documents
in [seed-data.json](seed-data.json); provenance in `docs/SEED-PROVENANCE.json`.

## Certification

**Every accepted image was viewed in this session: 46 candidates viewed, 15 accepted,
31 rejected (one further download was a corrupt 27-byte file and was never viewed or
evaluated).** 46 = 15 + 31; the numbers add up.

## Sources

All 15 images come from **Pexels** (license permits commercial use, no attribution
required). Unsplash and Pixabay were both attempted and served bot-challenge pages to
every fetch this run; rather than escalate scraping tactics, the run proceeded on
Pexels alone — noted here per the honesty rules.

## Gap table — category × before/after

| Category | Before | Added | After |
|----------|-------:|------:|------:|
| Relaxed | 4 | +1 | 5 |
| Twists | 5 | +3 | 8 |
| Protective | 6 | +1 | 7 |
| Traditional | 7 | +2 | 9 |
| Weaves | 8 | +1 | 9 |
| Bob | 10 | +1 | 11 |
| Locs | 11 | +3 | 14 |
| Straight | 11 | 0 | 11 |
| Coils | 12 | +2 | 14 |
| Fashion | 12 | 0 | 12 |
| Low Cut | 13 | 0 | 13 |
| Modern | 14 | 0 | 14 |
| Afros | 15 | +1 | 16 |
| Fades | 16 | 0 | 16 |
| Braids | 28 | 0 | 28 |
| **Total** | **172** | **+15** | **187** |

## Textured-first constraint

coily+curly share before: **141/172 = 82.0%**. Batch composition: 13 coily + 2 curly
(15/15 textured). Share after: **156/187 = 83.4%** — above the pre-batch level, as
required.

Gender: batch is 10 female / 5 male (86/86 before → 96/91 after). The imbalance
follows the gaps: the thinnest cells (Twists, Relaxed, Traditional, Weaves, Bob
female-curly) are women's categories, while male-heavy cells (Fades, male Braids,
male Afros) were already thick.

## Gaps targeted but NOT filled — honest misses

- **Straight (silk press)**: every straight-hair candidate that passed image quality
  was a centre-part bone-straight install — the catalogue already has two of those,
  so all were rejected as near-duplicates. A silk press with a distinct silhouette
  (side part, wrap, flipped ends) was not findable on Pexels this run.
- **Protective female**: no crown braid / flat-twist / halo-braid image passed
  validation (the survivors were scene-heavy or duplicated existing styles). The
  copper spring twists that did pass is honestly a twist install, so it was
  classified Twists, not Protective.
- **Twists male**: no genuine male two-strand-twist image passed (back-of-head shots
  and near-duplicates only). The male slot went to Protective (box braids + fade)
  instead.

## Field conventions used

Price and popularity are set to the **median of each target category's styles with
popularity > 0**. Plain category medians were not used because two categories
(Weaves, Coils) carry a previous seed batch inserted at popularity 0 — those styles
sank to the bottom of every feed and their price points (3–4) diverge from the
organically-ranked styles. Seeding at popularity 0 would repeat that mistake, so new
styles enter at the mid-pack level of styles users actually see. All 15:
isActive=true, isCustom=false, attributes left at schema defaults (AI extraction
deferred — no Gemini billing this run; extraction can run when billing returns).

## The 15 styles

| Style | Category | G | hairType | Price | Pop | Fills |
|-------|----------|---|----------|------:|----:|-------|
| Natural Mini Twists with Side Sweep | Twists | F | coily | 1 | 54 | Twists F (was 3) |
| Silver Senegalese Twists with Cuffs | Twists | F | coily | 1 | 54 | Twists F |
| Copper Spring Twists Bob | Twists | F | coily | 1 | 54 | Twists F |
| Short Box Braids with Skin Fade | Protective | M | coily | 2 | 55 | Protective M (was 3) |
| Boho Fulani Braids with Amber Beads | Traditional | F | coily | 2 | 38 | Traditional non-Bantu (was 4 Bantu of 7) |
| Threaded Crown Spikes with Low Bun | Traditional | F | coily | 2 | 38 | Traditional threading variant |
| Sleek Relaxed Lob with Center Part | Relaxed | F | coily | 2 | 63 | Relaxed straight look (was 1 of 4) |
| Half-Up High Pony with Loose Curls | Weaves | F | coily | 2 | 49 | Weaves non-duplicate silhouette |
| Honey-Lit Curly Bob | Bob | F | curly | 1 | 60 | Bob female curly (was 0) |
| Bronze-Tipped Short Locs with Fringe | Locs | F | coily | 1 | 58 | Locs short/colour variant |
| Chunky Faux Locs with Thread Wraps | Locs | F | coily | 1 | 58 | Locs faux/install variant (was 0) |
| Loc Top Knot with Cowrie Shells | Locs | M | coily | 1 | 58 | Locs male updo (was 0) |
| Shoulder-Length 3C Ringlet Mane | Coils | M | curly | 1 | 58 | Coils male length variant |
| Even Short Natural Coils | Coils | M | coily | 1 | 58 | Coils male unfaded natural (was 0) |
| Oversized Curly Afro Blowout | Afros | F | coily | 1 | 62 | Afros female XL variant |

Images in [images/](images/) (validation-size copies; Cloudinary holds the
originals). Rejected candidates in [rejected/](rejected/) — reasons in
VALIDATIONS.md.

## Verification

- **Backup**: `/var/backups/hairstudio/pre-seed-20260818-0234.archive.gz` taken on
  the VPS before any write.
- **Count**: active non-custom styles 172 → **187**, exactly +15, checked inside the
  apply script (which also aborts on unexpected pre-count or name collisions).
- **Cloudinary**: all 15 uploaded to `Hairstyles/<slug>` at original resolution
  (e.g. 4471×5590, 4000×6000) — deliberately without the 600×800 crop the older
  seedNewHairstyles* scripts baked in, per the run brief (the app applies its own
  transforms). URLs in `seeded-styles.json` and the ledger.
- **Live API**: featured feed and all 9 seeded category feeds returned 200; all
  15 styles found by name in their category feeds (15/15) and in the featured
  top-200 (15/15).
- **Feed screenshot**: [verify-feed-5199.png](verify-feed-5199.png) — local vite on
  port 5199 (title verified "Hair Studio"), showing seeded style "Sleek Relaxed Lob
  with Center Part" as the second card in the masonry.
- **Apply script**: [apply-seedRun20260818.js](apply-seedRun20260818.js) (as run on
  the VPS; helper files were removed from the VPS after the run).
- **Ledger**: `docs/SEED-PROVENANCE.json` created with all 15 entries
  (sourceUrl, photographer, license, fetchedAt, styleId, cloudinaryUrl).

## Session anomalies (see VALIDATIONS.md for detail)

22 unrequested `u-*.jpg` images plus two manifest files appeared in this staging
folder mid-run through no action of this session. They were documented, never used,
and removed; none was seeded.

## Concurrent-session reconciliation (written by the second session)

Two sessions ran this task simultaneously; the "session anomalies" above were the
other one. Full account and corrections: [stream-b-unsplash/STREAM-B.md](stream-b-unsplash/STREAM-B.md).
The applied batch is stream A's alone; stream B stood down its insert on
discovering production had already moved 172→187, so the +15 invariant held.

Independent post-verification by stream B (same session that writes this):

- All **15/15 inserted images viewed by eye** in the stream-B session — every one
  a real photograph, hair-dominant, unwatermarked, matching its authored name.
  One cosmetic note: Oversized Curly Afro Blowout includes a small script
  name-pendant necklace (jewelry, not a brand mark).
- **4/15 descriptions spot-scored** against their images on the audit rubric
  (identity 40 / length 20 / colour 20 / texture 10 / accessories 10): all ≥95 —
  consistent with stream A's ≥94 self-scores.
- **Ledger integrity**: 15 entries, all Pexels photo pages, unique sourceUrls,
  every entry carrying a 24-hex styleId and a resolving Cloudinary URL.
- **Live API re-check**: 9 endpoints 200; 15/15 styles present across list and
  category feeds; sample thumbnail HTTP 200.
- **Feed screenshot** (independent server run, title verified "Hair Studio"):
  [stream-b-unsplash/verify-feed-5199-streamB.png](stream-b-unsplash/verify-feed-5199-streamB.png)
  — Sleek Relaxed Lob with Center Part live as card 2.

Stream B's 8 eye-validated Unsplash accepts (afros, cornrow installs, twists,
body-wave install, two male barbershop styles) are banked in
[stream-b-unsplash/stream-b-manifest.json](stream-b-unsplash/stream-b-manifest.json)
as raw material for the next run — they cover two of the three gaps this batch
could not fill (Protective female, Protective/Twists male).
