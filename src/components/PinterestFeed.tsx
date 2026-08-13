// PinterestFeed.tsx — the main browse surface.
//
// Replaces the shelf/carousel home with a Pinterest-style masonry feed: two
// columns of big imagery at varying heights, tight gutters, infinite scroll.
// Shelves make you consume someone else's edit in fixed rows; a masonry feed
// lets you graze — which is the behaviour we want for "find a hairstyle".
//
// Masonry via CSS `columns`, not a JS layout library: the browser does the
// packing natively, cards flow with `break-inside: avoid`, and there is no
// measurement pass to jank the scroll.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { imagesOutline } from 'ionicons/icons';
import { apiService, type Hairstyle } from '@/lib/api';
import { PinCard } from '@/components/ui/PinCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;

interface PinterestFeedProps {
  onSelect: (h: Hairstyle) => void;
  /** Chips are the only filter chrome — no dropdowns, no tabs. */
  categories?: string[];
  seed?: Hairstyle[];
}

export const PinterestFeed: React.FC<PinterestFeedProps> = ({
  onSelect,
  categories: seedCategories,
  seed = [],
}) => {
  const [categories, setCategories] = useState<string[]>(seedCategories || []);
  const [active, setActive] = useState('All');
  const [items, setItems] = useState<Hairstyle[]>(seed);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (categories.length) return;
    apiService.getHairstyleCategories().then((res) => {
      if (res.success) setCategories(['All', ...res.data.map((c: any) => c.name)]);
    });
  }, [categories.length]);

  const fetchPage = useCallback(
    async (p: number, category: string) => {
      const res: any = await apiService.getHairstyles({
        page: p,
        limit: PAGE_SIZE,
        // 'featured' ranks the textured/protective catalogue first — the same
        // bias applied to For You and Trending. This is the app's primary
        // browse surface, so an unbiased popularity sort put European styles
        // at the top of the first screen everyone sees.
        sort: 'featured',
        ...(category !== 'All' ? { category } : {}),
      } as any);
      return res?.data?.hairstyles || res?.data || [];
    },
    []
  );

  // Reset on filter change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    fetchPage(1, active)
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [active, fetchPage]);

  // Infinite scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const next = page + 1;
        setLoading(true);
        fetchPage(next, active)
          .then((list) => {
            setItems((prev) => [...prev, ...list]);
            setHasMore(list.length >= PAGE_SIZE);
            setPage(next);
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loading, active, fetchPage]);

  return (
    <div className="flex h-full flex-col">
      {/* Filter chips — sticky, the only filter chrome */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 -mx-0 bg-surface/95 backdrop-blur-sm">
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-2 px-3 py-2" style={{ width: 'max-content' }}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={cn(
                    'h-8 whitespace-nowrap rounded-full px-3.5 text-caption font-medium transition-colors',
                    c === active
                      ? 'bg-ink text-surface'
                      : 'bg-surface-2 text-ink-2 active:bg-hairline'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={<IonIcon icon={imagesOutline} style={{ fontSize: 24 }} />}
          title="Nothing here yet"
          description="Try another category."
          action={
            active !== 'All' ? (
              <button
                onClick={() => setActive('All')}
                className="rounded-full bg-ink px-5 py-2.5 text-label text-surface"
              >
                Show all
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="px-2 pt-1">
          {/* The masonry: two native CSS columns. Cards keep their own heights,
              so the columns stagger and interlock. */}
          <div className="columns-2 gap-2">
            {items.map((h) => (
              <PinCard
                key={h._id || h.id}
                hairstyle={h}
                width={190}
                onSelect={() => onSelect(h)}
              />
            ))}
          </div>
          <div ref={sentinel} className="h-12" />
          {loading && (
            <p className="pb-6 text-center text-caption text-ink-3">Loading more…</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PinterestFeed;
