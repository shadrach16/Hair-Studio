// PricingModal.tsx — Redesigned purchase paywall

import React, { useState } from 'react';
import { PaywallScreen } from '@/components/PaywallScreen';
import { WebPaywallScreen } from '@/components/WebPaywallScreen';
import { useAuth } from '@/hooks/useAuth';
import { IonIcon } from '@ionic/react';
import {
  closeOutline, giftOutline, chevronForwardOutline, lockClosedOutline, sparklesOutline,
} from 'ionicons/icons';
import AuthModal from './AuthModal';
import { cn } from '@/lib/utils';
import { TierChooser } from '@/components/PaywallSheet';
import { TIERS, productMatches } from '@/lib/tiers';
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
  const { buySubscription, packages } = usePayment();

  // What the store will really charge, taken from the live offering rather than
  // from a literal in tiers.ts (Walk 4: the sheet quoted "$3.99/mo" to a handset
  // billing in naira, and offered a product Play had never heard of). On web
  // there is no store, so this stays undefined and the plan price shows.
  const storePrices = React.useMemo(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const prices: Record<string, string> = {};
    for (const t of TIERS) {
      if (!t.productId) continue;
      const pkg = packages.find((p) => productMatches(p.product.identifier, t.productId));
      if (pkg) prices[t.productId] = pkg.product.priceString;
    }
    return prices;
  }, [packages]);

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
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 350 }}
              className={cn(
                'fixed z-50 flex flex-col overflow-hidden bg-surface-2',
                'inset-x-0 bottom-0 max-h-[92vh] rounded-t-[28px]',
                'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2',
                'lg:w-full lg:max-w-lg lg:max-h-[88vh] lg:rounded-[28px]',
              )}
            >
              {/* ── Handle + Header ───────────────────────── */}
              <div className="flex-shrink-0">
                <div className="flex justify-center pb-0.5 pt-3">
                  <div className="h-1 w-9 rounded-full bg-hairline" />
                </div>

                <div className="flex items-center justify-end px-5 pt-2">
                  <button
                    onClick={() => {
                      triggerHapticFeedback(ImpactStyle.Light);
                      onClose();
                    }}
                    aria-label="Close"
                    className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-3 active:scale-95"
                  >
                    <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
                  </button>
                </div>

                {/* Balance pill */}
                {isAuthenticated && (
                  <div className="px-5 pb-1 text-center">
                    <p className="font-display text-[30px] leading-none text-ink">{looksLeft}</p>
                    <p className="mt-1 text-[13px] text-ink-2">
                      {looksLeft === 1 ? 'look left' : 'looks left'}
                    </p>
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
                  storePrices={storePrices}
                  onSubscribe={async (productId) => {
                    await buySubscription(productId);
                  }}
                />

                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-hairline" />
                  <span className="text-[11px] uppercase tracking-[0.12em] text-ink-3">
                    Or top up
                  </span>
                  <span className="h-px flex-1 bg-hairline" />
                </div>

                {Capacitor.isNativePlatform() ? (
                  <PaywallScreen onClose={onClose} context={context} />
                ) : (
                  <WebPaywallScreen onClose={onClose} userId={user?.id} />
                )}
              </div>

              {/* ── Footer ───────────────────────────────── */}
              <div className="flex-shrink-0 space-y-2.5 border-t border-hairline px-5 py-3">
                {onOpenRewards && (
                  <button
                    onClick={() => {
                      triggerHapticFeedback(ImpactStyle.Light);
                      onClose();
                      onOpenRewards();
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-surface px-3.5 py-3 transition-colors active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2">
                      <IonIcon icon={giftOutline} style={{ fontSize: 17 }} className="text-brass" />
                      <span className="text-[14px] text-ink">Invite friends</span>
                    </div>
                    <IonIcon icon={chevronForwardOutline} style={{ fontSize: 15 }} className="text-ink-3" />
                  </button>
                )}
                {/* "30-day guarantee" was here and nothing in the app or the
                    backend implemented it — purchases go through Google Play,
                    whose refund window is Google's and is not thirty days. The
                    app's own copy rules forbid exactly this (aiNudgeService:
                    "no fake discounts, no guarantees"). What is left is true:
                    Play handles the payment, and balances do not expire. */}
                <div className="flex items-center justify-center gap-1.5">
                  <IonIcon icon={lockClosedOutline} style={{ fontSize: 12 }} className="shrink-0 text-ink-3" />
                  <p className="text-[11px] text-ink-3">
                    Paid through Google Play · your looks never expire
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
        showProBenefits={false}
      />
    </>
  );
}
