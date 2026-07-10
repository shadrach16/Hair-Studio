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
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import AppLoader from '@/components/AppLoader';
import { captureAttribution, reportInstallOnce, shouldCheckInstallReferrer, markInstallReferrerChecked } from '@/lib/attribution';
import { readInstallReferrer } from '@/lib/installReferrer';


const queryClient = new QueryClient();

let hasInitialized = false;

const setStatusBarAppearance = async () => {
 if (!Capacitor.isNativePlatform()) {
   console.log('[App Init] Not native platform, skipping status bar setup.');
   return;
 }
 try {
  await StatusBar.show();
  await StatusBar.setBackgroundColor({ color: '#ffffff' });
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setOverlaysWebView({ overlay: false });
  console.log('[App Init] Status Bar appearance set.');
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

const App = () => {
 const [showLoader, setShowLoader] = useState(true);
 const handleLoaderFinish = useCallback(() => setShowLoader(false), []);

 return (
  <AuthProvider>
   <QueryClientProvider client={queryClient}>
    <TooltipProvider>
     <Toaster position="top-center" richColors expand={true} closeButton />
     {showLoader && <AppLoader onFinish={handleLoaderFinish} />}
     {/* 5. Wrap the entire app with HelmetProvider */}
     <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
       <AppRoutes />
      </BrowserRouter>
     </HelmetProvider>
    </TooltipProvider>
   </QueryClientProvider>
  </AuthProvider>
 );
};

export default App;