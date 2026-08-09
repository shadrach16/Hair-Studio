// StyleDetailSheet.tsx — Bottom sheet for hairstyle detail + "Try This Style" CTA
// Opens when user taps any style card from the home discovery screen

import React, { useEffect, useState } from 'react';
import { X, Coins, Clock, ShieldCheck, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Hairstyle } from '@/lib/api';
import { apiService, type StyleContextNote } from '@/lib/api';
import { BASE_GENERATION_COST } from '@/lib/generationTiers';
import { cn } from '@/lib/utils';

interface StyleDetailSheetProps {
  hairstyle: Hairstyle;
  onTryStyle: (hairstyle: Hairstyle) => void;
  onClose: () => void;
  userCredits: number;
  onBuyCredits: () => void;
}

export const StyleDetailSheet: React.FC<StyleDetailSheetProps> = ({
  hairstyle,
  onTryStyle,
  onClose,
  userCredits,
  onBuyCredits,
}) => {
  const [contextNotes, setContextNotes] = useState<StyleContextNote[]>([]);
  const canAfford = userCredits >= hairstyle.price;

  // Derive high-res image from the 200px thumbnail stored in DB
  const heroImage = hairstyle.thumbnail?.includes('/upload/')
    ? hairstyle.thumbnail.replace(
        /\/upload\/c_thumb,w_200,g_face\//,
        '/upload/c_fill,w_600,h_800,g_face,q_auto/'
      )
    : hairstyle.thumbnail;

  useEffect(() => {
    const id = hairstyle._id || hairstyle.id;
    if (id) {
      apiService.getStyleContextNotes(id).then(res => {
        if (res.success && res.data.notes.length > 0) {
          setContextNotes(res.data.notes);
        }
      });
    }
  }, [hairstyle]);

  // Close on backdrop tap
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="style-detail-title"
    >
      <div className="w-full max-w-md max-h-[92vh] bg-white rounded-t-3xl shadow-2xl animate-slide-up safe-area-bottom overflow-y-auto scrollbar-none">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero image */}
        <div className="px-4 pb-3">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={heroImage}
              alt={hairstyle.name}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>

        {/* Info */}
        <div className="px-5 pb-2">
          {/* Title row */}
          <h3 id="style-detail-title" className="text-xl font-bold text-gray-900 mb-1">
            {hairstyle.name}
          </h3>

          {/* Social proof row */}
          <div className="flex items-center gap-3 text-[13px] text-gray-500 mb-3">
            {hairstyle.popularity > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                {hairstyle.popularity.toLocaleString()} try-ons
              </span>
            )}
            {hairstyle.estimatedTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {hairstyle.estimatedTime}
              </span>
            )}
          </div>

          {/* Attribute chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hairstyle.category && (
              <span className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-medium text-gray-600">
                {hairstyle.category}
              </span>
            )}
            {hairstyle.culturalOrigin && (
              <span className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-medium text-gray-600">
                {hairstyle.culturalOrigin}
              </span>
            )}
            {hairstyle.maintenance && (
              <span className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-medium text-gray-600">
                {hairstyle.maintenance} maintenance
              </span>
            )}
            {hairstyle.difficulty && (
              <span className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-medium text-gray-600">
                {hairstyle.difficulty}
              </span>
            )}
          </div>

          {/* Context notes */}
          {contextNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {contextNotes.slice(0, 3).map((note, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full text-[11px] text-amber-700 border border-amber-100"
                >
                  <span>{note.icon}</span>
                  {note.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA section */}
        <div className="px-5 pb-6">
          {/* Always "try it" — never a paywall here. A signed-out visitor has 0
              credits, so the old canAfford check turned this into "Get Credits
              to Try" before they had seen a single result. Credits are checked
              at generation time, where the cost is actually shown. */}
          <Button
            onClick={() => onTryStyle(hairstyle)}
            className="w-full h-13 bg-ink hover:bg-ink/90 text-surface rounded-2xl text-[15px] font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            Try it on me
            <ChevronRight className="w-4.5 h-4.5 ml-1" />
          </Button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Coins className="w-3 h-3 text-brass" />
              {/* Flat per-tier cost. Previously showed hairstyle.price, which no
                  longer matches what the server charges. */}
              {BASE_GENERATION_COST} credits
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3 text-blue-400" />
              ~20s
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Refund if failed
            </span>
          </div>
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
            padding-bottom: max(8px, env(safe-area-inset-bottom));
          }
        `}</style>
      </div>
    </div>
  );
};

export default StyleDetailSheet;
