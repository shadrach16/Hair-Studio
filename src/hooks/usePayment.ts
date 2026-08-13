// hooks/usePayment.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { apiService } from '@/lib/api';
import { EMPTY_PRICING_CATALOG, type PricingCatalog } from '@/lib/pricingSystem';

// Import RevenueCat
import {
    Purchases,
    LOG_LEVEL,
    type PurchasesPackage,
    type Offering
} from '@revenuecat/purchases-capacitor';




export function usePayment() {
    const { user, refreshUser } = useAuth();
    const [storeReady, setStoreReady] = useState(false);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<PricingCatalog>(EMPTY_PRICING_CATALOG);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);
    const [rcDebugInfo, setRcDebugInfo] = useState<string>('initializing...');
    const storeInitialized = useRef(false);
    const rcIdentifiedFor = useRef<string | null>(null);

    const loadCatalog = useCallback(async () => {
        setIsCatalogLoading(true);

        try {
            const result = await apiService.getPricingCatalog();

            if (result.success) {
                setCatalog(result.data);
            } else {
                toast.error('Unable to load pricing catalog.');
            }
        } catch (error) {
            console.error('[Pricing] Failed to load catalog:', error);
            toast.error('Unable to load pricing options.');
        } finally {
            setIsCatalogLoading(false);
        }
    }, []);

 

    // --- Store Setup Function ---
    const initializeRevenueCat = useCallback(async () => {
        if (storeInitialized.current) {
            console.log("[RC] Already initialized.");
            return;
        }
        storeInitialized.current = true;

        if (!Capacitor.isNativePlatform()) {
            console.warn("[RC] RevenueCat purchases only available on native platforms.");
            setRcDebugInfo('non-native platform');
            setStoreReady(true);
            return;
        }


        try {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

            await Purchases.configure({ 
                apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
                ...(user?.id ? { appUserID: user.id } : {})
            });

            setRcDebugInfo('configured, fetching offerings...');
            console.log("[RC] Configured successfully");
            Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
                console.log("[RC] CustomerInfo updated, refreshing user data...");
                await refreshUser();
            });

            // 4. Load products ("Offerings" in RevenueCat)
            console.log("[RC] Fetching offerings...");
            const offerings = await Purchases.getOfferings();
            
            const allOfferingIds = offerings.all ? Object.keys(offerings.all) : [];
            const allPackageCount = offerings.all 
                ? Object.values(offerings.all).reduce((sum: number, o: any) => sum + (o.availablePackages?.length || 0), 0) 
                : 0;

            if (offerings.current) {
                const pkgIds = offerings.current.availablePackages.map((p: PurchasesPackage) => p.product.identifier);
                setRcDebugInfo(`OK: ${pkgIds.length} pkgs [${pkgIds.join(', ')}] | offerings: [${allOfferingIds.join(', ')}]`);
                console.log("[RC] Offerings loaded:", JSON.stringify(offerings.current));
                setPackages(offerings.current.availablePackages);
                setStoreReady(true);
            } else {
                setRcDebugInfo(`no current offering. all offerings: [${allOfferingIds.join(', ')}] (${allPackageCount} total pkgs)`);
                console.warn("[RC] No current offering found. All offerings:", JSON.stringify(offerings.all));
                toast.error("No products could be loaded at this time.");
                setStoreReady(true); // Still "ready", just no products
            }
        } catch (error: any) {
            const errMsg = error?.message || error?.code || String(error);
            setRcDebugInfo(`ERROR: ${errMsg}`);
            console.error("[RC] Setup failed:", error);
            // toast.error(`Store setup failed: ${error.message || 'Unknown error'}`);
            storeInitialized.current = false;
        }
    }, [refreshUser, user?.id]);

    // --- useEffect to call initializeRevenueCat ---
    useEffect(() => {
        // Capacitor plugins handle device ready, so we can call directly.
        initializeRevenueCat();
    }, [initializeRevenueCat]);

    // --- Identify the RevenueCat user to our Mongo _id (CRITICAL for the webhook /
    //     REST verification to find the user). configure() only sets appUserID if a
    //     user existed at init time; this aliases once auth resolves, and on every
    //     account switch. Without this, purchases land on anonymous RC IDs and the
    //     backend's User.findById(app_user_id) fails, so credits are never granted.
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        if (!storeReady) return; // ensure configure() ran first

        const uid = user?.id;

        // Signed out: drop the alias so the next user doesn't inherit this identity.
        if (!uid) {
            if (rcIdentifiedFor.current) {
                Purchases.logOut().catch((e) => console.warn('[RC] logOut failed', e));
                rcIdentifiedFor.current = null;
            }
            return;
        }

        if (rcIdentifiedFor.current === uid) return;

        (async () => {
            try {
                await Purchases.logIn({ appUserID: uid });
                rcIdentifiedFor.current = uid;
                console.log('[RC] Identified as', uid);
            } catch (e) {
                console.error('[RC] logIn failed', e);
            }
        })();
    }, [user?.id, storeReady]);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    // --- buyCredits Function (now uses RevenueCat) ---
    const buyCredits = useCallback(async (productId: string) => {
        if (!storeReady) {
            toast.error("Store is not ready, please wait.");
            return;
        }

        if (isProcessing) {
            toast.info("Another purchase is processing.");
            return;
        }

        // Find the RevenueCat Package from the product ID
        const packToBuy = packages.find(p => p.product.identifier === productId);

        if (!packToBuy) {
            toast.error(`Product "${productId}" not found.`);
            console.warn("RC Package not found for product ID:", productId);
            return;
        }

        console.log(`[RC] Initiating order for ${productId}...`);
        setIsProcessing(productId);

        try {
            // This one function handles purchase AND verification
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage({
                aPackage: packToBuy,
            });

            console.log("[RC] Purchase successful:", productIdentifier);
            toast.success("Purchase successful!", {
                description: "Adding your credits..."
            });

            // Webhook-independent grant: have the backend verify this purchase against
            // RevenueCat's REST API and credit the account (idempotent). This makes
            // credit delivery work even if the RC->backend webhook is slow or unset.
            try {
                const sync = await apiService.syncPurchase(productIdentifier);
                if (!sync?.success) {
                    console.warn("[RC] syncPurchase pending/failed:", sync?.message);
                }
            } catch (e) {
                console.error("[RC] syncPurchase failed", e);
            }

            // Refresh local user (also covered by the CustomerInfo listener + webhook).
            await refreshUser();

        } catch (err: any) {
            if (err.userCancelled) {
                console.log("[RC] Purchase cancelled by user.");
            } else {
                console.error(`[RC] Order initiation failed for ${productId}:`, err);
                toast.error(`Purchase failed: ${err.message || 'Store error'}`);
            }
        } finally {
            setIsProcessing(null); // Clear on success, error, or cancel
        }
    }, [storeReady, isProcessing, packages, refreshUser]);

    const getSubscriptionStatus = useCallback(async () => {
        return apiService.getSubscriptionStatus();
    }, []);

    const cancelSubscription = useCallback(async () => {
        const result = await apiService.cancelSubscription();
        if (result.success) {
            await refreshUser();
        }
        return result;
    }, [refreshUser]);

    const restoreSubscription = useCallback(async () => {
        const result = await apiService.restoreSubscription();
        if (result.success) {
            await refreshUser();
        }
        return result;
    }, [refreshUser]);

    // C3: Buy a subscription via RevenueCat (native) or sync after purchase
    const buySubscription = useCallback(async (productId: string) => {
        if (!storeReady) {
            toast.error("Store is not ready, please wait.");
            return;
        }

        if (isProcessing) {
            toast.info("Another purchase is processing.");
            return;
        }

        const packToBuy = packages.find(p => p.product.identifier === productId);
        if (!packToBuy) {
            toast.error(`Subscription "${productId}" not found.`);
            return;
        }

        setIsProcessing(productId);

        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage({
                aPackage: packToBuy,
            });

            console.log("[RC] Subscription purchase successful:", productIdentifier);
            toast.success("Subscription activated!", {
                description: "Your credits will be refreshed monthly."
            });

            // Sync subscription state with backend
            await apiService.syncSubscription({
                planId: productIdentifier,
                provider: 'revenuecat'
            });

            await refreshUser();
        } catch (err: any) {
            if (err.userCancelled) {
                console.log("[RC] Subscription purchase cancelled by user.");
            } else {
                console.error(`[RC] Subscription purchase failed:`, err);
                toast.error(`Subscription failed: ${err.message || 'Store error'}`);
            }
        } finally {
            setIsProcessing(null);
        }
    }, [storeReady, isProcessing, packages, refreshUser]);

    // C3: Restore purchases from RevenueCat (for reinstalls)
    const restorePurchases = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) {
            toast.info("Restore purchases is only available on mobile devices.");
            return null;
        }

        try {
            const { customerInfo } = await Purchases.restorePurchases();
            console.log("[RC] Restore purchases result:", JSON.stringify(customerInfo));

            // Subscriptions first — these live in entitlements.active.
            const activeEntitlements = customerInfo.entitlements?.active;
            let restoredSubscription = false;
            if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
                const firstEntitlement = Object.values(activeEntitlements)[0] as any;
                if (firstEntitlement?.productIdentifier) {
                    await apiService.syncSubscription({
                        planId: firstEntitlement.productIdentifier,
                        provider: 'revenuecat',
                        providerSubscriptionId: firstEntitlement.originalPurchaseDate
                    });
                }
                restoredSubscription = true;
            }

            // Credit packs are CONSUMABLES: they never appear in
            // entitlements.active, so checking only the block above told every
            // pack buyer "No active purchases found to restore" — which is most
            // of the paying customers, since packs are where the revenue is.
            // The backend sweeps the RevenueCat record and grants idempotently.
            const packs = await apiService.restorePurchases();
            const grantedCredits = packs?.data?.grantedCredits || 0;

            await refreshUser();

            if (grantedCredits > 0) {
                toast.success(`Restored ${grantedCredits} credits`);
                return { restored: true, grantedCredits };
            }
            if (restoredSubscription) {
                toast.success("Purchases restored successfully!");
                return { restored: true };
            }

            toast.info("Nothing to restore on this account.");
            return { restored: false };
        } catch (err: any) {
            console.error("[RC] Restore purchases failed:", err);
            toast.error(`Restore failed: ${err.message || 'Unknown error'}`);
            return { restored: false, error: err.message };
        }
    }, [refreshUser]);

    // C3: Change subscription plan
    const changeSubscriptionPlan = useCallback(async (newPlanId: string) => {
        const result = await apiService.changeSubscriptionPlan(newPlanId);
        if (result.success) {
            toast.success(result.message || 'Plan changed successfully');
            await refreshUser();
        } else {
            toast.error(result.message || 'Failed to change plan');
        }
        return result;
    }, [refreshUser]);

    return {
        storeReady: storeReady,
        isCatalogLoading,
        isProcessingProductId: isProcessing,
        buyCredits,
        buySubscription,
        restorePurchases,
        changeSubscriptionPlan,
        userCredits: user?.credits || 0,
        isPro: user?.isPro || false,
        catalog,
        creditPacks: catalog.creditPacks,
        subscriptions: catalog.subscriptions,
        catalogVersion: catalog.version,
        packages: packages, 
        getSubscriptionStatus,
        cancelSubscription,
        restoreSubscription,
        rcDebugInfo,
    };
}