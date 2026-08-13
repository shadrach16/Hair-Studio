// PricingModal.tsx — Redesigned purchase paywall

import React, { useState } from 'react';
import { PaywallScreen } from '@/components/PaywallScreen';
import { WebPaywallScreen } from '@/components/WebPaywallScreen';
import { useAuth } from '@/hooks/useAuth';
import { Coins, X, ShieldCheck, Gift, ChevronRight } from 'lucide-react';
import AuthModal from './AuthModal';
import { cn } from '@/lib/utils';
import { TierChooser } from '@/components/PaywallSheet';
import { BASE_GENERATION_COST } from '@/lib/generationTiers';
import { usePayment } from '@/hooks/usePayment';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';

const triggerHapticFeedback = async (style: ImpactStyle) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  } catch (_) {}
};

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRewards?: () => void; // C4: Bridge to rewards center
  context?: any; // deep-linked hairstyle for a contextual paywall banner
}

export default function PricingModal({ isOpen, onClose, onOpenRewards, context }: PricingModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { buySubscription } = usePayment();

  // Credits are still the live currency until tier enforcement is switched on.
  // The UI stops SAYING "credits" — it reports what the balance buys, at the
  // Preview rate, which is the same conversion LooksChip uses so the header and
  // this sheet can never disagree.
  const looksLeft = Math.floor(Number(user?.credits || 0) / BASE_GENERATION_COST);
  const currentTier = (user as any)?.entitlement?.tier || 'free';

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                triggerHapticFeedback(ImpactStyle.Light);
                onClose();
              }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 350 }}
              className={cn(
                'fixed z-50 bg-white flex flex-col overflow-hidden',
                'inset-x-0 bottom-0 max-h-[90vh] rounded-t-[24px]',
                'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2',
                'lg:w-full lg:max-w-lg lg:max-h-[85vh] lg:rounded-[24px]',
              )}
            >
              {/* ── Handle + Header ───────────────────────── */}
              <div className="flex-shrink-0">
                <div className="flex justify-center pt-2 pb-0.5">
                  <div className="w-8 h-[3px] rounded-full bg-gray-200" />
                </div>

                <div className="flex items-center justify-between px-5 py-3">
                  {/* Was "Get Credits" — a title that describes a refill, not a
                      product. The sheet now leads with the tiers. */}
                  <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">
                    Your plan
                  </h2>
                  <button
                    onClick={() => {
                      triggerHapticFeedback(ImpactStyle.Light);
                      onClose();
                    }}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Balance pill */}
                {isAuthenticated && (
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <Coins className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 leading-none">Left to use</p>
                        <p className="text-[16px] font-bold text-gray-900 leading-tight tabular-nums">
                          {looksLeft} <span className="text-[12px] font-medium text-gray-400">
                            {looksLeft === 1 ? 'look' : 'looks'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Packs ────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                {/* Tiers first (plan 7.4). Packs stay below because they are the
                    only thing this app has ever actually sold, and the over-cap
                    moment is exactly when someone wants one — but they no longer
                    lead. */}
                <TierChooser
                  currentTier={currentTier}
                  onSubscribe={async (productId) => {
                    await buySubscription(productId);
                  }}
                />

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-gray-100" />
                  <span className="text-[11px] uppercase tracking-wider text-gray-400">
                    Or top up
                  </span>
                  <span className="h-px flex-1 bg-gray-100" />
                </div>

                {Capacitor.isNativePlatform() ? (
                  <PaywallScreen onClose={onClose} context={context} />
                ) : (
                  <WebPaywallScreen onClose={onClose} userId={user?.id} />
                )}
              </div>

              {/* ── Footer ───────────────────────────────── */}
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 space-y-2.5">
                {onOpenRewards && (
                  <button
                    onClick={() => {
                      triggerHapticFeedback(ImpactStyle.Light);
                      onClose();
                      onOpenRewards();
                    }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-gray-500" />
                      <span className="text-[13px] font-medium text-gray-600">Earn free credits</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                )}
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <p className="text-[10px] text-gray-300">
                    Secure payment · 30-day guarantee · Credits never expire
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign in to Continue"
        description="Create your account to get more credits and access premium features."
        showProBenefits={false}
      />
    </>
  );
}
