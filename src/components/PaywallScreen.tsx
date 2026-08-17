// components/PaywallScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { apiService } from '@/lib/api';
import { usePayment } from '../hooks/usePayment'; 
import { Capacitor } from '@capacitor/core';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Zap, Loader2, RotateCcw, Coins } from 'lucide-react'; 
import type { CreditPack, SubscriptionPlan } from '@/lib/pricingSystem';

// Tier visual config
const TIER_STYLES: Record<string, { emoji: string; accent: string; bg: string }> = {
  credits3:    { emoji: '🎯', accent: 'text-gray-600', bg: 'bg-gray-50' },
  credits10:   { emoji: '⚡', accent: 'text-blue-600', bg: 'bg-blue-50' },
  credits25:   { emoji: '🔥', accent: 'text-orange-600', bg: 'bg-orange-50' },
  credits100:  { emoji: '💎', accent: 'text-violet-600', bg: 'bg-violet-50' },
  credits250:  { emoji: '👑', accent: 'text-amber-600', bg: 'bg-amber-50' },
  unlimited:   { emoji: '∞', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
};
const DEFAULT_TIER = { emoji: '🪙', accent: 'text-gray-600', bg: 'bg-gray-50' };

// Google Play returns subscription product identifiers as "subscriptionId:basePlanId"
// (e.g. "plus_annual:plus-annual-1y"). Match on the subscriptionId part so the catalog
// can keep plain ids ("plus_annual"). One-time credit packs have no ":" so they still
// match exactly.
const productMatches = (identifier: string, productId?: string): boolean =>
    !!productId && (identifier === productId || identifier.split(':')[0] === productId);


// --- Main Paywall Screen Component ---


export const PaywallScreen: React.FC<{ onClose: () => void; context?: any }> = ({ onClose, context }) => {
    const { 
        storeReady, 
        isCatalogLoading,
        isProcessingProductId, 
        buyCredits,
        buySubscription,
        restorePurchases,
        packages,
        creditPacks,
        catalog,
        subscriptions,
        restoreSubscription,
        isPro,
        rcDebugInfo,
    } = usePayment();

    // Default to Credit Packs (cheap entry point) — leading with annual plans scared users off.
    const [isRestoring, setIsRestoring] = useState(false);

    // Track paywall view on mount
    useEffect(() => {
        apiService.trackEvent('paywall_viewed', {
            source: 'credits_modal',
            packagesAvailable: packages.length,
            // Was `tab: activeTab`. There is one surface now, so the dimension
            // would only ever record 'credits'.
            surface: 'top_up'
        });
    }, [packages.length]);

    const paywallItems = creditPacks
        .filter((catalogPack) => catalogPack.storefronts.revenueCat?.productId)
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((catalogPack) => {
            const rcPackage = packages.find(
                (candidate) => productMatches(candidate.product.identifier, catalogPack.storefronts.revenueCat?.productId)
            );
            return rcPackage ? { catalogPack, rcPackage } : null;
        })
        .filter((item): item is { catalogPack: CreditPack; rcPackage: PurchasesPackage } => item !== null);

    // Build subscription items matched to RevenueCat packages

    if (!storeReady || isCatalogLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 mr-2.5 animate-spin text-gray-300" />
                <p className="text-[13px] text-gray-400">Loading payment options...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Contextual banner when arriving via a deep link to a specific look */}
            {context?.name && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                    {context.thumbnail && (
                        <img src={context.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <p className="text-[13px] text-gray-700 leading-snug">
                        Unlock <span className="font-semibold text-gray-900">{context.name}</span> — pick a pack to try it on your photo.
                    </p>
                </div>
            )}
            {/* The Plans tab is gone. TierChooser above this component already
                sells Free / Plus / Studio, so the tab bar offered a SECOND,
                different subscription surface one scroll below the first, with a
                different product set and different language. This screen now does
                one job: top-up packs. */}

            {/* Content */}
            <div aria-label="Top-up packs">
                    <div className="space-y-2">
                        {paywallItems.length > 0 ? (
                            paywallItems.map((item) => {
                                const tier = TIER_STYLES[item.catalogPack.id] || DEFAULT_TIER;
                                const isPopular = item.catalogPack.popular;
                                const isProcessing = isProcessingProductId === item.rcPackage.product.identifier;

                                return (
                                    <button
                                        key={item.catalogPack.id}
                                        onClick={() => buyCredits(item.rcPackage.product.identifier)}
                                        disabled={!!isProcessingProductId}
                                        className={`
                                            relative flex items-center gap-3 w-full p-3 rounded-2xl text-left transition-all duration-150
                                            ${isPopular
                                                ? 'bg-[#1a1a1a] ring-1 ring-black/5'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                            }
                                            ${isProcessingProductId ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}
                                        `}
                                    >
                                        {/* Popular badge */}
                                        {isPopular && (
                                            <span className="absolute -top-2 left-4 text-[10px] font-bold tracking-wide uppercase bg-amber-400 text-gray-900 px-2 py-0.5 rounded-full">
                                                Best Value
                                            </span>
                                        )}

                                        {/* Emoji icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isPopular ? 'bg-white/10' : tier.bg}`}>
                                            {tier.emoji}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[14px] font-semibold leading-tight ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                                                {item.catalogPack.name}
                                            </p>
                                            <p className={`text-[12px] mt-0.5 leading-snug ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {item.catalogPack.displayLabel}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div className={`
                                            flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all
                                            ${isProcessing
                                                ? 'bg-gray-200 text-gray-500'
                                                : isPopular
                                                    ? 'bg-white text-gray-900'
                                                    : 'bg-[#1a1a1a] text-white'
                                            }
                                        `}>
                                            {isProcessing
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : item.rcPackage.product.priceString
                                            }
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                    <Coins className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="text-[13px] text-gray-400">No credit packs available at this time.</p>
                            </div>
                        )}
                    </div>
            </div>

            {/* Restore + Footer */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
                {isPro && (
                    <button
                        onClick={() => {
                            if (Capacitor.getPlatform() === 'android') {
                                window.open('https://play.google.com/store/account/subscriptions', '_blank');
                            } else if (Capacitor.getPlatform() === 'ios') {
                                window.open('https://apps.apple.com/account/subscriptions', '_blank');
                            }
                        }}
                        className="text-[11px] text-emerald-600 hover:text-emerald-500 transition-colors font-medium"
                    >
                        Manage Your Subscription
                    </button>
                )}
                <button
                    onClick={async () => {
                        setIsRestoring(true);
                        try {
                            await (restorePurchases ? restorePurchases() : restoreSubscription());
                        } finally {
                            setIsRestoring(false);
                        }
                    }}
                    disabled={isRestoring}
                    className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                    {isRestoring ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <RotateCcw className="w-3 h-3" />
                    )}
                    Restore Purchases
                </button>
                <div className="flex justify-center space-x-4 text-[10px] text-gray-300">
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">Terms</a>
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">Privacy</a>
                </div>
                {/* Temporary debug info */}
                <p className="text-[8px] text-gray-300 text-center px-2 break-all">
                    RC: {rcDebugInfo} | catalog: {catalog.subscriptions.length}s/{catalog.creditPacks.length}c | pkgs: {packages.length}
                </p>
            </div>
        </div>
    );
};