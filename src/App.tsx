// src/App.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
// 1. Import HelmetProvider
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Index from './pages/Index';
import Analytics from './pages/Analytics';
import LandingPage from './components/LandingPage';
import NotFound from './pages/NotFound';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
import AuthCallback from '@/components/AuthCallback';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Filesystem } from '@capacitor/filesystem';
import { IonApp, setupIonicReact } from '@ionic/react';
import { initStatusBar, registerHardwareBack } from '@/lib/native';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import { captureAttribution, reportInstallOnce, shouldCheckInstallReferrer, markInstallReferrerChecked } from '@/lib/attribution';
import { readInstallReferrer } from '@/lib/installReferrer';


const queryClient = new QueryClient();

// Force the Material Design platform so the app renders identically on every
// device (Ionic otherwise switches to iOS styling on Apple hardware, which
// would fight our own design system).
// hardwareBackButton:false is essential. Ionic installs its own Capacitor
// backButton listener whose default action is to EXIT the app, and it only
// yields to handlers registered through its `ionBackButton` event — which it
// never dispatches here, because that mechanism is driven by IonRouterOutlet
// and this app uses Ionic components standalone with react-router v6.
// Device-traced: our handler decided "close-sheet" and Ionic exited anyway.
// Disabling it leaves registerHardwareBack() (lib/native.ts) in sole control.
setupIonicReact({ mode: 'md', rippleEffect: false, animated: true, hardwareBackButton: false });

let hasInitialized = false;

const setStatusBarAppearance = async () => {
 if (!Capacitor.isNativePlatform()) return;
 try {
  await StatusBar.show();
  await StatusBar.setOverlaysWebView({ overlay: false });
  // One-plane rule (4.2): the status bar is painted the EXACT surface hex so
  // there is no seam between the clock and the chrome bar. Previously this was
  // hardcoded #ffffff, which no longer matches --surface (#FAF8F5) and showed
  // a visible band at the top. initStatusBar also re-applies after ~1.6s to
  // beat the splash-screen/plugin race.
  initStatusBar('light');
 } catch (e) {
   console.error("[App Init] Error setting status bar:", e);
 }
};

const checkAndRequestStoragePermission = async () => {
 if (Capacitor.getPlatform() !== 'android') {
   return true;
 }
 try {
  let status = await Filesystem.checkPermissions();
  if (status.publicStorage !== 'granted') {
   status = await Filesystem.requestPermissions();
   return status.publicStorage === 'granted';
  }
  return true;
 } catch (e) {
  return false;
 }
};

// Run initialization only once
if (!hasInitialized && Capacitor.isNativePlatform()) {
  // Native app shouldn't feel like a web page — flag the root so CSS can disable
  // browser-style text selection / long-press callout (see index.css .cap-native).
  document.documentElement.classList.add('cap-native');
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    SocialLogin.initialize({
       google: {
        webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
       }
    })
    .then(() => console.log("[App Init] SocialLogin initialized successfully."))
    .catch(e => console.error("[App Init] SocialLogin Init Error:", e));
  } else {
    console.warn("[App Init] VITE_GOOGLE_CLIENT_ID not found, SocialLogin not initialized.");
  }
  setStatusBarAppearance();
  checkAndRequestStoragePermission();
  // Android back: close an open sheet -> pop a pushed screen -> minimize at a
  // tab root. Without this, hardware back exits the app from any screen
  // (@ionic/react does not handle this on its own).
  registerHardwareBack();
  hasInitialized = true;
} else {
  console.log(`[App Init] Skipping native initialization (hasInitialized: ${hasInitialized}, isNative: ${Capacitor.isNativePlatform()})`);
}

// 2. SEO Helper Component (used by pages)
interface SeoProps {
 title: string;
 description: string;
 keywords?: string;
 image?: string;
}

const Seo = ({ title, description, keywords, image }: SeoProps) => (
 <Helmet>
  <title>{title} | Hair Studio AI Try-On</title>
  <meta name="description" content={description} />
  {keywords && <meta name="keywords" content={keywords} />}
  {/* Open Graph / Social Sharing Tags */}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  {image && <meta property="og:image" content={image} />}
  <meta property="twitter:card" content="summary_large_image" />
  {/* Ensure a canonical URL is set if your pages are reachable via multiple routes */}
 </Helmet>
);


// 3. SEO-Wrapped Pages (Assumes LandingPage and Index are the main entry points)

// Wrapper for the Landing Page
const LandingPageWithSeo = () => (
 <>
  <Seo
   title="Download the Ultimate AI Hair Try-On App"
   description="Get the Hair Studio app! Virtually try on haircuts, colors, and styles using advanced AI technology. Find your perfect look before your salon visit."
   keywords="AI hair try-on app, virtual hair studio, hair color changer, haircut simulator, download hair app"
  />
  <LandingPage />
 </>
);

// Wrapper for the Main App (Index) Page
const IndexPageWithSeo = () => (
 <>
  <Seo
   title="Hair Studio AI Try-On - Your New Look Starts Here"
   description="Instantly try on thousands of hairstyles and colors using our hyper-realistic AI try-on tool directly in your browser or app."
   keywords="hair studio, try on hairstyles online, virtual haircut, new hair color ideas, best hair app"
  />
  <Index />
 </>
);

// --- AppRoutes Component (No changes needed inside the effect for SEO) ---
const AppRoutes = () => {
 const { isAuthenticated } = useAuth();
 const navigate = useNavigate();
 const appUrlListenerRef = useRef<any>(null);
 const hasProcessedInitialUrl = useRef(false);
  

 useEffect(() => {
  // Stores referral code if found and user isn't logged in
  const storeReferralCode = (code: string | null | undefined, source: string) => {
    
   if (!code) {
    console.log(`[Referral] No code provided from ${source}.`);
    return;
   }

   // Trim and validate code
   const trimmedCode = code.trim();
   if (!trimmedCode) {
    return;
   }

   if (isAuthenticated) {
    return;
   }

   const existingCode = localStorage.getItem('referral_code');
   if (existingCode) {
    return;
   }

   localStorage.setItem('referral_code', trimmedCode);
  };

  // Function to handle deep link URL processing (omitted parseReferrerCode as it seems unused)
  const handleAppLink = (urlString: string, source: string) => {
    
   if (!urlString) {
    return;
   }

   try {
    const url = new URL(urlString);
    const refCode = url.searchParams.get('ref');
    storeReferralCode(refCode, `${source} URL`);
    // Capture UTM/campaign(video)/content(artifact) and stash the pending target.
    captureAttribution(urlString, 'deep_link');
    const path = url.pathname;
    // Network deep link: https://<host>/go?content=<id>... or hairstudio://go?...
    const isGoLink = path === '/go' || path.startsWith('/go') || url.host === 'go';
    if (isGoLink) {
     // Pending hairstyle target + ref are already persisted; send the user to the
     // studio, which routes to the referenced look and shows the contextual paywall.
     navigate('/');
    } else if (path === '/profile') {
     navigate('/profile');
    } else if (path.startsWith('/product/')) {
     const productId = path.split('/')[2];
     navigate(`/product/${productId}`);
    } else if (path && path !== '/' && path !== '/download') {
     navigate(path);
    }
   } catch (e) {
    console.error(`[DeepLink] Error parsing URL from ${source}:`, e);
   }
  };

  if (Capacitor.isNativePlatform()) {
   const platform = Capacitor.getPlatform();
   if (platform === 'android') {
    // Logic specific to Android deeplinks, if any, would go here
   }

   const urlListener = CapacitorApp.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    handleAppLink(event.url, 'appUrlOpen listener');
   });
    
   appUrlListenerRef.current = urlListener;

   // C) Check initial URL for cold starts via deep link
   if (!hasProcessedInitialUrl.current) {
    CapacitorApp.getLaunchUrl()
     .then(launchUrl => {
      if (launchUrl && launchUrl.url) {
       handleAppLink(launchUrl.url, 'getLaunchUrl');
       hasProcessedInitialUrl.current = true;
      } else {
       console.log('[AppRoutes Effect] App not launched with a URL.');
      }
     })
     .catch(e => console.error("[AppRoutes Effect] Error getting launch URL:", e));
   }

   // D) First-open attribution: read the Play install referrer (DEFERRED deep
   //    linking — survives the install), then report install_attributed once.
   (async () => {
    try {
     if (shouldCheckInstallReferrer()) {
      const referrer = await readInstallReferrer();
      markInstallReferrerChecked();
      if (referrer) captureAttribution(referrer, 'install_referrer');
      await reportInstallOnce(referrer ? { rawReferrer: referrer, method: 'install_referrer' } : undefined);
     } else {
      await reportInstallOnce();
     }
    } catch (e) {
     console.warn('[Attribution] first-open report failed', e);
    }
   })();

  } else {
   try {
    const currentUrl = new URL(window.location.href);
    const refCode = currentUrl.searchParams.get('ref');
    // Capture UTM/campaign(video)/content(artifact) from the web URL.
    captureAttribution(window.location.href, 'first_launch_url');

    if (refCode) {
     storeReferralCode(refCode, 'Web URL');
     // Clean URL without reloading page
     const cleanUrl = new URL(window.location.href);
     cleanUrl.searchParams.delete('ref');
     window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
    } else {
     console.log('[AppRoutes Effect] No refCode found in web URL.');
    }
    // Report the (web) install/visit once.
    reportInstallOnce();
   } catch (e) {
    console.error('[AppRoutes Effect] Error parsing web URL:', e);
   }
  }

  // Cleanup listener when component unmounts
  return () => {
   if (appUrlListenerRef.current) {
    appUrlListenerRef.current.remove();
    appUrlListenerRef.current = null;
   }
  };

 }, [isAuthenticated, navigate]);

 return (
  <Routes>
   {/* 4. Use the SEO-wrapped components in the routes */}
   <Route path="/" element={<IndexPageWithSeo />} />
   <Route path="/download" element={<LandingPageWithSeo />} />
   <Route path="/auth/callback" element={<AuthCallback />} />
   <Route path="/analytics" element={<Analytics />} />
   <Route path="*" element={<NotFound />} />
  </Routes>
 );
};

// The in-app AppLoader was deleted here, not replaced. It was a SECOND brand
// screen — pure white (breaking the one-plane rule between a paper splash and a
// paper feed), showing the retired four-European-faces badge fetched from
// Cloudinary at boot, a wordmark set in Fascinate Inline (a face plan §1.1 kills,
// and not bundled, so it fell back to system sans), the words "AI Try-On Studio",
// and a 3-second fixed timer gated on nothing. Worse, being `fixed inset-0
// z-[100]` it covered the #boot beat in index.html — the Fraunces wordmark that
// exists precisely because this OEM will not draw the native splash monogram — so
// the one designed brand beat in the product was the only one nobody could see.
// One beat now: the native splash hands over to #boot on the same surface colour.
const App = () => {
 return (
  // IonApp provides the platform context Ionic components (sheet modals, native
  // back-button handling) need. We use Ionic components standalone and keep
  // react-router v6 — @ionic/react-router requires router v5, and rewriting
  // routing app-wide is not worth the regression risk.
  <IonApp className="hs-ion-root">
   <AuthProvider>
    <QueryClientProvider client={queryClient}>
     <TooltipProvider>
      <Toaster position="top-center" richColors expand={true} closeButton />
      {/* 5. Wrap the entire app with HelmetProvider */}
      <HelmetProvider>
       <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
       </BrowserRouter>
      </HelmetProvider>
     </TooltipProvider>
    </QueryClientProvider>
   </AuthProvider>
  </IonApp>
 );
};

export default App;