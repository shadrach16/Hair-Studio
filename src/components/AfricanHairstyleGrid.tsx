import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; 
import { useHairstyles } from '@/hooks/useHairstyles';
import { apiService, type Hairstyle } from '@/lib/api';
import { Search, Filter, Coins, Loader2, SortAsc, ChevronDown, Lock, ChevronLeft, ChevronRight, Palette, Upload, Heart } from 'lucide-react'; 
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { BASE_GENERATION_COST } from '@/lib/generationTiers';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AfricanHairstyleGridProps {
  onHairstyleSelect: (hairstyle: Hairstyle) => void;
  setShowPricing: (value: boolean) => void;
  handleUploadHairstyle: () => void;
  handleGenerateStyle: () => void;
  selectedHairstyle: Hairstyle | null;
  userCredits?: number;
}

interface Category {
  name: string;
  count: number;
}

// Hairstyle helper function
const getGenderColor = (gender: string) => {
  switch (gender) {
    case 'Male': return 'bg-blue-100 text-blue-800';
    case 'Female': return 'bg-pink-100 text-pink-800';
    case 'Unisex': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};


const HairstyleCardSkeleton = () => (
  <div className="rounded-card border-2 border-transparent overflow-hidden">
    <div className="aspect-[4/5] relative rounded-card overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute top-2 right-2">
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  </div>
);


const HairstyleCard = ({ 
  hairstyle, 
  isSelected, 
  canAfford, 
  onSelect, 
  isCustom,
  isFavorited,
  onToggleFavorite 
}: { 
  hairstyle: Hairstyle, 
  isSelected: boolean, 
  canAfford: boolean, 
  onSelect: () => void, 
  isCustom: boolean,
  isFavorited: boolean,
  onToggleFavorite: (e: React.MouseEvent) => void
}) => (
  <Card
    onClick={onSelect}
    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
    tabIndex={0}
    role="option"
    aria-selected={isSelected}
    aria-label={hairstyle.name}
    className={cn(
      "cursor-pointer transition-all duration-300 group overflow-hidden border-2 rounded-card",
      isSelected ? 'border-brand-500 shadow-glow-amber' : 'border-transparent shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
    )}
  >
    <CardContent className="p-0">
      <div className="aspect-[4/5] overflow-hidden relative bg-gray-100 rounded-card">
        <img
          src={hairstyle.thumbnail}
          alt={hairstyle.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Favorite button - top left */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-2 left-2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-10 min-h-touch min-w-touch flex items-center justify-center"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart 
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorited ? "fill-red-500 text-red-500" : "text-white hover:text-red-300"
            )} 
          />
        </button>
        
        {/* Browsing carries no price and no lock: per-style prices no longer
            match the flat per-tier charge, and padlocking every card for a
            signed-out visitor was the paywall-before-value problem. Cost is
            shown at the moment of intent. */}
        {isCustom && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-brand-500/80 hover:bg-brand-600 text-caption-sm">Custom</Badge>
          </div>
        )}

        <div className="absolute bottom-0 left-0 p-3">
          <h4 className="text-label-sm text-white leading-tight line-clamp-2">
            {isCustom ? `Upload ID: ${hairstyle._id.slice(-4)}` : hairstyle.name}
          </h4>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AfricanHairstyleGrid({
  onHairstyleSelect,
  selectedHairstyle,
  userCredits = 0,
  handleGenerateStyle,
  setShowPricing,
  handleUploadHairstyle
}: AfricanHairstyleGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Filters for Default Styles (The Collections)
  const [defaultFilters, setDefaultFilters] = useState({
    category: 'All',
    gender: 'All',
    feature: 'All',
    search: '',
    sort: 'popularity',
  });

  // Filters for Custom Styles (My Uploads)
  const [customFilters, setCustomFilters] = useState({
    search: '',
    sort: 'newest',
  });

  const debouncedDefaultSearch = useDebounce(defaultFilters.search, 300);
  const debouncedCustomSearch = useDebounce(customFilters.search, 300);

  // Hook for Default Styles
  const defaultHook = useHairstyles({
    category: defaultFilters.category,
    gender: defaultFilters.gender,
    feature: defaultFilters.feature,
    search: debouncedDefaultSearch,
    sort: defaultFilters.sort,
    limit: 12,
    type: 'default',
    autoLoad: activeTab === 'default',
  });

  // Hook for Custom Styles (My Uploads)
  const customHook = useHairstyles({
    search: debouncedCustomSearch,
    sort: customFilters.sort,
    limit: 12,
    type: 'custom',
    autoLoad: activeTab === 'custom',
  });

  const currentHook = activeTab === 'default' ? defaultHook : customHook;
  const currentFilters = activeTab === 'default' ? defaultFilters : customFilters;

  // Fetch categories on mount for the Default tab
  useEffect(() => {
    if (activeTab === 'default') {
      const fetchCategories = async () => {
        try {
          const result = await apiService.getHairstyleCategories();
          if (result.success) {
            const totalCount = result.data.reduce((sum, cat) => sum + cat.count, 0);
            const allCategory = { name: 'All', count: totalCount };
            setCategories([allCategory, ...result.data]);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      fetchCategories();
    }
  }, [activeTab]);

  // Load favorites on mount
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadFavorites = async () => {
      try {
        const result = await apiService.getFavoriteIds();
        if (result.success && Array.isArray(result.data)) {
          setFavoriteIds(new Set(result.data));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };
    loadFavorites();
  }, [isAuthenticated]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent, hairstyle: Hairstyle) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    const hairstyleId = hairstyle._id || hairstyle.id;
    try {
      const result = await apiService.toggleFavorite('hairstyle', hairstyleId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (result.isFavorited) {
          next.add(hairstyleId);
        } else {
          next.delete(hairstyleId);
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [isAuthenticated]);

  const canAfford = useCallback((price: number) => userCredits >= price, [userCredits]);

  const handleStyleSelect = useCallback((hairstyle: Hairstyle) => {
    const isCustom = hairstyle.isCustom || activeTab === 'custom';
    if (!isCustom && !canAfford(hairstyle.price)) {
      setShowPricing(true);
      return;
    }
    
    // Track hairstyle selection
    apiService.trackEvent('hairstyle_selected', {
      hairstyleId: hairstyle.id || hairstyle._id,
      hairstyleName: hairstyle.name,
      category: hairstyle.category,
      isCustom,
      price: hairstyle.price
    });
    
    onHairstyleSelect(hairstyle);
  }, [canAfford, onHairstyleSelect, setShowPricing, activeTab]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= currentHook.totalPages) {
      currentHook.setPage(newPage);
      // Scroll to the top of the grid when page changes
      const scrollArea = document.querySelector('.AfricanHairstyleGrid-scrollArea > div[data-radix-scroll-area-viewport]');
      if (scrollArea) scrollArea.scrollTop = 0;
    }
  }, [currentHook]);

  const updateDefaultFilter = useCallback((key: string, value: string) => {
    setDefaultFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateCustomFilter = useCallback((key: string, value: string) => {
    setCustomFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilter = activeTab === 'default' ? updateDefaultFilter : updateCustomFilter;

  const genderOptions = ['All', 'Female', 'Male', 'Unisex'];
  const featureOptions = ['All', 'Basic', 'Trending', 'Premium'];
  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'price', label: 'Price (Low to High)' },
  ];
  const customSortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name (A-Z)' },
  ];

  return (
    <div className="bg-white border-l border-gray-100 flex flex-col h-full w-[480px] flex-shrink-0">
      <div className="p-4 border-b bg-gradient-brand-soft">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-title text-gray-900">Style Collections</h2>
          <div className="credit-pill">
            <Coins className="w-4 h-4 text-brand-600" />
            <span className="text-label text-gray-700">{Number(userCredits).toFixed(2)}</span>
          </div>
        </div>
        <p className="text-body-sm text-gray-600">Browse and Unlock your next look.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'default' | 'custom')} className="flex-1 flex flex-col overflow-hidden ">
        {/* Tab List */}
        <TabsList className="shrink-0 grid grid-cols-2 border border-gray-200 bg-gray-100 mx-4 my-3 h-12 rounded-2xl p-1">
          <TabsTrigger
            value="default"
            className="text-label h-10 rounded-xl text-gray-600 transition-all duration-200 data-[state=active]:bg-gradient-brand data-[state=active]:text-white data-[state=active]:shadow-soft-md"
          >
            <Palette className="w-4 h-4 mr-1.5" />
            The Collections
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="text-label h-10 rounded-xl text-gray-600 transition-all duration-200 data-[state=active]:bg-gradient-brand data-[state=active]:text-white data-[state=active]:shadow-soft-md"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            My Uploads
          </TabsTrigger>
        </TabsList>

        {/* Filters and Search - Common wrapper */}
        <div className="px-4 py-2 space-y-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex w-full items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder={activeTab === 'default' ? 'Search default styles...' : 'Search your custom uploads...'}
              value={currentFilters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 h-11 text-body-sm rounded-button"
            />
          </div>
               <Button
                onClick={handleUploadHairstyle}
                variant="outline"
                className="h-11 text-label btn-brand"
              >
                <Upload className="w-4 h-4" />
              Upload

              </Button>
          </div>

          {/* FIX: Collapsible now wraps the Trigger and Content correctly */}
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <div className="flex items-center justify-between">
              {/* Sort Select */}
              <Select
                value={currentFilters.sort}
                onValueChange={(value) => updateFilter('sort', value)}
              >
                <SelectTrigger className="w-auto h-9 bg-transparent border-none shadow-none text-slate-600 font-medium text-sm focus:ring-0">
                  <div className="flex items-center gap-1.5">
                    <SortAsc className="w-4 h-4" />
                    <SelectValue placeholder="Sort by..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(activeTab === 'default' ? sortOptions : customSortOptions).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Collapsible Trigger */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm text-amber-600 hover:text-amber-700">
                  <Filter className="w-4 h-4 mr-1.5" />
                  Filters
                  <ChevronDown className={cn("w-4 h-4 ml-1.5 transition-transform", isFilterOpen && 'rotate-180')} />
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Collapsible Content */}
            <CollapsibleContent className="space-y-4 pt-4 animate-in fade-in-0 slide-in-from-top-2">
              {activeTab === 'default' && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.name}
                          variant={defaultFilters.category === category.name ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateDefaultFilter('category', category.name)}
                          className="text-sm h-7 px-2"
                        >
                          {category.name} ({category.count})
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Gender</label>
                    <div className="flex flex-wrap gap-2">
                      {genderOptions.map((gender) => (
                        <Button
                          key={gender}
                          variant={defaultFilters.gender === gender ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateDefaultFilter('gender', gender)}
                          className="text-sm h-7 px-2"
                        >
                          {gender}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {/* Additional filters for Custom tab can be added here if needed */}
            </CollapsibleContent>
          </Collapsible>

        </div>

        {/* Feature Filters (Permanent, outside the collapsible filter group) */}
        <div className="p-4   border-b border-slate-200 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {featureOptions.map((feature) => (
              <Button
                key={feature}
                variant={defaultFilters.feature === feature ? "default" : "outline"}
                size="sm"
                onClick={() => updateDefaultFilter('feature', feature)}
                className="text-sm h-9 px-3"
                disabled={activeTab === 'custom'}
              >
                {feature === 'Premium' ? <span> Premium 🦁</span> : feature === 'Basic' ? <span> Novice 🦌</span> : feature === 'Trending' ? <span> Trending 🔥</span> : 'Latest'}
              </Button>
            ))}
          </div>
        </div>


        {/* Content Area (Hairstyle Grid) */}
        <ScrollArea className="flex-1 bg-slate-50/50 overflow-scroll AfricanHairstyleGrid-scrollArea">
          <div className="p-4">
            {currentHook.isLoading && (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }).map((_, index) => (
                  <HairstyleCardSkeleton key={index} />
                ))}
              </div>)}

            {currentHook.error && (
              <div className="text-center py-20 text-slate-500">
                <p className="font-medium text-red-600">Error loading styles</p>
                <p className="text-sm">{currentHook.error}</p>
              </div>
            )}

            {!currentHook.isLoading && !currentHook.error && (
              <TabsContent value={activeTab} className="h-full m-0 data-[state=active]:block">
                {currentHook.hairstyles?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1" role="listbox" aria-label="Hairstyle options">
                    {currentHook.hairstyles.map((hairstyle) => (
                      <HairstyleCard
                        key={hairstyle._id}
                        hairstyle={hairstyle}
                        isSelected={selectedHairstyle?._id === hairstyle._id}
                        canAfford={canAfford(hairstyle.price)}
                        onSelect={() => handleStyleSelect(hairstyle)}
                        isCustom={activeTab === 'custom'}
                        isFavorited={favoriteIds.has(hairstyle._id)}
                        onToggleFavorite={(e) => handleToggleFavorite(e, hairstyle)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500">
                    <Filter className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-700">No Hairstyles Found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </div>
                )}
              </TabsContent>
            )}
          </div>
        </ScrollArea>

        {/* Pagination Controls */}
        {!currentHook.isLoading && currentHook.totalPages > 1 && (
          <div className="px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-white flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentHook.currentPage - 1)}
              disabled={currentHook.currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">
              Page <strong>{currentHook.currentPage}</strong> of <strong>{currentHook.totalPages}</strong> ({currentHook.totalHairstyles} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentHook.currentPage + 1)}
              disabled={currentHook.currentPage === currentHook.totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Tabs>


      {/* Selected Style Info and Generate Button */}
      {selectedHairstyle && (
        <div className="p-4 border-t bg-amber-50 flex-shrink-0">
          <div className="flex items-start space-x-3">
            <img
              src={selectedHairstyle.thumbnail}
              alt={selectedHairstyle.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 truncate">
                {selectedHairstyle.name}
              </h4>

              <div className="flex items-center justify-between">
                <Badge className={getGenderColor(selectedHairstyle.gender)}>
                  {selectedHairstyle.gender}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Coins className="w-3 h-3 text-brass" />
                  {/* Flat per-tier cost, not the legacy per-style price (the
                      server charges the tier amount). */}
                  <span className="text-sm font-bold text-brass">
                    {BASE_GENERATION_COST}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 w-full">
            <Button
              onClick={handleGenerateStyle}
              size="sm"
              className="bg-amber-600
              hover:bg-amber-700 text-sm h-9 mt-2 px-6 font-semibold  w-full "
            >
              Generate Style
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}