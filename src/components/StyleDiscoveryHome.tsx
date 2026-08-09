// StyleDiscoveryHome.tsx — Style-first discovery home screen
// Hero card + horizontal carousels + persistent upload CTA

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService, type Hairstyle, type StyleCollection, type StyleRecommendation } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Camera,
  ChevronRight,
  Coins,
  Flame,
  TrendingUp,
  Star,
  Lock,
  Image as ImageIcon,
  ImagePlus,
} from 'lucide-react';
import { StyleCard } from '@/components/ui/StyleCard';
import { cardThumb } from '@/lib/img';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StyleDiscoveryHomeProps {
  onStyleSelect: (hairstyle: Hairstyle) => void;
  onLockedTap?: (hairstyle: Hairstyle) => void;
  onUploadPhoto: () => void;
  onSeeAll: () => void;
  onCustomStyleUpload?: () => void;
  userCredits: number;
  isAuthenticated: boolean;
  selectedPhoto: File | null;
}

// ─── Hero Card ──────────────────────────────────────────────────────────────

const HeroCard: React.FC<{
  hairstyle: Hairstyle | null;
  onTap: (h: Hairstyle) => void;
  isLoading: boolean;
}> = ({ hairstyle, onTap, isLoading }) => {
  if (isLoading || !hairstyle) {
    return (
      <div className="mx-4 mb-5">
        <Skeleton className="w-full aspect-[16/10] rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={() => onTap(hairstyle)}
      className="mx-4 mb-5 block w-[calc(100%-2rem)] text-left group"
    >
      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-lg shadow-gray-200/60">
        <img
          // Sized CDN derivative rather than the full-resolution original —
          // the hero was pulling a 1200px+ image into a ~380px slot.
          src={cardThumb(hairstyle.thumbnail, 420)}
          alt={hairstyle.name}
          className="w-full h-full object-cover transition-transform duration-700 group-active:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top-left badge */}
        {hairstyle.isNew && (
          <div className="absolute top-3.5 left-3.5">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-semibold text-white tracking-wide uppercase">
              New
            </span>
          </div>
        )}

        {/* Browsing is price-free: cost is shown at the moment of intent (the
            confirm screen), and per-style prices no longer reflect the flat
            per-tier charge anyway. */}

        {/* Bottom info */}
        <div className="absolute bottom-0 inset-x-0 p-4 pb-4.5">
          <p className="text-micro font-medium text-white/60 uppercase tracking-wider mb-0.5">
            Featured Style
          </p>
          <h2 className="font-display text-display-sm text-white leading-tight mb-1">
            {hairstyle.name}
          </h2>
          <div className="flex items-center gap-2">
            {hairstyle.category && (
              <span className="px-2 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-medium text-white/80">
                {hairstyle.category}
              </span>
            )}
            {hairstyle.culturalOrigin && (
              <span className="px-2 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-medium text-white/80">
                {hairstyle.culturalOrigin}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// ─── Compact Style Card (for carousels) ─────────────────────────────────────

// Shelf card = the shared StyleCard (M3 §5.1) at carousel width. Wider than the
// old 108px so the photo can actually carry the card, and 4:5 to match the grid.
const CompactStyleCard: React.FC<{
  hairstyle: Hairstyle;
  onSelect: (h: Hairstyle) => void;
  index: number;
  reason?: string;
}> = ({ hairstyle, onSelect, index, reason }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.04 }}
    className="w-[132px] flex-shrink-0"
  >
    <StyleCard hairstyle={hairstyle} onSelect={() => onSelect(hairstyle)} width={132} />
    {/* Only show a reason when it actually differentiates. The generic
        "Popular style" repeated under every card was pure noise. */}
    {reason && !/^popular/i.test(reason) && (
      <p className="mt-1 px-0.5 text-caption-sm text-ink-3 leading-tight line-clamp-1">
        {reason}
      </p>
    )}
  </motion.div>
);

// ─── Carousel Section ───────────────────────────────────────────────────────

interface CarouselSectionProps {
  title: string;
  emoji?: string;
  icon?: React.ReactNode;
  hairstyles: (Hairstyle & { recommendationReason?: string })[];
  userCredits: number;
  onSelect: (h: Hairstyle) => void;
  onLockedTap?: (h: Hairstyle) => void;
  onSeeAll?: () => void;
  showReasons?: boolean;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({
  title,
  emoji,
  icon,
  hairstyles,
  userCredits,
  onSelect,
  onLockedTap,
  onSeeAll,
  showReasons,
}) => {
  if (!hairstyles?.length) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-2.5">
        {/* Editorial shelf title. Emoji headers were removed — they read as
            generic-AI; the serif carries the premium tone instead. */}
        <h3 className="font-display text-title text-ink flex items-center gap-1.5">
          {icon}
          {title}
        </h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[12px] font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-0.5 transition-colors"
          >
            See all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-none">
        <div className="flex gap-2.5 px-4" style={{ width: 'max-content' }}>
          {hairstyles.map((h, i) => (
            <CompactStyleCard
              key={h._id || h.id}
              hairstyle={h}
              onSelect={onSelect}
              index={i}
              reason={showReasons ? h.recommendationReason : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Carousel Skeleton ──────────────────────────────────────────────────────

const CarouselSkeleton: React.FC = () => (
  <div className="mb-5">
    <div className="flex items-center justify-between px-4 mb-2.5">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-4 w-14" />
    </div>
    <div className="flex gap-2.5 px-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[108px]">
          <Skeleton className="aspect-[3/4] rounded-2xl" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Upload CTA Bar ─────────────────────────────────────────────────────────

const UploadCTABar: React.FC<{
  onUpload: () => void;
  hasPhoto: boolean;
}> = ({ onUpload, hasPhoto }) => (
  <div className="px-4 pb-3 pt-1">
    <button
      onClick={onUpload}
      className={cn(
        'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-200 active:scale-[0.98]',
        'bg-[#1a1a1a] text-white shadow-lg shadow-gray-900/10'
      )}
    >
      {hasPhoto ? (
        <>
          <ImageIcon className="w-[18px] h-[18px]" />
          Change Photo
        </>
      ) : (
        <>
          <Camera className="w-[18px] h-[18px]" />
          Upload photo to try on
        </>
      )}
    </button>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export const StyleDiscoveryHome: React.FC<StyleDiscoveryHomeProps> = ({
  onStyleSelect,
  onLockedTap,
  onUploadPhoto,
  onSeeAll,
  onCustomStyleUpload,
  userCredits,
  isAuthenticated,
  selectedPhoto,
}) => {
  const [collections, setCollections] = useState<StyleCollection[]>([]);
  const [forYou, setForYou] = useState<StyleRecommendation[]>([]);
  const [trending, setTrending] = useState<StyleRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // First-run hint (the zero-screen replacement for the intro carousel).
  const [showFirstRunHint, setShowFirstRunHint] = useState(
    () => localStorage.getItem('hs_seen_discover_hint') !== '1'
  );
  const handleStyleTap = useCallback(
    (h: Hairstyle) => {
      if (showFirstRunHint) {
        localStorage.setItem('hs_seen_discover_hint', '1');
        setShowFirstRunHint(false);
      }
      onStyleSelect(h);
    },
    [showFirstRunHint, onStyleSelect]
  );

  // Featured hairstyle = random trending style, rotates daily
  const featuredStyle = useMemo<Hairstyle | null>(() => {
    if (trending.length > 0) {
      const daysSinceEpoch = Math.floor(Date.now() / 86400000);
      return trending[daysSinceEpoch % trending.length];
    }
    for (const col of collections) {
      if (col.hairstyles?.length > 0) return col.hairstyles[0];
    }
    return null;
  }, [trending, collections]);

  // Load data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const [colRes, recRes, trendRes] = await Promise.all([
        apiService.getCollections(),
        apiService.getForYouRecommendations({ limit: 10 }),
        apiService.getTrendingStyles({ limit: 10 }),
      ]);
      if (cancelled) return;
      if (colRes.success) setCollections(colRes.data);
      if (recRes.success) setForYou(recRes.data);
      if (trendRes.success) setTrending(trendRes.data);
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
        {/* Greeting + Upload Hairstyle */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-display text-ink tracking-tight">
                Discover Styles
              </h1>
              {/* Replaces the old 3-screen intro carousel: the instruction is
                  delivered in place, once, and disappears after the first tap. */}
              <p className="text-caption text-ink-2 mt-0.5">
                {showFirstRunHint ? 'Tap any style to see it on you' : 'Find your next look'}
              </p>
            </div>
            {onCustomStyleUpload && (
              <button
                onClick={onCustomStyleUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 mt-0.5
                           bg-gray-100 hover:bg-gray-200 rounded-full
                           active:scale-[0.96] transition-all duration-150 lg:hidden"
              >
                <ImagePlus className="w-4 h-4 text-gray-600" />
                <span className="text-[12px] font-semibold text-gray-700">Upload</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Card */}
        <HeroCard
          hairstyle={featuredStyle}
          onTap={handleStyleTap}
          isLoading={isLoading}
        />

        {/* Loading state */}
        {isLoading && (
          <>
            <CarouselSkeleton />
            <CarouselSkeleton />
          </>
        )}

        {/* Trending Now */}
        {trending.length > 0 && (
          <CarouselSection
            title="Trending Now"
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            hairstyles={trending.filter(h => h._id !== featuredStyle?._id && h.id !== featuredStyle?.id).slice(0, 10)}
            userCredits={userCredits}
            onSelect={handleStyleTap}
            onSeeAll={onSeeAll}
          />
        )}

        {/* For You */}
        {forYou.length > 0 && (
          <CarouselSection
            title="For You"
            hairstyles={forYou}
            userCredits={userCredits}
            onSelect={handleStyleTap}
            onSeeAll={onSeeAll}
            showReasons
          />
        )}

        {/* Collection carousels */}
        {collections.map((col) => {
          if (!col.hairstyles?.length) return null;
          return (
            <CarouselSection
              key={col._id}
              title={col.name}
              hairstyles={col.hairstyles}
              userCredits={userCredits}
              onSelect={handleStyleTap}
              onSeeAll={onSeeAll}
            />
          );
        })}

        {/* Empty state fallback */}
        {!isLoading && collections.length === 0 && trending.length === 0 && forYou.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Star className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              No styles available
            </h3>
            <p className="text-sm text-gray-400">
              Check back soon for new looks
            </p>
          </div>
        )}
      </div>

      {/* Persistent Upload CTA - pinned at bottom */}
      <UploadCTABar onUpload={onUploadPhoto} hasPhoto={!!selectedPhoto} />
    </div>
  );
};

export default StyleDiscoveryHome;
