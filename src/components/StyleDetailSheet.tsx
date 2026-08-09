// StyleDetailSheet.tsx — v2 (M3 §5.4). The single "act on a style" surface for
// every entry point: shelves, grid, deep links, similar-styles rail.
//
// Rebuilt on the BottomSheet primitive (IonModal), which brings real
// drag-to-dismiss, snap breakpoints and hardware-back handling that the old
// hand-rolled fixed-overlay could not do.
//
// Deliberate choices:
//  - Photo-first hero, title in the editorial serif, metadata as quiet
//    "editorial credits" rather than badges.
//  - ONE primary CTA ("Try it on me") — the single place a gradient is allowed.
//  - "Styles like this" rail uses getSimilarStyles, an endpoint that already
//    existed but was never wired to any UI. Tapping swaps the sheet contents in
//    place so browsing never costs a dismiss.
//  - NO price arithmetic on this sheet. Cost surfaces at ConfirmGenerate.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { heart, heartOutline, shareOutline } from 'ionicons/icons';
import { apiService, type Hairstyle, type StyleContextNote } from '@/lib/api';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StyleCard } from '@/components/ui/StyleCard';
import { cdnImage, lqip } from '@/lib/img';
import { cn } from '@/lib/utils';

interface StyleDetailSheetProps {
  hairstyle: Hairstyle;
  onTryStyle: (hairstyle: Hairstyle) => void;
  onClose: () => void;
  /** Kept for call-site compatibility; the sheet no longer shows prices. */
  userCredits?: number;
  onBuyCredits?: () => void;
  onShare?: (h: Hairstyle) => void;
}

export const StyleDetailSheet: React.FC<StyleDetailSheetProps> = ({
  hairstyle: initialStyle,
  onTryStyle,
  onClose,
  onShare,
}) => {
  // Local "current style" so the similar-styles rail can swap content without
  // dismissing the sheet.
  const [style, setStyle] = useState<Hairstyle>(initialStyle);
  const [notes, setNotes] = useState<StyleContextNote[]>([]);
  const [similar, setSimilar] = useState<Hairstyle[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => setStyle(initialStyle), [initialStyle]);

  useEffect(() => {
    const id = style._id || style.id;
    if (!id) return;
    setNotes([]);
    setSimilar([]);
    // Reset the blur-up gate, or swapping to another style would show the new
    // hero as already-loaded (and therefore invisible until onLoad fires).
    setHeroLoaded(false);
    apiService.getStyleContextNotes(id).then((res) => {
      if (res.success) setNotes(res.data.notes || []);
    });
    apiService.getSimilarStyles(id, 8).then((res) => {
      if (res.success) setSimilar((res.data as unknown as Hairstyle[]) || []);
    });
  }, [style]);

  const meta = [style.category, (style as any).length, (style as any).culturalOrigin]
    .filter(Boolean)
    .join(' · ');

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      breakpoints={[0, 0.92]}
      initialBreakpoint={0.92}
      className="pb-0"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={style._id || style.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* Hero — the photo is the point. Blur-up: the full-size image takes a
              moment on mobile data, and without a placeholder the sheet opened
              on a large white void. */}
          {/* Height-capped rather than a strict 4:5: at sheet width a true 4:5
              hero is taller than the viewport, pushing the name and the CTA
              below the fold on open. */}
          <div className="relative -mx-5 -mt-4 mb-4 h-[46vh] max-h-[440px] overflow-hidden bg-surface-2">
            <img
              src={lqip(style.thumbnail)}
              alt=""
              aria-hidden="true"
              className={cn(
                'absolute inset-0 h-full w-full scale-110 object-cover transition-opacity duration-300',
                heroLoaded ? 'opacity-0' : 'opacity-100'
              )}
            />
            <img
              src={cdnImage(style.thumbnail, { width: 720 })}
              alt={style.name}
              onLoad={() => setHeroLoaded(true)}
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                heroLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-2 to-transparent" />

            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={() => setIsFavorite((v) => !v)}
                aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-md active:scale-90 transition-transform"
              >
                <IonIcon
                  icon={isFavorite ? heart : heartOutline}
                  style={{ fontSize: 20 }}
                  className={isFavorite ? 'text-brass' : 'text-white'}
                />
              </button>
              {onShare && (
                <button
                  onClick={() => onShare(style)}
                  aria-label="Share this style"
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-md active:scale-90 transition-transform"
                >
                  <IonIcon icon={shareOutline} style={{ fontSize: 20 }} className="text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Title + editorial credits */}
          <h2 id="style-detail-title" className="font-display text-display-sm text-ink leading-tight">
            {style.name}
          </h2>
          {meta && <p className="mt-1 text-caption text-ink-2">{meta}</p>}

          {notes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {notes.slice(0, 3).map((n, i) => (
                <span
                  key={i}
                  className="rounded-full bg-surface px-2.5 py-1 text-caption-sm text-ink-2 ring-1 ring-hairline"
                >
                  {n.text}
                </span>
              ))}
            </div>
          )}

          {/* Styles like this — endpoint existed but was never surfaced */}
          {similar.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-title-sm text-ink">Styles like this</h3>
              <div className="-mx-5 mt-2.5 overflow-x-auto scrollbar-none">
                <div className="flex gap-2.5 px-5" style={{ width: 'max-content' }}>
                  {similar.map((s) => (
                    <div key={s._id || s.id} className="w-[112px] flex-shrink-0">
                      <StyleCard
                        hairstyle={s}
                        width={112}
                        onSelect={() => setStyle(s)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Spacer so content clears the sticky CTA */}
          <div className="h-24" />
        </motion.div>
      </AnimatePresence>

      {/* Sticky primary action — the one gradient in the app */}
      <div className="sticky inset-x-0 bottom-0 -mx-5 border-t border-hairline bg-surface-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          onClick={() => onTryStyle(style)}
          className={cn(
            'h-13 w-full rounded-2xl bg-gradient-brand text-[15px] font-semibold text-white',
            'shadow-sm transition-transform active:scale-[0.98]'
          )}
        >
          Try it on me
        </button>
        <p className="mt-2 text-center text-caption-sm text-ink-3">
          ~20s · your photo stays private
        </p>
      </div>
    </BottomSheet>
  );
};

export default StyleDetailSheet;
