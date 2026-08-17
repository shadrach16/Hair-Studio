// LookbookSheet.tsx — the full browse surface (M3 §5.3).
//
// Replaces MobileHairstyleModal (494 lines) and the filter chrome of
// AfricanHairstyleGrid, which between them stacked an Input + Select dropdown +
// Tabs + Collapsible over a uniform grid — spreadsheet energy, not lookbook
// energy — and paginated by reaching into Radix internals with
// querySelector('[data-radix-scroll-area-viewport]').
//
// Here instead: one sticky chip row, a 2-column photo grid of the shared
// StyleCard, infinite scroll, and a real empty state with one-tap recovery.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { searchOutline, closeOutline, imagesOutline } from 'ionicons/icons';
import { apiService, type Hairstyle } from '@/lib/api';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PinCard } from '@/components/ui/PinCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

interface LookbookSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (h: Hairstyle) => void;
  /** Already-loaded styles, used as the first page while the API responds. */
  seed?: Hairstyle[];
}

export const LookbookSheet: React.FC<LookbookSheetProps> = ({
  isOpen,
  onClose,
  onSelect,
  seed = [],
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<Hairstyle[]>(seed);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  // True when the backend fell back to spelling-tolerant matching, so the sheet
  // can say so rather than presenting approximate results as exact.
  const [fuzzy, setFuzzy] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    apiService.getHairstyleCategories().then((res) => {
      if (res.success) setCategories(['All', ...res.data.map((c: any) => c.name)]);
    });
  }, [isOpen]);

  // Reload whenever the filter or search changes.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setPage(1);
    apiService
      .getHairstyles({
        page: 1,
        limit: PAGE_SIZE,
        ...(activeCategory !== 'All' ? { category: activeCategory } : {}),
        ...(query ? { search: query } : {}),
      } as any)
      .then((res: any) => {
        if (cancelled) return;
        const list = res?.data?.hairstyles || res?.data || [];
        setItems(list);
        setFuzzy(!!res?.fuzzy);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeCategory, query]);

  // Infinite scroll via IntersectionObserver — replaces the Radix-internals
  // scroll hack, and keeps only what's needed in the DOM.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const next = page + 1;
        setLoading(true);
        apiService
          .getHairstyles({
            page: next,
            limit: PAGE_SIZE,
            ...(activeCategory !== 'All' ? { category: activeCategory } : {}),
            ...(query ? { search: query } : {}),
          } as any)
          .then((res: any) => {
            const list = res?.data?.hairstyles || res?.data || [];
            setItems((prev) => [...prev, ...list]);
            setHasMore(list.length >= PAGE_SIZE);
            setPage(next);
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loading, activeCategory, query]);

  const hasFilters = activeCategory !== 'All' || !!query;

  const clearAll = () => {
    setActiveCategory('All');
    setQuery('');
    setSearching(false);
  };

  // Same masonry as the main feed, so search results and browsing read as one
  // surface rather than two different apps.
  const grid = useMemo(
    () => (
      <div className="columns-2 gap-2">
        {items.map((h) => (
          <PinCard
            key={h._id || h.id}
            hairstyle={h}
            width={180}
            onSelect={() => {
              onSelect(h);
              onClose();
            }}
          />
        ))}
      </div>
    ),
    [items, onSelect, onClose]
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      breakpoints={[0, 0.95]}
      initialBreakpoint={0.95}
      title={searching ? undefined : 'Lookbook'}
    >
      {/* Search row */}
      <div className="mb-3 flex items-center gap-2">
        {searching ? (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search braids, locs, fades…"
              className="h-10 flex-1 rounded-full bg-surface px-4 text-body text-ink outline-none ring-1 ring-hairline"
            />
            <button
              onClick={() => {
                setQuery('');
                setSearching(false);
              }}
              aria-label="Close search"
              className="grid h-10 w-10 place-items-center rounded-full text-ink-2"
            >
              <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setSearching(true)}
            className="flex h-10 flex-1 items-center gap-2 rounded-full bg-surface px-4 text-left text-body text-ink-3 ring-1 ring-hairline"
          >
            <IonIcon icon={searchOutline} style={{ fontSize: 18 }} />
            Search styles
          </button>
        )}
      </div>

      {/* One sticky chip row replaces the Input + Select + Tabs + Collapsible
          stack. Horizontally scrolling, brass fill when active. */}
      <div className="-mx-5 mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-5" style={{ width: 'max-content' }}>
          {categories.map((c) => {
            const active = c === activeCategory;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={cn(
                  'h-9 whitespace-nowrap rounded-full px-4 text-label transition-colors',
                  active
                    ? 'bg-ink text-surface'
                    : 'bg-surface text-ink-2 ring-1 ring-hairline active:bg-surface-2'
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={<IonIcon icon={imagesOutline} style={{ fontSize: 24 }} />}
          title={query ? `No styles like "${query}"` : 'No styles match'}
          description={
            query
              ? 'Check the spelling, or try a shorter word like "braids" or "fade".'
              : hasFilters
              ? 'Try a different category, or clear the filters to see everything.'
              : 'Nothing to show here yet.'
          }
          action={
            hasFilters ? (
              <button
                onClick={clearAll}
                className="rounded-full bg-ink px-5 py-2.5 text-label text-surface"
              >
                {query ? 'Clear search' : 'Clear filters'}
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {fuzzy && query && (
            <p className="mb-2 text-caption text-ink-3">
              No exact match for “{query}”. Showing the closest styles.
            </p>
          )}
          {grid}
          {/* Sentinel drives the next page */}
          <div ref={sentinel} className="h-10" />
          {loading && <p className="pb-4 text-center text-caption text-ink-3">Loading…</p>}
        </>
      )}
    </BottomSheet>
  );
};

export default LookbookSheet;
