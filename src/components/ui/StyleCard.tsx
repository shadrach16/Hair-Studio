// StyleCard.tsx — THE hairstyle card. One component for shelves, the full grid
// and the "styles like this" rail (M3 §5.1).
//
// Replaces three different card designs that existed across
// AfricanHairstyleGrid / StyleDiscoveryHome / MobileHairstyleModal.
//
// Deliberate choices:
//  - The photo IS the card. Name only, over a soft scrim. Price, gender and
//    tier metadata live in the detail sheet — a lookbook page shows a picture
//    and a name.
//  - NO affordability gray-out. The old `opacity-50 + cursor-not-allowed`
//    punished browsing; every card is tappable and styles above the user's tier
//    get a quiet brass tag instead. Locked should never mean ugly.
//  - Favourite fills BRASS, not red — red hearts read social-media, brass reads
//    brand.
//  - Press (not hover) states: this is a touch app, hover is dead code.

import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { cardThumb, lqip } from '@/lib/img';
import { cn } from '@/lib/utils';

export interface StyleCardProps {
  hairstyle: {
    _id?: string;
    id?: string;
    name: string;
    thumbnail?: string;
    isNew?: boolean;
  };
  onSelect: () => void;
  /** Quiet brass tag for styles above the user's current tier. */
  tierTag?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  /** Rendered width in CSS px — used to size the CDN request. */
  width?: number;
  className?: string;
}

export const StyleCard: React.FC<StyleCardProps> = ({
  hairstyle,
  onSelect,
  tierTag,
  isFavorite,
  onToggleFavorite,
  width = 200,
  className,
}) => {
  const [loaded, setLoaded] = useState(false);
  const placeholder = lqip(hairstyle.thumbnail);

  return (
    <button
      type="button"
      onClick={onSelect}
      // Prefetch the full-size hero so the detail sheet opens sharp.
      onTouchStart={() => {
        if (hairstyle.thumbnail) new Image().src = cardThumb(hairstyle.thumbnail, 400);
      }}
      className={cn('group block text-left active:scale-[0.98] transition-transform', className)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-2">
        {/* Blur-up placeholder — avoids the grey-box flash while the real
            image streams in. */}
        {placeholder && (
          <img
            src={placeholder}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 h-full w-full object-cover scale-110 transition-opacity duration-300',
              loaded ? 'opacity-0' : 'opacity-100'
            )}
          />
        )}
        {!loaded && <div className="absolute inset-0 animate-pulse bg-hairline/40" />}

        <img
          src={cardThumb(hairstyle.thumbnail, width)}
          alt={hairstyle.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-all duration-500',
            'group-active:scale-105',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Scrim only where the name sits, so the photo stays the hero. */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

        {hairstyle.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-ink">
            New
          </span>
        )}

        {tierTag && (
          <span className="absolute right-2 top-2 rounded-full bg-brass/90 px-2 py-0.5 text-micro font-semibold text-white">
            {tierTag}
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center active:scale-90 transition-transform"
          >
            <IonIcon
              icon={isFavorite ? heart : heartOutline}
              style={{ fontSize: 20 }}
              className={isFavorite ? 'text-brass' : 'text-white drop-shadow'}
            />
          </button>
        )}

        {/* `truncate` (not line-clamp): guaranteed single line with an ellipsis
            in core Tailwind. line-clamp let long names spill past the card. */}
        <p className="absolute inset-x-0 bottom-0 truncate px-2.5 pb-2 text-label font-medium text-white">
          {hairstyle.name}
        </p>
      </div>
    </button>
  );
};

export default StyleCard;
