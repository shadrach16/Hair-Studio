# Stream B — the second session's account

Two Claude sessions were accidentally launched on the same seed task in this
repo at the same time. This folder is the record of the second one ("stream
B"), written by that session after the collision was discovered. Stream A's
batch is the one that shipped; nothing in this folder was inserted anywhere.

## What actually happened (timeline, local times)

- ~00:55–01:22 — Stream B ran its gap scan (identical conclusions to stream
  A's), probed Unsplash via the public `napi` JSON endpoint (which worked from
  this session, contrary to stream A's experience), probed Pexels (Cloudflare-
  challenged from this session — very likely because BOTH sessions were driving
  Pexels from one IP), downloaded 22 Unsplash candidates into the shared
  staging folder, and validated all 22 by eye: **8 accepted, 14 rejected**
  (verdicts in `stream-b-manifest.json`).
- 01:23–01:28 — Stream A staged its complete Pexels-only run into the same
  folder. From each side, the other's files "appeared from nowhere".
- 01:28 — Stream A's evidence commit (93f63c3) — which, unknowingly,
  **included stream B's 22 candidate images**.
- 01:30–01:48 — Stream A, unable to verify files it had not fetched, treated
  them as unverifiable-provenance artifacts, removed them (967181f), removed
  stream B's two manifests (4a12e5a), applied its batch to production
  (0518744: 172→187), and finally identified stream B's two helper scripts as
  the "producers", deleting them (6541c84) while correctly concluding "a
  parallel process wrote into the staging folder".
- 01:35 onward — Stream B discovered the collision, confirmed production had
  received exactly ONE batch, **stood down its own insert** to protect the
  +15 invariant, and switched to independently verifying stream A's applied
  batch (see the reconciliation section of the run README).

## Corrections to the record

- The 22 `u-*.jpg` files removed in 967181f were not harness artifacts or an
  intrusion: they were genuine, eye-validated Unsplash candidates fetched by
  this session (metadata reconstructed in `stream-b-manifest.json`; the images
  themselves restored from commit 93f63c3 into `candidates/`).
- The two scripts removed in 6541c84 were this session's tools, restored under
  `tools/` from the session transcript. Stream A's inference chain was sound
  given what it could see; its conclusion just lacked the fact that the
  parallel process was its twin.

## Stream B certification

In the stream B session: **22 candidates viewed, 8 accepted, 14 rejected;
22 = 8 + 14.** None were uploaded to Cloudinary, none inserted, none added to
the ledger. The 8 accepts are pre-validated raw material for a FUTURE seed run
(Unsplash License at fetch time; re-confirm license/premium state when that
run fetches them). They lean female/coily (afros, cornrow installs, twists,
body-wave install) plus two male barbershop styles — complementary to the gaps
stream A could not fill from Pexels (its README names Straight/silk-press,
Protective-female, Twists-male as honest misses; stream B's accepts cover
Protective-female and Protective-male directly).

## Lesson for future runs

Before starting a seed run, check for evidence of a concurrent run in
progress: fresh files in `docs/screenshots/<date>-seed-run/`, a fresh
`pre-seed-*` backup on the server, or an active-count that moved since the
gap scan. A one-line lock file in the run folder at run start (with session
id and start time) would have surfaced this collision in seconds.
