// src/hooks/useStudioPageLogic.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getPendingTarget, clearPendingTarget, setPendingTarget } from '@/lib/attribution';

// ✅ CAPACITOR IMPORTS
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; // 👈 NEW IMPORT

// ✅ HOOKS & LIB
import { useAuth } from '@/hooks/useAuth';
import { useHairstyles } from '@/hooks/useHairstyles';
import { useGeneration } from '@/hooks/useGeneration';
import { handleSignOut, requiresUpgrade } from '@/lib/auth';
// Assuming apiService, Hairstyle interface, and analyzeHairstyleImage function are imported from here
import { apiService } from '@/lib/api'; 
import { type CreditPack, type SubscriptionPlan } from '@/lib/pricingSystem';
import { shouldShowRatePrompt } from '@/components/RateAppModal';

// --- NEW CONSTANT: Custom Hairstyle Placeholder ---
// This object represents the user's uploaded style in the UI/state.
const CUSTOM_HAIRSTYLE_PLACEHOLDER: any = { // Using 'any' to avoid circular dependency with Hairstyle type
  id: 'user-upload-custom-style', // Unique ID to denote a custom style
  name: 'Custom Upload',
  description: 'AI-analyzed custom style from user image.',
  ai_description: '', // Populated after analysis
  category: 'Custom',
  gender: 'unisex',
  // Placeholder thumbnail that will be replaced by the uploaded image's URI/DataURL
  thumbnail: 'https://via.placeholder.com/100/A0A0A0/FFFFFF?text=Custom', 
  price: 3, // 👈 3 credits deduction for the custom style
  tags: ['custom', 'uploaded'],
  popularity: 0,
  estimatedTime: '60s',
  maintenance: 'medium',
  difficulty: 'medium',
  isActive: true,
};


// --- Extracted Utilities (These should be in lib/native-utils.ts) ---

const triggerHapticFeedback = (style: ImpactStyle) => {
  // Implementation omitted for brevity
};

const checkAndRequestStoragePermission = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== 'android') return true;
  try {
    let status = await Filesystem.checkPermissions();
    if (status.publicStorage !== 'granted') {
      status = await Filesystem.requestPermissions();
      return status.publicStorage === 'granted';
    }
    return true;
  } catch (e) {
    console.error('Storage permission error:', e);
    return false;
  }
};

const registerForPushNotifications = async (navigate: (path: string) => void) => {
  try {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission denied');
      return;
    }
    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token: Token) => {
      try {
        await apiService.updateDeviceToken({ deviceToken: token.value });
      } catch (error) {
        console.error('Failed to send device token:', error);
      }
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      toast.info(notification.title || 'Notification', {
        description: notification.body,
        duration: 5000,
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const data: any = action.notification.data || {};
      // Personalized recommendation tap -> route to that exact style (contextual paywall).
      if (data.hairstyleId) setPendingTarget(String(data.hairstyleId));
      const link = data.link || (data.hairstyleId ? '/' : null);
      if (link) navigate(link);
    });
  } catch (error) {
    console.error('Push notification setup error:', error);
  }
};

// --- TYPES ---
export type StudioState = 'home' | 'discover' | 'upload' | 'ready' | 'processing' | 'results';
export type UploadMode = 'camera' | 'library';
export type MobileShellTab = 'try-on' | 'looks' | 'profile';

const ONBOARDING_KEY = '_hairstudio_onboarding_v1';
const FIRST_GENERATION_KEY = 'hairstudio_first_generation_done';

// --- THE CORE LOGIC HOOK ---

export const useStudioPageLogic = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [studioState, setStudioState] = useState<StudioState>('home');
  const [uploadMode, setUploadMode] = useState<UploadMode>('camera');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<any>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [paywallContext, setPaywallContext] = useState<any>(null); // deep-linked hairstyle -> contextual paywall
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showMobileGallery, setShowMobileGallery] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRewardsCenter, setShowRewardsCenter] = useState(false);
  const [showPreGenerationSheet, setShowPreGenerationSheet] = useState(false);
  const [showCustomStyleSheet, setShowCustomStyleSheet] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showRateApp, setShowRateApp] = useState(false);
  const [customThumbnailPath, setCustomThumbnailPath] = useState();
  const [customImageFile, setCustomImageFile] = useState();
  const [activeShellTab, setActiveShellTab] = useState<MobileShellTab>('try-on');

  // Hooks
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { hairstyles, isLoading: hairstylesLoading } = useHairstyles({ autoLoad: true });
  // Assuming useGeneration.generateHairstyle now handles the custom AI description logic
  const { isGenerating, generationId, generationStatus, progress, generateHairstyle, resetGeneration,handleCustomGenerator } = useGeneration();

  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  const isMobile = useMemo(() => window.innerWidth < 1024, []);

  // Deep-link landing: a tap from "Shad Hair Studio" content routes to the
  // referenced hairstyle and opens the CONTEXTUAL paywall tied to that result.
  useEffect(() => {
    const targetId = getPendingTarget();
    if (!targetId || !hairstyles || hairstyles.length === 0) return;
    const match = hairstyles.find(
      (h: any) => h?._id === targetId || h?.id === targetId || h?.slug === targetId
    );
    clearPendingTarget(); // had our chance to match; don't retry forever
    if (match) {
      setSelectedHairstyle(match);
      setPaywallContext(match);
      setShowPricing(true);
    }
  }, [hairstyles]);

  // Zero-screen onboarding: we deliberately do NOT show a carousel on first
  // launch. Users land straight in the lookbook and learn by doing (a one-line
  // hint on the discovery screen carries the instruction). Classic intro
  // carousels cost a large share of first-opens before any value is seen.
  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  // Push Notifications Effect
  useEffect(() => {
    if (user?.id && isNative) {
      registerForPushNotifications(navigate);
    }
    if (!user?.id) {
      refreshUser();
    }
  }, [user?.id, navigate, refreshUser, isNative]);

  // G3: Auto streak check-in on native app open (silent — no disruptive UI)
  useEffect(() => {
    if (!user?.id || !isNative || user?.isGuest) return;

    const autoCheckIn = async () => {
      try {
        const status = await apiService.getStreakStatus();
        if (status.success && status.data && !status.data.alreadyCheckedInToday) {
          const result = await apiService.checkInStreak();
          if (result.success && result.data) {
            const d = result.data;
            if (d.milestonesHit?.length > 0) {
              toast.success(`🎉 Day ${d.currentStreak} streak! +${d.creditsAwarded} credits`, { duration: 4000 });
              refreshUser();
            } else {
              toast(`🔥 Day ${d.currentStreak} streak!`, { duration: 2500 });
            }
          }
        }
      } catch { /* silent */ }
    };

    // Slight delay to let the app settle after launch
    const timer = setTimeout(autoCheckIn, 3000);
    return () => clearTimeout(timer);
  }, [user?.id, isNative, user?.isGuest, refreshUser]);

  // URL Sync Effect
  useEffect(() => {
    const status = searchParams.get('studio_status');
    const mode = searchParams.get('mode') as UploadMode;
    const shellTab = searchParams.get('tab') as MobileShellTab | null;
    
    if (status && ['discover', 'upload', 'ready', 'processing', 'results'].includes(status)) {
      setStudioState(status as StudioState);
    } else {
      // Default to discover for both web and native
      setStudioState('discover');
      navigate('/?studio_status=discover', { replace: true });
    }

    if (mode && ['camera', 'library'].includes(mode)) {
      setUploadMode(mode);
    }

    if (shellTab && ['try-on', 'looks', 'profile'].includes(shellTab)) {
      setActiveShellTab(shellTab);
    } else {
      setActiveShellTab('try-on');
    }
  }, [searchParams, navigate, isNative]);

  // Event Tracking & State Guard Effect
  useEffect(() => {
    if (user?.id) {
      apiService.trackEvent('page_view', { page: studioState, userId: user.id });
    }
    if (studioState === 'ready' && !selectedPhoto) {
      navigate('/?studio_status=upload&mode=camera', { replace: true });
    }
  }, [studioState, user?.id, selectedPhoto, navigate]);

  // Generation Status Effect
  useEffect(() => {
    if (generationStatus?.status === 'completed' && generationStatus.generatedImageUrl) {
      // Refresh user to get updated credit balance (credits may have changed due to partial refunds)
      refreshUser();
      navigate('/?studio_status=results', { replace: true });
      
      // Show onboarding after first successful generation (higher relevance)
      const hasGeneratedBefore = localStorage.getItem(FIRST_GENERATION_KEY);
      const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
      
      if (!hasGeneratedBefore) {
        localStorage.setItem(FIRST_GENERATION_KEY, 'true');
        // Nothing is shown over the first result: this is the "wow" moment and
        // the highest-intent point to save/share. Interrupting it with a guide
        // costs the share, which is our main organic growth loop.
      } else if (shouldShowRatePrompt(user)) {
        // Show rate app prompt on subsequent generations (not first — let user form opinion)
        setTimeout(() => {
          setShowRateApp(true);
        }, 3500);
      }
    } else if (generationStatus?.status === 'failed') {
      // Refresh user to reflect refunded credits immediately
      refreshUser();
      navigate('/?studio_status=ready', { replace: true });
    }
  }, [generationStatus, navigate, refreshUser]);

  // --- Centralized Back Navigation ---
  // State transition map: defines where "back" goes from each state
  const STATE_BACK_MAP: Record<StudioState, StudioState | null> = {
    home: null,      // Can't go back from home
    discover: isNative ? null : 'home', // Native stays on discover, web goes to home
    upload: 'discover', // Upload → Discover
    ready: 'upload', // Ready → Upload
    processing: null, // Can't go back during processing
    results: 'ready', // Results → Ready (with photo + style preserved)
  };

  const handleBack = useCallback(() => {
    // If mobile gallery is open, close it first
    if (showMobileGallery) {
      setShowMobileGallery(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true; // Handled
    }
    
    // If pricing modal is open, close it
    if (showPricing) {
      setShowPricing(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }
    
    // If auth modal is open, close it
    if (showAuthModal) {
      setShowAuthModal(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    if (showRewardsCenter) {
      setShowRewardsCenter(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    if (showPreGenerationSheet) {
      setShowPreGenerationSheet(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    if (showCustomStyleSheet) {
      setShowCustomStyleSheet(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    if (showCameraCapture) {
      setShowCameraCapture(false);
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    if (activeShellTab !== 'try-on') {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'try-on');
      navigate(`/?${params.toString()}`, { replace: true });
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    const targetState = STATE_BACK_MAP[studioState];
    
    if (targetState === null) {
      // Can't go back - let the system handle it (e.g., exit app)
      return false;
    }
    
    // Preserve photo when going back from results
    if (studioState === 'results') {
      // Don't clear the photo, just go back to ready state
      navigate(`/?studio_status=${targetState}`, { replace: true });
      triggerHapticFeedback(ImpactStyle.Medium);
      return true;
    }
    
    // For upload → discover, clear everything
    if (studioState === 'upload' && targetState === 'discover') {
      setSelectedPhoto(null);
      setSelectedHairstyle(null);
      setCustomThumbnailPath(undefined);
      setCustomImageFile(undefined);
      navigate('/?studio_status=discover', { replace: true });
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }

    // For discover → home, clear everything
    if (studioState === 'discover' && targetState === 'home') {
      setSelectedPhoto(null);
      setSelectedHairstyle(null);
      navigate('/', { replace: true });
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }
    
    // For ready → upload, clear hairstyle but keep photo
    if (studioState === 'ready' && targetState === 'upload') {
      setSelectedHairstyle(null);
      setCustomThumbnailPath(undefined);
      setCustomImageFile(undefined);
      navigate(`/?studio_status=${targetState}&mode=${uploadMode}`, { replace: true });
      triggerHapticFeedback(ImpactStyle.Light);
      return true;
    }
    
    navigate(`/?studio_status=${targetState}`, { replace: true });
    triggerHapticFeedback(ImpactStyle.Light);
    return true;
  }, [activeShellTab, studioState, showMobileGallery, showPricing, showAuthModal, showRewardsCenter, isNative, navigate, searchParams, uploadMode]);

  // Hardware back button support (Capacitor)
  useEffect(() => {
    if (!isNative) return;
    
    // Import App plugin for back button handling
    const setupBackHandler = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
          const handled = handleBack();
          if (!handled && !canGoBack) {
            // Exit the app if we can't handle back and there's no history
            App.exitApp();
          }
        });
        
        return () => {
          backButtonListener.then(listener => listener.remove());
        };
      } catch (e) {
        console.debug('Back button handler not available:', e);
      }
    };
    
    setupBackHandler();
  }, [isNative, handleBack]);

  // Determine if back button should be shown
  const canGoBack = useMemo(() => {
    if (showMobileGallery || showPricing || showAuthModal || showRewardsCenter || showPreGenerationSheet || showCustomStyleSheet || showCameraCapture) return true;
    if (activeShellTab !== 'try-on') return true;
    return STATE_BACK_MAP[studioState] !== null;
  }, [activeShellTab, studioState, showMobileGallery, showPricing, showAuthModal, showRewardsCenter, showPreGenerationSheet]);

  const handleShellNavigate = useCallback((tab: MobileShellTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);

    if (!params.get('studio_status')) {
      params.set('studio_status', 'discover');
    }

    if (!params.get('mode')) {
      params.set('mode', 'camera');
    }

    navigate(`/?${params.toString()}`);
    triggerHapticFeedback(ImpactStyle.Light);
  }, [navigate, searchParams]);

  // --- Event Handlers ---

  const handleCloseOnboarding = useCallback(async (skipped: boolean = false) => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    // Track on server if authenticated
    if (isAuthenticated && user?.id) {
      try {
        await fetch('/api/users/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ version: 1, skipped }),
        });
      } catch (error) {
        console.debug('Failed to track onboarding completion:', error);
      }
    }
  }, [isAuthenticated, user?.id]);

  // Function to relaunch onboarding (for help menu)
  const showHelp = useCallback(() => {
    setShowOnboarding(true);
  }, []);


const handleClearCustom =  useCallback(() => {
  setCustomThumbnailPath(undefined)
  setCustomImageFile(undefined)
  setSelectedHairstyle(null)
  }, []);

  // Style-first flow: user selects a style from discovery, then needs to upload photo
  const handleStyleFirstSelect = useCallback((hairstyle: any) => {
    setSelectedHairstyle(hairstyle);
    triggerHapticFeedback(ImpactStyle.Light);
    if (user?.id) {
      apiService.trackEvent('style_first_selected', {
        userId: user.id,
        hairstyleId: hairstyle._id || hairstyle.id,
        hairstyleName: hairstyle.name,
      });
    }
    // If photo already exists, go to ready state; otherwise go to upload
    if (selectedPhoto) {
      navigate('/?studio_status=ready');
    } else {
      navigate('/?studio_status=upload&mode=camera');
    }
  }, [user?.id, selectedPhoto, navigate]);

  // Navigate to discovery from anywhere
  const handleGoToDiscover = useCallback(() => {
    navigate('/?studio_status=discover');
    triggerHapticFeedback(ImpactStyle.Light);
  }, [navigate]);

  // Navigate to upload from discovery CTA
  const handleDiscoverUpload = useCallback(() => {
    navigate('/?studio_status=upload&mode=camera');
    triggerHapticFeedback(ImpactStyle.Light);
  }, [navigate]);
 

  const handlePhotoSelect = useCallback((file: File, mimeType: string) => {
    setSelectedPhoto(file);
    setImageMimeType(mimeType);
    navigate('/?studio_status=ready');
    if (user?.id) {
      apiService.trackEvent('photo_uploaded', {
        userId: user.id,
        fileSize: file.size,
        fileType: file.type,
      });
    }
  }, [navigate, user?.id]);

  const handleClearPhoto = useCallback(() => {
    setSelectedPhoto(null);
    setImageMimeType(null);
    setSelectedHairstyle(null);
    resetGeneration();
    setShowMobileGallery(false);
    navigate('/?studio_status=upload&mode=camera');
    setCustomImageFile()
    setCustomThumbnailPath()
  }, [navigate, resetGeneration]);

  const handleHairstyleSelect = useCallback((hairstyle: any) => {
    setSelectedHairstyle(hairstyle);
    triggerHapticFeedback(ImpactStyle.Light);
    if (user?.id) {
      apiService.trackEvent('hairstyle_selected', {
        userId: user.id,
        hairstyleId: hairstyle._id,
        hairstyleName: hairstyle.name,
      });
    }
  }, [user?.id]);

  const handleMobileHairstyleSelect = useCallback((hairstyle: any) => {
    setSelectedHairstyle(hairstyle);
    setShowMobileGallery(false);
    triggerHapticFeedback(ImpactStyle.Light);
  }, []);
  



  // FAB handler: show the custom style bottom sheet (auth-gated)
  const handleCustomStyleFAB = useCallback(() => {
    if (!isAuthenticated || user?.isGuest) {
      setShowAuthModal(true);
      toast.info('Sign in to upload custom hairstyles', {
        description: 'Get 10 free credits when you sign up!',
      });
      return;
    }
    setShowCustomStyleSheet(true);
    triggerHapticFeedback(ImpactStyle.Light);
  }, [isAuthenticated, user]);

  // Pick custom hairstyle image from camera or gallery
  const handleCustomStylePick = useCallback(async (source: 'camera' | 'gallery') => {
    setShowCustomStyleSheet(false);

    const processImage = (thumbnailPath: string, imageFile: File) => {
      setCustomThumbnailPath(thumbnailPath);
      setCustomImageFile(imageFile);
      setSelectedHairstyle({ ...CUSTOM_HAIRSTYLE_PLACEHOLDER, thumbnail: thumbnailPath });
      triggerHapticFeedback(ImpactStyle.Light);

      if (selectedPhoto) {
        navigate('/?studio_status=ready');
      } else {
        navigate('/?studio_status=upload&mode=camera');
      }
    };

    // Camera on web → open live camera overlay
    if (source === 'camera' && !Capacitor.isNativePlatform()) {
      setShowCameraCapture(true);
      return;
    }

    // Gallery on web → file input
    if (source === 'gallery' && !Capacitor.isNativePlatform()) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          processImage(reader.result as string, file);
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // Native path — use Capacitor Camera plugin
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        resultType: CameraResultType.Uri,
      });

      if (!image.webPath) {
        toast.info('Hairstyle selection cancelled.');
        return;
      }

      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const imageFile = new File([blob], 'uploaded_hairstyle.jpg', { type: blob.type || 'image/jpeg' });
      processImage(image.webPath, imageFile);
    } catch (e) {
      console.error('Custom style selection failed:', e);
    }
  }, [selectedPhoto, navigate]);

  // Handle camera capture from overlay (web only)
  const handleCameraCapture = useCallback((file: File, dataUrl: string) => {
    setShowCameraCapture(false);
    setCustomThumbnailPath(dataUrl);
    setCustomImageFile(file);
    setSelectedHairstyle({ ...CUSTOM_HAIRSTYLE_PLACEHOLDER, thumbnail: dataUrl });
    triggerHapticFeedback(ImpactStyle.Light);

    if (selectedPhoto) {
      navigate('/?studio_status=ready');
    } else {
      navigate('/?studio_status=upload&mode=camera');
    }
  }, [selectedPhoto, navigate]);

  const handleUploadHairstyle = useCallback(async () => {
    // Custom hairstyles cost 3 credits - require real login (guests only have 1)
    if (!isAuthenticated || user?.isGuest) {
      setShowAuthModal(true);
      toast.info('Sign in to upload custom hairstyles', {
        description: 'Get 10 free credits when you sign up!',
      });
      return;
    }

    if (!selectedPhoto) {
      toast.error('Please upload your photo first before selecting a custom hairstyle.');
      return;
    }

setSelectedHairstyle()
    

    try {
      // 1. Open Image Picker (Capacitor/Web)
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        source: CameraSource.Photos, 
        resultType: Capacitor.isNativePlatform() ? CameraResultType.Uri : CameraResultType.DataUrl, 
      });

      if (!image.webPath && !image.dataUrl) {
        toast.info('Hairstyle selection cancelled.');
        return;
      }
      
      let imageFile: File;
      let thumbnailPath: string;

      if (Capacitor.isNativePlatform() && image.webPath) {
        // Convert webPath to File object for FormData upload
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        imageFile = new File([blob], 'uploaded_hairstyle.jpg', { type: blob.type || 'image/jpeg' });
        thumbnailPath = image.webPath;
      } else if (image.dataUrl) {
        // Convert DataUrl for web to blob/File
        const dataUrl = image.dataUrl;
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        imageFile = new File([u8arr], 'uploaded_hairstyle.jpg', {type: mime});
        thumbnailPath = image.dataUrl;
      } else {
        toast.error('Could not process the selected image.');
        return;
      }

      setCustomThumbnailPath(thumbnailPath)
      setCustomImageFile(imageFile)

        } catch (e) {
      console.error('Hairstyle upload failed:', e);
      toast.error('Failed to upload and analyze image.');
      setStudioState('ready'); 
    }
  }, [isAuthenticated, user, setShowAuthModal, setShowPricing, selectedPhoto, navigate, refreshUser]);




  const generateCustomHairstyle = useCallback(async (imageFile: File,thumbnailPath:any) => {
    // Custom hairstyles cost 3 credits - require real login (guests only have 1)
    if (!isAuthenticated || user?.isGuest) {
      setShowAuthModal(true);
      toast.info('Sign in to generate custom hairstyles', {
        description: 'Get 10 free credits when you sign up!',
      });
      return;
    }

    if (!selectedPhoto) {
      toast.error('Please upload your photo first before selecting a custom hairstyle.');
      return;
    }

 if (requiresUpgrade(user, 3)) {
      setShowPricing(true);
      return;
    }
  navigate('/?studio_status=processing');
    

    try {

      const result = await handleCustomGenerator(imageFile,imageMimeType,selectedPhoto );
      
       if (result.success) {
        refreshUser();
      } else {
        toast.error(result.message || 'Generation failed');
        refreshUser();
        navigate('/?studio_status=ready');
      }


        } catch (error) {
          console.log(error)
     toast.error(error.message || 'Something went wrong. Please try again.');
      navigate('/?studio_status=ready');
    }
  }, [isAuthenticated, user, setShowAuthModal, setShowPricing, selectedPhoto, navigate, refreshUser]);




   

  // Pre-generation sheet: show cost visibility before generating
  const handleRequestGenerate = useCallback(() => {
    if (!selectedPhoto || !selectedHairstyle) {
      if (isMobile && !selectedHairstyle) {
        setShowMobileGallery(true);
      }
      return;
    }
    setShowPreGenerationSheet(true);
    apiService.trackEvent('pre_generation_sheet_viewed', {
      hairstyleId: selectedHairstyle._id || selectedHairstyle.id,
      hairstyleName: selectedHairstyle.name,
    });
  }, [selectedPhoto, selectedHairstyle, isMobile]);

  const handleDismissPreGeneration = useCallback(() => {
    setShowPreGenerationSheet(false);
  }, []);

  const handleGenerateStyle = useCallback(async (generationMode: string = 'hd') => {
    setShowPreGenerationSheet(false);

    if (!selectedPhoto || !selectedHairstyle) {
      if (isMobile && !selectedHairstyle) {
        setShowMobileGallery(true);
      }
      return;
    }
    
    // --- Determine Credits and Generation Type ---
    const isCustomStyle = selectedHairstyle.id === CUSTOM_HAIRSTYLE_PLACEHOLDER.id;
    const requiredCredits = selectedHairstyle.price || 1; 

    // Auto-create guest session if not authenticated (guest-first flow)
    if (!isAuthenticated) {
      toast.loading('Setting up your session...', { id: 'guest-session' });
      const guestResult = await apiService.createGuestSession();
      toast.dismiss('guest-session');
      
      if (!guestResult.success) {
        toast.error(guestResult.message || 'Failed to start session. Please try again.');
        return;
      }
      
      // Refresh auth state with guest user
      await refreshUser();
      toast.success('Ready! You have 1 free try. Sign in for 5 credits!', { duration: 4000 });
    }

    // Re-check credits after potential guest session creation
    const currentUser = user || (await apiService.getCurrentUser())?.data;
    if (!currentUser || (currentUser.credits || 0) < requiredCredits) {
      setShowPricing(true);
      return;
    }
    
    navigate('/?studio_status=processing');
    
    try {
        let result;
        
        if (isCustomStyle && customImageFile) {
            // Custom style: send the hairstyle image for backend analysis + generation
            result = await handleCustomGenerator(customImageFile, imageMimeType, selectedPhoto);
            apiService.trackEvent('generation_started_custom', { userId: user.id, creditsUsed: requiredCredits });
        } else {
            // Original signature for standard styles: passing hairstyle ID
            result = await generateHairstyle(selectedHairstyle._id, imageMimeType, selectedPhoto, generationMode);
            apiService.trackEvent('generation_started_standard', { userId: user.id, hairstyleId: selectedHairstyle._id, generationMode });
        }

      if (result.success) {
        refreshUser();
      } else {
        toast.error(result.message || 'Generation failed');
        refreshUser();
        navigate('/?studio_status=ready');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
      navigate('/?studio_status=ready');
    }
  }, [selectedPhoto, selectedHairstyle, isAuthenticated, user, navigate, generateHairstyle, handleCustomGenerator, imageMimeType, refreshUser, isMobile, customImageFile]);


  const handleDownload = useCallback(async () => {
    if (!generationStatus?.generatedImageUrl) return;
    setDownloadLoading(true);
    triggerHapticFeedback(ImpactStyle.Light);
    if (isNative) {
      const hasPermission = await checkAndRequestStoragePermission();
      if (!hasPermission) {
        toast.error('Permission denied. Cannot save file.');
        setDownloadLoading(false);
        return;
      }
      const fileName = `hair-studio-${selectedHairstyle?.name}-${Date.now()}.jpg`.replaceAll(' ', '_');
      try {
        await Filesystem.downloadFile({
          path: fileName,
          url: generationStatus.generatedImageUrl,
          directory: Directory.Documents,
          recursive: true,
        });
        toast.success(`Image saved to Downloads! 📸`);
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to save image.');
      }
    } else {
      const link = document.createElement('a');
      link.href = generationStatus.generatedImageUrl;
      link.download = `hair-studio-${selectedHairstyle?.name}-${Date.now()}.jpg`.replaceAll(' ', '_');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully! 📸');
    }
    setDownloadLoading(false);
  }, [generationStatus, selectedHairstyle, isNative]);

  const handlePurchase = useCallback(async (item: CreditPack | SubscriptionPlan) => {
    if (!isAuthenticated) {
      toast.info('Please sign in first to purchase credits');
      return false;
    }
    // Purchase logic here
    const success = true; // Placeholder
    if (success) {
      setShowPricing(false);
      refreshUser();
      if (selectedPhoto && selectedHairstyle) {
        setTimeout(() => {
          handleGenerateStyle();
        }, 1000);
      }
    }
    return success;
  }, [isAuthenticated, refreshUser, selectedPhoto, selectedHairstyle, handleGenerateStyle]);

  const handleTryAnother = useCallback(() => {
    setSelectedHairstyle(null);
    resetGeneration();
    navigate('/?studio_status=discover');
    
  }, [navigate, resetGeneration, isMobile]);

  // U4: Retry same style — keeps both selectedPhoto and selectedHairstyle, just resets generation
  const handleRetrySameStyle = useCallback(() => {
    resetGeneration();
    // Navigate back to ready state where pre-generation sheet will show
    navigate('/?studio_status=ready');
  }, [navigate, resetGeneration]);

  const handleSignOutWithHaptic = useCallback(async () => {
    triggerHapticFeedback(ImpactStyle.Medium);
    await handleSignOut();
    navigate('/?studio_status=discover', { replace: true });
  }, [navigate]);

  const handleDeleteAccount = useCallback(async () => {
    triggerHapticFeedback(ImpactStyle.Heavy);
    const result = await Dialog.confirm({
      title: 'Delete Account',
      message: 'Are you sure you want to permanently delete your account? This action cannot be undone.',
      okButtonTitle: 'Yes, Delete',
      cancelButtonTitle: 'Cancel',
    });
    if (!result.value) {
      triggerHapticFeedback(ImpactStyle.Light);
      toast.info('Account deletion cancelled.');
      return;
    }
    try {
      if (!user?.id) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      const response = await apiService.deleteAccount();
      if (response.status === 'success') {
        toast.success(response.message || 'Account successfully deleted.');
        await handleSignOut();
        navigate('/?studio_status=discover', { replace: true });
      } else {
        toast.error(response.message || 'Failed to delete account.');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Network error. Failed to connect to the server.');
    }
  }, [user?.id, navigate]);

  // Return all state and handlers
  return {
    // State
    studioState,
    uploadMode,
    selectedPhoto,
    selectedHairstyle,
    showPricing,
    downloadLoading,
    showMobileGallery,
    showOnboarding,
    showAuthModal,
    showRewardsCenter,
    showPreGenerationSheet,
    showCustomStyleSheet,
    
    // Derived State
    user,
    isAuthenticated,
    refreshUser,
    hairstyles,
    hairstylesLoading,
    paywallContext,
    isGenerating,
    generationId,
    generationStatus,
    progress,
    customThumbnailPath,
    customImageFile,
    activeShellTab,
    isMobileShellEnabled: isNative || isMobile,

    // Navigation
    canGoBack,
    handleBack,
    handleShellNavigate,

    // Handlers
    handleCloseOnboarding,
    showHelp,
    handlePhotoSelect,
    handleClearPhoto,
    handleHairstyleSelect,
    handleMobileHairstyleSelect,
    handleRequestGenerate,
    handleDismissPreGeneration,
    handleGenerateStyle,
    handleDownload,
    handlePurchase,
    handleTryAnother,
    handleRetrySameStyle,
    handleSignOutWithHaptic,
    handleDeleteAccount,
    setShowPricing,
    setShowMobileGallery,
    setShowAuthModal,
    setShowRewardsCenter,
    handleUploadHairstyle, 
    handleClearCustom,
    generateCustomHairstyle,
    handleCustomStyleFAB,
    handleCustomStylePick,
    showCustomStyleSheet,
    setShowCustomStyleSheet,
    showCameraCapture,
    setShowCameraCapture,
    handleCameraCapture,
    showRateApp,
    setShowRateApp,

    // Style-first flow handlers
    handleStyleFirstSelect,
    handleGoToDiscover,
    handleDiscoverUpload,
  };
};