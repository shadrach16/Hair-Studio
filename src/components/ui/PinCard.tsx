// PinCard.tsx — a Pinterest-style pin.
//
// The image IS the card: no background, no border, no badges, no price. The
// only overlay is a save affordance, and the name is a quiet caption beneath —
// Pinterest keeps chrome off the image so the grid reads as photography.
//
// Heights vary per card (see aspectFor) which is what makes the two columns
// stagger and "interlock" rather than aligning into rows.

import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { cdnImage, lqip } from '@/lib/img';
import { cn } from '@/lib/utils';

/**
 * Deterministic aspect ratio per item.
 *
 * Pinterest uses each image's true dimensions, but our catalogue doesn't store
 * them — measuring at runtime would cause layout shift as every card resized
 * after load. Hashing the id into a fixed set of portrait ratios gives the same
 * staggered rhythm with zero shift, and Cloudinary's g_auto keeps the face in
 * frame when cropping.
 */
const RATIOS = [3 / 4, 4 / 5, 1, 5 / 7, 2 / 3];

function aspectFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return RATIOS[h % RATIOS.length];
}

export interface PinCardProps {
  hairstyle: {
    _id?: string;
    id?: string;
    name: string;
    thumbnail?: string;
    isNew?: boolean;
  };
  onSelect: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** Column width in CSS px — sizes the CDN request. */
  width?: number;
  showCaption?: boolean;
}

export const PinCard: React.FC<PinCardProps> = ({
  hairstyle,
  onSelect,
  isFavorite,
  onToggleFavorite,
  width = 190,
  showCaption = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const id = String(hairstyle._id || hairstyle.id || hairstyle.name);
  const ratio = aspectFor(id);
  const placeholder = lqip(hairstyle.thumbnail);

  return (
    <div className="mb-2 break-inside-avoid">
      <button
        type="button"
        onClick={onSelect}
        onTouchStart={() => {
          if (hairstyle.thumbnail) new Image().src = cdnImage(hairstyle.thumbnail, { width: 720 });
        }}
        className="group block w-full text-left active:scale-[0.98] transition-transform duration-150"
      >
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-surface-2"
          style={{ aspectRatio: String(ratio) }}
        >
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              aria-hidden="true"
              className={cn(
                'absolute inset-0 h-full w-full scale-110 object-cover transition-opacity duration-300',
                loaded ? 'opacity-0' : 'opacity-100'
              )}
            />
          )}
          <img
            src={cdnImage(hairstyle.thumbnail, { width: width * 2 })}
            alt={hairstyle.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={isFavorite ? 'Remove from saved' : 'Save'}
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/35 backdrop-blur-md active:scale-90 transition-transform"
            >
              <IonIcon
                icon={isFavorite ? heart : heartOutline}
                style={{ fontSize: 18 }}
                className={isFavorite ? 'text-brass' : 'text-white'}
              />
            </button>
          )}
        </div>
      </button>

      {showCaption && (
        <p className="mt-1.5 px-1 text-caption text-ink-2 line-clamp-2 leading-snug">
          {hairstyle.name}
        </p>
      )}
    </div>
  );
};

export default PinCard;
