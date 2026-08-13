import React from 'react';
import { X, Coins, Clock, ShieldCheck, ImageOff } from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { tierMeta } from '@/lib/generationTiers';

interface ReadyStateProps {
  selectedPhoto: File;
  selectedHairstyle: any;
  isAuthenticated: boolean;
  onClearPhoto: () => void;
  userCredits?: number;
  isPro?: boolean;
}

// Clear button — frosted pill
const ClearButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md text-white/90 hover:bg-black/30 transition-colors"
    aria-label="Clear photo"
  >
    <X className="w-4 h-4" />
  </button>
);



// Info row below photo when a style is selected
const ReadyToApplyPrompt = ({
  hairstyleName,
  isAuthenticated,
  creditCost,
  isPro,
}: {
  hairstyleName: string;
  isAuthenticated: boolean;
  creditCost: number;
  isPro: boolean;
}) => (
  <div className="px-4 py-3 space-y-2.5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-gray-300 font-medium">Ready to apply</p>
        <h3 className="text-[15px] font-semibold text-gray-900 mt-0.5">{hairstyleName}</h3>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{creditCost} cr</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~20s</span>
        <span className="flex items-center gap-1">
          {isPro ? <ShieldCheck className="w-3 h-3" /> : <ImageOff className="w-3 h-3" />}
          {isPro ? tierMeta('hd').label : tierMeta('standard').label}
        </span>
      </div>
    </div>

    {!isAuthenticated && (
      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
        <p className="text-[13px] text-gray-500">Sign in to generate</p>
        <GoogleSignInButton className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-[12px] px-4 py-2 rounded-lg" />
      </div>
    )}
  </div>
);

export const ReadyState: React.FC<ReadyStateProps> = ({
  selectedPhoto,
  selectedHairstyle,
  isAuthenticated,
  onClearPhoto,
  userCredits = 0,
  isPro = false,
}) => (
  <div className="w-full max-w-lg mx-auto">
    <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-black/[0.04] shadow-sm">
      {/* Photo — 4:5 portrait ratio */}
      <div className="relative aspect-[4/5] w-full">
        <img
          src={URL.createObjectURL(selectedPhoto)}
          alt="Your photo"
          className="w-full h-full object-cover"
        />
        <ClearButton onClick={onClearPhoto} />
      </div>

      {/* Only show info row when a style IS selected */}
      {selectedHairstyle && (
        <ReadyToApplyPrompt
          hairstyleName={selectedHairstyle.name}
          isAuthenticated={isAuthenticated}
          creditCost={selectedHairstyle.price || 1}
          isPro={isPro}
        />
      )}
    </div>
  </div>
);