// ConfirmGenerateScreen.tsx — Side-by-side preview of photo + style before generating
// Screen 3 of the style-first flow: photo and style both selected, user confirms

import React, { useState } from 'react';
import { ChevronLeft, Coins, Clock, ShieldCheck, ArrowRight, ImageOff, Diamond, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Hairstyle } from '@/lib/api';
import { tierCost } from '@/lib/generationTiers';
import { cn } from '@/lib/utils';

// Generation mode definitions (matching PreGenerationSheet)
const GENERATION_MODES = [
  // Costs come from lib/generationTiers (single source of truth, mirrors the
  // backend). Only presentation lives here.
  { id: 'standard' as const, label: 'Standard', credits: tierCost('standard'), icon: ImageOff, color: 'gray', desc: 'Fast results, good quality' },
  { id: 'hd' as const, label: 'HD', credits: tierCost('hd'), icon: Diamond, color: 'blue', desc: 'Sharper detail, better realism' },
  { id: 'pro' as const, label: 'Pro', credits: tierCost('pro'), icon: Zap, color: 'amber', desc: 'Best quality, lifelike output' },
] as const;

export type GenerationMode = 'standard' | 'hd' | 'pro';

interface ConfirmGenerateScreenProps {
  selectedPhoto: File;
  selectedHairstyle: Hairstyle;
  userCredits: number;
  isPro: boolean;
  isAuthenticated: boolean;
  onGenerate: (mode: GenerationMode) => void;
  onBack: () => void;
  onBuyCredits: () => void;
}

export const ConfirmGenerateScreen: React.FC<ConfirmGenerateScreenProps> = ({
  selectedPhoto,
  selectedHairstyle,
  userCredits,
  isPro,
  isAuthenticated,
  onGenerate,
  onBack,
  onBuyCredits,
}) => {
  // Default to Standard (cheapest) so a new user's free credits can complete a
  // first try-on instead of landing on an unaffordable HD tier + paywall.
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('standard');
  const modeConfig = GENERATION_MODES.find(m => m.id === selectedMode)!;
  const creditCost = modeConfig.credits;
  const canAfford = userCredits >= creditCost;

  const photoUrl = URL.createObjectURL(selectedPhoto);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-full px-4 py-3">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors -ml-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-700">{userCredits}</span>
        </div>
      </div>

      {/* Side-by-side preview */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Your photo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden shadow-md shadow-gray-200/60 border-2 border-white ring-1 ring-gray-100">
            <img
              src={photoUrl}
              alt="Your photo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[12px] font-medium text-gray-500">Your Photo</span>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 -mt-5">
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Style preview */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden shadow-md shadow-gray-200/60 border-2 border-white ring-1 ring-gray-100">
            <img
              src={selectedHairstyle.thumbnail}
              alt={selectedHairstyle.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[12px] font-medium text-gray-500 max-w-[120px] truncate text-center">
            {selectedHairstyle.name}
          </span>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mb-5">
        <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1">
          Quality
        </p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Quality mode">
          {GENERATION_MODES.map((mode) => {
            const cost = mode.credits;
            const isSelected = selectedMode === mode.id;
            const affordable = userCredits >= cost;
            const needMore = cost - userCredits;
            return (
              <button
                key={mode.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedMode(mode.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                  isSelected
                    ? affordable
                      ? 'border-gray-900 bg-gray-50 shadow-sm scale-[1.02]'
                      : 'border-gray-400 bg-gray-50 scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/60 active:scale-[0.97]'
                )}
              >
                <mode.icon className={cn(
                  'w-4.5 h-4.5 transition-colors',
                  isSelected ? (affordable ? 'text-gray-900' : 'text-gray-500') : 'text-gray-400'
                )} />
                <span className={cn(
                  'text-[12px] font-semibold transition-colors',
                  isSelected ? (affordable ? 'text-gray-900' : 'text-gray-600') : 'text-gray-500'
                )}>
                  {mode.label}
                </span>
                <span className="text-[10px] text-gray-400">{cost} cr</span>
              </button>
            );
          })}
        </div>

        {/* Mode description — shows benefit or "need more credits" hint */}
        {(() => {
          const mode = GENERATION_MODES.find(m => m.id === selectedMode)!;
          // Flat tier cost — `multiplier` no longer exists on the tier objects.
          const cost = mode.credits;
          const affordable = userCredits >= cost;
          const needMore = cost - userCredits;
          return (
            <p className={cn(
              'text-center text-[11px] mt-2.5 min-h-[16px] transition-all duration-200',
              affordable ? 'text-gray-400' : 'text-amber-500'
            )}>
              {affordable
                ? mode.desc
                : `Need ${needMore} more credit${needMore !== 1 ? 's' : ''} — ${mode.desc.toLowerCase()}`
              }
            </p>
          );
        })()}
      </div>

      {/* Trust indicators */}
      <div className="flex items-center justify-center gap-5 mb-5">
        <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          ~20 seconds
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Refund guaranteed
        </span>
      </div>

      {/* Generate button */}
      {canAfford ? (
        <Button
          onClick={() => onGenerate(selectedMode)}
          className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
        >
          Generate
          <span className="ml-2 flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full text-[12px]">
            <Coins className="w-3 h-3" />
            {creditCost}
          </span>
        </Button>
      ) : (
        <div className="space-y-2.5">
          <p className="text-center text-[12px] text-amber-600 font-medium">
            You need {creditCost - userCredits} more credit{creditCost - userCredits !== 1 ? 's' : ''}
          </p>
          <Button
            onClick={onBuyCredits}
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            Get More Credits
          </Button>
        </div>
      )}

      {/* Subtle disclaimer */}
      <p className="text-center text-[10px] text-gray-300 mt-4">
        Results may vary. AI-generated images are approximations.
      </p>
    </div>
  );
};

export default ConfirmGenerateScreen;
