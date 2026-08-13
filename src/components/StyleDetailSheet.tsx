// StyleDetailSheet.tsx — the "closeup" (Pinterest's term for the detail view).
//
// Shape follows Pinterest: one big image, a quiet action row, the title, then
// "More like this" as a MASONRY GRID you scroll into — not a horizontal rail.
// The grid matters: a rail says "here are a few extras", a grid says "keep
// browsing", which is the behaviour that makes people stay.
//
// Tapping a related pin swaps the closeup in place, so browsing never costs a
// dismiss and never deepens a navigation stack.

import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { heart, heartOutline, shareOutline } from 'ionicons/icons';
import { apiService, type Hairstyle, type StyleContextNote } from '@/lib/api';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PinCard } from '@/components/ui/PinCard';
import { cdnImage, lqip } from '@/lib/img';
import { cn } from '@/lib/utils';

interface StyleDetailSheetProps {
  hairstyle: Hairstyle;
  onTryStyle: (hairstyle: Hairstyle) => void;
  onClose: () => void;
  /** Kept for call-site compatibility; the closeup shows no prices. */
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
  const [style, setStyle] = useState<Hairstyle>(initialStyle);
  const [notes, setNotes] = useState<StyleContextNote[]>([]);
  const [similar, setSimilar] = useState<Hairstyle[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setStyle(initialStyle), [initialStyle]);

  useEffect(() => {
    const id = style._id || style.id;
    if (!id) return;
    setNotes([]);
    setSimilar([]);
    setHeroLoaded(false);
    // Swapping to a related pin should start at the top, like a fresh closeup.
    scrollRef.current?.scrollTo({ top: 0 });
    apiService.getStyleContextNotes(id).then((res) => {
      if (res.success) setNotes(res.data.notes || []);
    });
    apiService.getSimilarStyles(id, 12).then((res) => {
      if (res.success) setSimilar((res.data as unknown as Hairstyle[]) || []);
    });
  }, [style]);

  const meta = [style.category, (style as any).culturalOrigin].filter(Boolean).join(' · ');

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      breakpoints={[0, 0.95]}
      initialBreakpoint={0.95}
      className="pb-0"
    >
      <div ref={scrollRef}>
        {/* Hero — big, rounded, the whole point of the screen */}
        <div className="relative -mx-5 -mt-4 mb-3 h-[44vh] max-h-[420px] overflow-hidden bg-surface-2">
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
        </div>

        {/* Quiet action row, Pinterest-style: save + share sit beside the title,
            never on top of the photo. */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-display-sm leading-tight text-ink">{style.name}</h2>
            {meta && <p className="mt-1 text-caption text-ink-2">{meta}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setIsFavorite((v) => !v)}
              aria-label={isFavorite ? 'Remove from saved' : 'Save'}
              className="grid h-11 w-11 place-items-center rounded-full transition-colors active:bg-surface"
            >
              <IonIcon
                icon={isFavorite ? heart : heartOutline}
                style={{ fontSize: 22 }}
                className={isFavorite ? 'text-brass' : 'text-ink-2'}
              />
            </button>
            {onShare && (
              <button
                onClick={() => onShare(style)}
                aria-label="Share this style"
                className="grid h-11 w-11 place-items-center rounded-full text-ink-2 transition-colors active:bg-surface"
              >
                <IonIcon icon={shareOutline} style={{ fontSize: 22 }} />
              </button>
            )}
          </div>
        </div>

        {notes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
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

        {/* More like this — a masonry grid, so the closeup becomes a place to
            keep browsing rather than a dead end. */}
        {similar.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2.5 text-center text-label font-semibold text-ink-2">
              More like this
            </h3>
            <div className="columns-2 gap-2">
              {similar.map((s) => (
                <PinCard
                  key={s._id || s.id}
                  hairstyle={s}
                  width={170}
                  showCaption={false}
                  onSelect={() => setStyle(s)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clears the sticky CTA */}
        <div className="h-24" />
      </div>

      <div className="sticky inset-x-0 bottom-0 -mx-5 border-t border-hairline bg-surface-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          onClick={() => onTryStyle(style)}
          className="h-13 w-full rounded-2xl bg-gradient-brand text-[15px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
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
