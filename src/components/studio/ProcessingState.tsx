// ProcessingState — the ~20 seconds the user spends waiting (M4).
//
// The previous version was a progress dashboard: a spinning conic-gradient ring
// around a circular crop of the photo, a percentage, a progress bar, four step
// dots and an ETA. Six separate widgets all saying "wait". That is software
// telling you it is busy; it does not build any anticipation for the result.
//
// This version is the SAME PLANE the result lands on: the user's own photo,
// full-bleed and defocused, with a slow brass shimmer passing over it. When the
// result arrives it simply comes into focus — no layout jump between screens.
//
// The wait is filled with real textured-hair care notes rather than a
// percentage. They are useful, they are on-brand for who the app is for, and
// they make 20 seconds feel like reading rather than waiting.

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingStateProps {
  selectedPhoto: File;
  selectedHairstyle: { name: string; id: string } | null;
  progress: number;
  onComplete?: () => void;
}

// Genuine care notes, not filler. Written for the catalogue's actual audience.
const CARE_NOTES = [
  'Satin, not cotton — cotton pillowcases pull moisture out of coils overnight.',
  'Box braids sit best for 6–8 weeks. Take them down sooner if your edges feel tight.',
  'Deep condition before a protective style, not after.',
  'Wash-and-go definition comes from applying product to soaking wet hair.',
  'Locs want retwisting about every 4–6 weeks — more often thins the roots.',
  'Detangle from the ends upward. Starting at the root is what causes breakage.',
  'A silk press lasts longer when the hair is fully dry before any heat.',
  'Braids that hurt on day one will not settle. That tension is what takes edges.',
];

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  selectedPhoto,
  selectedHairstyle,
  progress,
  onComplete,
}) => {
  const photoUrl = useMemo(() => URL.createObjectURL(selectedPhoto), [selectedPhoto]);
  const [noteIndex, setNoteIndex] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [countdown, setCountdown] = useState(12);

  useEffect(() => () => URL.revokeObjectURL(photoUrl), [photoUrl]);

  // Rotate care notes. 4.5s is long enough to finish a sentence without
  // re-reading, short enough that a 20s wait shows several.
  useEffect(() => {
    const t = setInterval(() => setNoteIndex((i) => (i + 1) % CARE_NOTES.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (progress >= 99 && !processingComplete) setProcessingComplete(true);
  }, [progress, processingComplete]);

  useEffect(() => {
    if (processingComplete && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (processingComplete && countdown === 0) onComplete?.();
  }, [processingComplete, countdown, onComplete]);

  const visualProgress = Math.min(Math.max(progress, 0), 99);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B0B0B]">
      {/* The user's own photo, defocused. Scaled up so the blur has no soft
          edge at the viewport boundary. */}
      <img
        src={photoUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover"
        style={{ filter: 'blur(24px) brightness(0.78) saturate(1.15)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-black/40" />

      {/* Slow brass sheen. This is the only motion on the screen — it reads as
          something being worked on rather than something loading. */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-2/3"
        style={{
          // Symmetric, gently-ramped stops. A two-stop gradient left a visible
          // vertical seam at the trailing edge.
          background:
            'linear-gradient(100deg, transparent 0%, rgba(185,138,47,0.07) 30%, rgba(255,255,255,0.09) 50%, rgba(185,138,47,0.07) 70%, transparent 100%)',
        }}
        initial={{ x: '-60%' }}
        animate={{ x: '260%' }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="relative flex h-full flex-col items-center justify-end px-7 text-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
          Creating your look
        </p>

        <h1 className="mt-2 font-display text-[28px] italic leading-tight text-white">
          {selectedHairstyle?.name || 'Your hairstyle'}
        </h1>

        {/* Care note — the thing that actually occupies the wait */}
        <div className="mt-7 flex h-16 items-start justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={noteIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45 }}
              className="max-w-[19rem] text-[13px] leading-relaxed text-white/65"
            >
              {CARE_NOTES[noteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* One honest hairline of progress. No percentage — a number invites
            the user to watch it, and it is an estimate anyway. */}
        <div className="mt-2 h-px w-40 overflow-hidden bg-white/15">
          <motion.div
            className="h-full bg-brass"
            initial={{ width: 0 }}
            animate={{ width: `${visualProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <p className="mt-5 text-[11px] text-white/35">Your look is returned if this fails</p>
      </div>
    </div>
  );
};
