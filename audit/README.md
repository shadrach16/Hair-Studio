# Hair Studio catalogue audit — 2026-08-17/18

Every one of the 289 active, non-custom styles was audited by viewing its
thumbnail image directly (no keyword shortcuts) and scoring two axes:

- **Axis A — visibility/transferability** (PASS/FAIL): is the hair the clear,
  inspectable subject of the image, wearable on a front-facing selfie?
- **Axis B — image ↔ description match** (0–100, weighted: identity 40,
  length/silhouette 20, colour 20, texture 10, accessories 10): the generation
  pipeline never sees the image — `promptFamilies.js` injects only
  `ai_description` — so a description that doesn't match its image delivers a
  different hairstyle than the user picked. **Below 75 fails.** Scores 70–80
  received a deliberate second viewing (noted per row in `audit.jsonl`).

Calibration anchors are in `CALIBRATION.md`. Per-style verdicts with quoted
evidence are in `audit.jsonl` (289 rows). Full removed documents are archived
in `removed-styles-2026-08-18.json` (rollback + re-seed reference).

## Result

**172 KEEP / 117 REMOVE (40.5% removed).**

Removal reasons: 23 Axis A failures (crops, occlusion, wrong subject, no
person, two-person shots, outfit-dominated frames); 94 Axis B mismatches below
75. Score bands of removals: 15 catastrophic (<40, e.g. a streetlight pole, a
record-store shopper for a "man unit"), 32 at 40–59, 40 at 60–69, 26 at 70–74
after re-view, 4 removed on Axis A despite passing scores.

**90 of the 117 removals have `salvageable_image: true`** — good photography
whose text lied. At re-seed, rewrite those descriptions from the images
instead of paying for new imagery.

## Impact table (before → after)

| Category    | Before | After | | hairType | Before | After |
|-------------|-------:|------:|-|----------|-------:|------:|
| Afros       | 22 | 15 | | coily    | 211 | 129 |
| Bob         | 25 | 10 | | any      | 32  | 15  |
| Braids      | 31 | 28 | | straight | 25  | 13  |
| Coils       | 19 | 12 | | curly    | 17  | 12  |
| Fades       | 20 | 16 | | wavy     | 4   | 3   |
| Fashion     | 27 | 12 |
| Locs        | 20 | 11 | Gender: male 130→86, female 159→86.
| Low Cut     | 18 | 13 |
| Modern      | 24 | 14 |
| Protective  | 14 | 6  |
| Relaxed     | 9  | 4  |
| Straight    | 21 | 11 |
| Traditional | 10 | 7  |
| Twists      | 15 | 5  |
| Weaves      | 14 | 8  |

**Coily share of the feed: 73.0% before → 75.0% after.** The removals do NOT
dilute the textured-first positioning — they slightly strengthen it.

Thin categories after removal — **Twists (5), Relaxed (4), Protective (6),
Weaves (8)** — are the top re-seed priorities. Braids (28) barely lost
anything: the newer `6a777...` seed generation, whose descriptions were
authored from the images, passed almost unanimously (typically 90+), while the
oldest generations failed at 50–70%.

## What was found (patterns)

1. **Wrong-style images**: descriptions describing a completely different
   technique than shown (locs labelled afro, braids labelled wash-and-go coils,
   undercut labelled buzz cut). The dominant failure class.
2. **Colour lies/omissions**: "pure natural black" over vivid red; striking
   dyes (platinum, ginger, blue accents) omitted entirely. Colour-only
   omissions with exact structure kept at ~76–85; affirmatively false or
   multi-axis colour claims removed.
3. **Corrupted seeds**: a streetlight pole, a two-person deck stock photo, a
   beach snapshot of a blonde teen labelled "Bold Natural 4C Afro", a woman in
   a record store labelled "Modern Man Unit".
4. **Duplicate images across styles** (flag for dedup — both members pass the
   audit axes unless noted): `6a764ffe`/`6a765065` (pompadour photo),
   `6a765057`/`6a76506f` (platinum pixie), `6a764ff6`/`6a76507b` (profile
   afro/twist-out), `6a764fe2`/`6a764fb8` (denim-jacket crop),
   `6a765075`/`6a76504b` (long dark mane). Several other same-shoot near-dup
   pairs were resolved by the audit itself (the worse-matching member failed).
5. **Celebrity imagery in the `6a777` batch** (passes the audit axes but is a
   rights risk — re-source these images): real photos of Drake (`...cf6c`),
   Zendaya (`...cf6a`), likely Burna Boy (`...cf6f`) and Davido (`...cf70`);
   AI likenesses of Rihanna (`...cf61`, `...cf65`) and Justin Bieber
   (`...cf6e`). One image carries a baked-in social-media caption (`...cf62`).

## Calibration drift check

After completing all 289, the first (calibration) batch was re-checked against
the standards that emerged later: back-of-head shots with readable pattern
keep (matches later keeps at 93–95), colour-only misses keep at ~76–85
(consistent throughout), arrangement/length mismatches remove at ~66–74
(consistent). No calibration verdict required revision; no drift adjustment
was applied.

## How it was applied

- Own backup taken before any write:
  `/var/backups/hairstudio/pre-audit-<date>.archive.gz` (in addition to the
  03:30 nightly).
- Full documents of all 117 removals archived to
  `removed-styles-2026-08-18.json` in this folder (committed).
- `isActive: false` set on the 117 ids (guarded `isCustom: { $ne: true }`).
  Every public query filters `isActive: true`, so they vanish immediately.
  No pm2 reload needed for data changes.
- Hard deletion, if ever wanted, is one command against the archived ids:
  `db.hairstyles.deleteMany({ _id: { $in: <ids> }, isActive: false, isCustom: { $ne: true } })`
  — **not run**, and not recommended until re-seed is done.
- Rollback: `db.hairstyles.updateMany({ _id: { $in: <ids> } }, { $set: { isActive: true } })`
  or restore from the archive file.
