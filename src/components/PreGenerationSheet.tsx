// components/PreGenerationSheet.tsx
// U2: Cost visibility sheet shown before generation — answers "what will this cost me?"
// A4: Generation mode selector (standard/HD/pro)

import React, { useState, useEffect } from 'react';
import { Coins, Clock, ShieldCheck, ImageOff, Diamond, AlertTriangle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService, type StyleContextNote } from '@/lib/api';

// A4: Generation mode definitions
const GENERATION_MODES = [
  { id: 'standard' as const, label: 'Standard', multiplier: 1, icon: ImageOff, desc: 'Good quality', color: 'gray' },
  { id: 'hd' as const, label: 'HD', multiplier: 2, icon: Diamond, desc: 'Higher quality + auto-retry', color: 'blue' },
  { id: 'pro' as const, label: 'Pro', multiplier: 3, icon: Zap, desc: 'Best quality + priority', color: 'amber' },
] as const;

export type GenerationMode = 'standard' | 'hd' | 'pro';

interface PreGenerationSheetProps {
  hairstyleName: string;
  hairstyleId?: string;
  creditCost: number;
  userCredits: number;
  isPro: boolean;
  isAuthenticated: boolean;
  onConfirm: (mode: GenerationMode) => void;
  onCancel: () => void;
  onBuyCredits: () => void;
}

export const PreGenerationSheet: React.FC<PreGenerationSheetProps> = ({
  hairstyleName,
  hairstyleId,
  creditCost,
  userCredits,
  isPro,
  isAuthenticated,
  onConfirm,
  onCancel,
  onBuyCredits,
}) => {
  // Default to Standard (cheapest) so free-credit users can complete a first try-on.
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('standard');
  const [contextNotes, setContextNotes] = useState<StyleContextNote[]>([]);
  const modeConfig = GENERATION_MODES.find(m => m.id === selectedMode)!;
  const modeCost = Math.ceil(creditCost * modeConfig.multiplier);
  const hasEnoughCredits = userCredits >= modeCost;
  const creditsAfter = Math.max(0, userCredits - modeCost);

  // G2: Fetch style context notes
  useEffect(() => {
    if (hairstyleId) {
      apiService.getStyleContextNotes(hairstyleId).then(res => {
        if (res.success && res.data.notes.length > 0) {
          setContextNotes(res.data.notes);
        }
      });
    }
  }, [hairstyleId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pregensheet-title">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slide-up safe-area-bottom">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Before you generate</p>
              <h3 id="pregensheet-title" className="text-lg font-bold text-gray-900 truncate max-w-[260px]">{hairstyleName}</h3>
            </div>
            <button onClick={onCancel} aria-label="Close" className="p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* G2: Style context notes */}
          {contextNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {contextNotes.slice(0, 3).map((note, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full text-[11px] text-gray-600 border border-gray-100">
                  <span>{note.icon}</span>
                  {note.text}
                </span>
              ))}
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center gap-1 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-bold text-gray-900">{modeCost}</span>
              <span className="text-[10px] text-gray-500">Credit cost</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold text-gray-900">15-30s</span>
              <span className="text-[10px] text-gray-500">Estimated time</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <modeConfig.icon className={`w-5 h-5 ${selectedMode === 'pro' ? 'text-amber-500' : selectedMode === 'hd' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-sm font-bold text-gray-900">{modeConfig.label}</span>
              <span className="text-[10px] text-gray-500">{modeConfig.desc}</span>
            </div>
          </div>

          {/* A4: Generation mode selector */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Quality mode</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Quality mode">
              {GENERATION_MODES.map((mode) => {
                const cost = Math.ceil(creditCost * mode.multiplier);
                const isSelected = selectedMode === mode.id;
                const canAfford = userCredits >= cost;
                return (
                  <button
                    key={mode.id}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedMode(mode.id)}
                    disabled={!canAfford}
                    className={`relative flex flex-col items-center gap-0.5 p-2.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : canAfford
                          ? 'border-gray-200 bg-white hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <mode.icon className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{mode.label}</span>
                    <span className="text-[10px] text-gray-500">{cost} cr</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credit balance */}
          <div className={`flex items-center justify-between p-3 rounded-xl mb-3 ${
            hasEnoughCredits ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
          }`}>
            <div className="flex items-center gap-2">
              <Coins className={`w-4 h-4 ${hasEnoughCredits ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-sm text-gray-700">Your balance</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${hasEnoughCredits ? 'text-emerald-700' : 'text-red-700'}`}>
                {userCredits} credit{userCredits !== 1 ? 's' : ''}
              </span>
              {hasEnoughCredits && (
                <span className="text-xs text-gray-500 ml-1">→ {creditsAfter} after</span>
              )}
            </div>
          </div>

          {/* Refund reassurance */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-xs text-gray-500">
              {selectedMode !== 'standard'
                ? 'Auto-retry on low quality. Refund if generation fails completely.'
                : 'If generation fails, your credit is automatically refunded.'}
            </span>
          </div>

          {/* Action buttons */}
          {hasEnoughCredits ? (
            <Button
              onClick={() => onConfirm(selectedMode)}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg text-base"
            >
              Generate for {modeCost} credit{modeCost !== 1 ? 's' : ''}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-800 font-medium">
                  You need {modeCost - userCredits} more credit{modeCost - userCredits !== 1 ? 's' : ''} to generate this style.
                </span>
              </div>
              <Button
                onClick={onBuyCredits}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg text-base"
              >
                Get More Credits
              </Button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-slide-up { animation: none; }
          }
          .safe-area-bottom {
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }
        `}</style>
      </div>
    </div>
  );
};

export default PreGenerationSheet;
