# Calibration — catalogue audit 2026-08-17

Ten styles viewed before any scoring: Beaded Box Braids (rear portrait), Refined
Shoulder-Length Locs, Clean Military Buzz Cut, Sleek Chin-Length Bob, Vibrant
Pink Braided Install, Low Taper Fade with 360 Waves, Crown Braid Updo, Bohemian
Braided Install, Sculpted Side-Profile Afro, Creative Editorial with Textured
Crown Volume.

**What a 95 looks like:** image and text describe the same head — technique,
length, colour and signature details all verifiably present in a clear photo.
Anchors: *Beaded Box Braids* (a rear portrait whose text says it is a rear
portrait — braid size, clear beads, tapered nape all named and all visible, ~95);
*Military Buzz Cut* (~96); *Vibrant Pink Braided Install* (~95, only docked for
"pink throughout" vs visible dark roots).

**What an 80 looks like:** identity and silhouette exact, one secondary axis
clearly wrong — typically colour. Anchor: *Sleek Chin-Length Bob* claims
"natural black"; the image is an obviously burgundy/mahogany bob (~85). With the
20-point colour weight, a pure colour miss lands at 80–85 and KEEPS; the
generated result is still recognisably the style the user picked, in the wrong
shade.

**What a 60 looks like:** the defining technique or silhouette is wrong or
unverifiable — the generator would deliver a different hairstyle. Anchors:
*Refined Shoulder-Length Locs* — text claims locs "fall naturally past the ears
to the shoulders, styled loose and flowing, freshly retwisted"; image shows
shorter freeform locs styled upward (~69, technique right, silhouette wrong);
*Creative Editorial* — vague "textured crown volume" text over an image whose
actual style is a curly top-knot with shaved undercut (~58: text this vague
generates a different look); *Bohemian Braided Install* — "dark brown/black box
braids" over waist-length silver-gray rope twists (~53). Below that live
outright different-style images (*360 Waves*: flat-top shown, brushed waves
claimed, ~45).

**Axis A anchors:** FAIL for crop (*Crown Braid Updo* — braid ~80% out of
frame), for occlusion+low light+low resolution (*360 Waves* — hand over the
fade, moody dark, source thumbnail ~200px), and for outfit-dominated frames
(*Creative Editorial* — hair ~15% of frame in a denim-jacket fashion shot).
A back-of-head shot PASSES only when the pattern is genuinely inspectable AND
the style is front-wearable (*Beaded Box Braids*: yes on both).

Note discovered during calibration: source thumbnails vary in resolution — some
originals are smaller than 480px (came back ~200px wide). Tiny + dark +
occluded = Axis A fail; tiny alone with readable hair = judge case by case.

Re-score check of this first batch happens after the full pass (drift note at
end of README).
