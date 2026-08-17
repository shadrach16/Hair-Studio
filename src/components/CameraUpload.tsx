import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiService } from '@/lib/api';
import { PermissionPrimer, type PermissionKind } from '@/components/ui/PermissionPrimer';
import { pushBackInterceptor } from '@/lib/native';
import { IonIcon } from '@ionic/react';
import { cameraOutline, imagesOutline, arrowBackOutline, sunnyOutline } from 'ionicons/icons';
import {
  Camera,
  Upload,
  RotateCcw,
  X,
  Check,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image as ImageIcon, // Kept for consistency
  ChevronRight,
  ArrowLeft,
  Flame,
  Coins,
} from 'lucide-react';
import type { StyleRecommendation } from '@/lib/api';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CameraUploadProps {
  onPhotoSelect: (file: File, mimeType: string) => void;
  onClearPhoto: () => void;
  selectedPhoto: File | null;
  selectedHairstyle?: any;
  onStyleSelect?: (hairstyle: any) => void;
  onBack?: () => void;
}

// --- HELPER FUNCTIONS ---

const triggerHapticFeedback = (style: ImpactStyle) => {
   
};

const dataURLtoFile = (dataurl: string, filename: string, mimeType: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// --- MAIN COMPONENT ---

// The primer is shown once per permission. After the OS has been asked, showing
// it again on every capture is friction, not clarity.
const PRIMER_KEY = 'hairstudio_primer_seen_';
const hasSeenPrimer = (k: PermissionKind) => !!localStorage.getItem(PRIMER_KEY + k);
const markPrimerSeen = (k: PermissionKind) => localStorage.setItem(PRIMER_KEY + k, '1');

export default function CameraUpload({
  onPhotoSelect,
  onClearPhoto,
  selectedPhoto,
  selectedHairstyle,
  onStyleSelect,
  onBack,
}: CameraUploadProps) {
  // 💡 Mode 'upload' is no longer used for UI
  const [mode, setMode] = useState<'choice' | 'camera'>('choice');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  // 💡 dragActive is no longer needed
  // const [dragActive, setDragActive] = useState(false); 
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Which primer to show before the OS dialog, if any (M4). Native only — on
  // web the browser shows its own contextual prompt and a second sheet is noise.
  const [primer, setPrimer] = useState<PermissionKind | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trendingStyles, setTrendingStyles] = useState<StyleRecommendation[]>([]);

  // Determine the environment once
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    localStorage.setItem('studio_status', 'landing');
  }, []);

  // Fetch trending styles for inspiration section
  useEffect(() => {
    if (selectedHairstyle) return; // Skip if style already chosen
    let cancelled = false;
    apiService.getTrendingStyles({ limit: 6 }).then(res => {
      if (!cancelled && res.success) setTrendingStyles(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedHairstyle]);

  // --- CORE LOGIC FUNCTIONS ---

  const simulateUpload = useCallback(
    (file: File, mimeType: string) => {
      setIsUploading(true);
      setUploadProgress(0);

      // Track photo upload event
      apiService.trackEvent('photo_uploaded', {
        source: mode === 'camera' ? 'camera' : 'gallery',
        mimeType,
        fileSize: file.size
      });

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            // Defer parent callback out of setState updater to avoid "setState during render" warning
            setTimeout(() => onPhotoSelect(file, mimeType), 0);
            return 100;
          }
          return prev + Math.random() * 4; // Simulated progress
        });
      }, 50); // Faster interval for smoother demo
    },
    [onPhotoSelect],
  );

  const capturePhoto = useCallback(async () => {
    setCameraError(null);
    triggerHapticFeedback(ImpactStyle.Medium);

    // Explain before the OS asks. Once per permission: after the user has
    // granted (or seen it), going through the primer every time is friction.
    if (isNative && !hasSeenPrimer('camera')) {
      // Restore the branch that renders the primer, so this can never strand the
      // user however capturePhoto was reached.
      setMode('choice');
      setPrimer('camera');
      return;
    }

    if (isNative) {
      // --- NATIVE CAMERA PATH ---
      try {
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera, // Use the Camera
          direction: facingMode === 'user' ? 'front' : 'rear',
        });

        if (photo.dataUrl && photo.format) {
          setImageSrc(photo.dataUrl);
          setImageMimeType(`image/${photo.format}`);
        }
      } catch (error) {
        console.error('Native Camera Error:', error);
        setCameraError('Camera access denied or operation cancelled.');
        setMode('choice'); // Go back if user cancels
      }
    } else {
      // --- WEB/DESKTOP CAMERA PATH ---
      const image = webcamRef.current?.getScreenshot();
      if (image) {
        setImageSrc(image);
        setImageMimeType('image/jpeg');
      }
    }
  }, [isNative, webcamRef, facingMode]);

  const confirmCapture = useCallback(() => {
    if (imageSrc) {
      triggerHapticFeedback(ImpactStyle.Light);
      const file = dataURLtoFile(
        imageSrc,
        `selfie-${Date.now()}.jpeg`,
        imageMimeType || 'image/jpeg',
      );
      if (file) {
        simulateUpload(file, 'image/jpeg');
        setImageSrc(null);
        setImageMimeType(null);
      }
    }
  }, [imageSrc, simulateUpload, imageMimeType]);

  const confirmUpload = () => {
    if (imageSrc && imageMimeType) {
      triggerHapticFeedback(ImpactStyle.Light);
      const file = dataURLtoFile(
        imageSrc,
        `upload-${Date.now()}.jpg`,
        imageMimeType,
      );
      simulateUpload(file, imageMimeType);
      setImageSrc(null);
      setImageMimeType(null);
    }
  };

  const handlePhotoFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const switchCamera = useCallback(() => {
    triggerHapticFeedback(ImpactStyle.Light);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // --- NAVIGATION & STATE RESET ---

  // The camera overlay is component state, not a route or an Ionic overlay, so
  // the global back handler had nothing to consult and back fell through to
  // minimise: Walk 1 watched it exit Hair Studio and surface another app.
  // Registering a closer puts it on the same interceptor stack the sheets use.
  useEffect(() => {
    if (mode !== 'camera') return;
    return pushBackInterceptor(() => {
      setMode('choice');
      setCameraError(null);
    });
  }, [mode]);

  const handleCameraClick = () => {
    triggerHapticFeedback(ImpactStyle.Light);
    // The primer has to be raised BEFORE the mode switch. It is rendered inside
    // the 'choice' branch, so switching first unmounts the very sheet we are
    // about to open: the user lands on a camera view that never opens, with no
    // dialog, no preview and no error. Walk 1 found exactly that dead end on a
    // fresh install, on the app's primary action.
    if (isNative && !hasSeenPrimer('camera')) {
      setPrimer('camera');
      return;
    }
    setMode('camera');
    if (isNative) {
      // On native, immediately launch the camera
      capturePhoto();
    }
    // On web, this just switches to the <Webcam> component view
  };

  // 💡 UPDATED FUNCTION
  // This function now handles both native gallery and web/PC file picker
  const handleUploadClick = async () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setCameraError(null);
    // 💡 We no longer setMode('upload'). We stay in 'choice' mode.

    if (isNative && !hasSeenPrimer('photos')) {
      setPrimer('photos');
      return;
    }

    if (isNative) {
      // --- NATIVE GALLERY/PHOTOS PATH ---
      try {
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false, 
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos, // <-- This opens the gallery
        });

        if (photo.dataUrl && photo.format) {
          setImageSrc(photo.dataUrl);
          setImageMimeType(`image/${photo.format}`);
          // The component will now show the 'Preview' state (// 3.)
        } else {
          // User cancelled from the native gallery, go back to choice
          setMode('choice');
        }
      } catch (error) {
        console.error('Native Gallery Error:', error);
        // User cancelled or a permissions error occurred
        setMode('choice'); // Go back to the choice screen
      }
    } else {
      // --- WEB/PC UPLOAD PATH ---
      // 💡 NEW: Immediately click the hidden file input
      fileInputRef.current?.click();
      // The input's `onChange` will trigger `handleFileSelect`,
      // which sets the imageSrc and shows the preview screen.
    }
  };

  // Resets component to the initial 'choice' screen
  const resetState = () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setImageSrc(null);
    setImageMimeType(null);
    setCameraError(null);
    onClearPhoto(); // Clears parent state
    setMode('choice');
  };

  // Clears the preview to return to camera/upload
  const clearPreview = () => {
    triggerHapticFeedback(ImpactStyle.Light);
    setImageSrc(null);
    setImageMimeType(null);
    setCameraError(null);
    // If we were in native camera mode, we must re-launch the camera
    if (mode === 'camera' && isNative) {
      capturePhoto();
    }
    // 💡 If we came from a file upload, just go back to choice
    setMode('choice');
  };

  // --- DRAG & DROP HANDLERS (No longer used, but harmless to keep) ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  // --- This function is still critical! ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.target && e.target.files && e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  // --- RENDER STATES ---

  // 1. SUCCESS SCREEN (Photo is selected and processed)
  if (selectedPhoto) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center px-4 py-8">
        {/* Photo + style side-by-side if style selected */}
        {selectedHairstyle ? (
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-[88px] h-[88px] rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-sm">
                <img src={URL.createObjectURL(selectedPhoto)} alt="Your photo" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center ring-2 ring-white">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
            <div className="w-[88px] h-[88px] rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-sm">
              <img src={selectedHairstyle.thumbnail} alt={selectedHairstyle.name} className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-sm">
              <img src={URL.createObjectURL(selectedPhoto)} alt="Your photo" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center ring-2 ring-white">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        <h2 className="text-[18px] font-bold text-gray-900 tracking-tight text-center">
          {selectedHairstyle ? 'Ready to generate' : 'Photo uploaded'}
        </h2>
        <p className="text-[13px] text-gray-400 mt-1 mb-6 text-center">
          {selectedHairstyle
            ? `Your photo + ${selectedHairstyle.name}`
            : 'Now choose a hairstyle to try'
          }
        </p>

        <div className="w-full space-y-2.5">
          <button
            onClick={() => navigate('/?studio_status=ready')}
            className="w-full h-12 bg-[#1a1a1a] text-white rounded-2xl text-[14px] font-semibold shadow-lg shadow-gray-900/10 flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            {selectedHairstyle ? 'Continue' : 'Browse Styles'}
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={resetState}
            className="w-full py-2.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            Choose different photo
          </button>
        </div>
      </div>
    );
  }

  // 2. UPLOADING/PROCESSING STATE
  if (isUploading) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 tracking-tight">
          Preparing your photo
        </h3>
        <div className="w-full max-w-[180px] mt-4">
          <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-150 ease-out"
              style={{ width: `${Math.min(uploadProgress, 100)}%` }}
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-300 mt-2">
          {Math.round(uploadProgress)}%
        </p>
      </div>
    );
  }

  // 3. PREVIEW STATE (Photo taken/selected, awaiting confirmation)
  if (imageSrc) {
    return (
      <div className="w-full max-w-md mx-auto overflow-hidden rounded-3xl shadow-lg">
        <div className="relative aspect-[3/4] w-full">
          <img
            src={imageSrc}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 pt-16">
            <div className="space-y-2.5">
              <Button
                onClick={() =>
                  mode === 'camera' ? confirmCapture() : confirmUpload()
                }
                size="lg"
                className="w-full h-12 bg-white text-gray-900 hover:bg-gray-50 rounded-2xl text-[15px] font-semibold shadow-lg"
              >
                <Check className="w-4.5 h-4.5 mr-2" /> Use this photo
              </Button>
              <Button
                onClick={clearPreview}
                size="lg"
                variant="ghost"
                className="w-full h-11 text-white/90 hover:text-white hover:bg-white/10 rounded-2xl text-sm"
              >
                <X className="w-4 h-4 mr-2" /> Retake
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. INITIAL CHOICE SCREEN
  if (mode === 'choice') {
    return (
      <div className="w-full  mx-auto flex flex-col items-center ">
        {/* Shown before the OS dialog. Rendered only in this branch because the
            capture and library buttons that raise it live only here. */}
        <PermissionPrimer
          isOpen={primer !== null}
          kind={primer ?? 'camera'}
          onClose={() => setPrimer(null)}
          onContinue={() => {
            const kind = primer;
            setPrimer(null);
            if (!kind) return;
            markPrimerSeen(kind);
            // Re-enter the same handler; the primer gate is now satisfied.
            if (kind === 'camera') handleCameraClick();
            else handleUploadClick();
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload a photo"
        />

        {/* ── Hero ──────────────────────────────────────────────────────────
            The style being tried on IS the screen. Previously this was an 82px
            thumbnail above a bold sans heading, with the two actions as a white
            card of list rows and chevrons — a settings screen. The reason
            someone is here is the style, so it gets the space, and the paper
            gradient carries it into the actions instead of boxing them. */}
        {selectedHairstyle ? (
          <div className="relative -mx-4 mb-5 h-[40vh] max-h-[360px] w-[calc(100%+2rem)] overflow-hidden">
            <img
              src={selectedHairstyle.thumbnail}
              alt={selectedHairstyle.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-surface via-surface/75 to-transparent" />
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Back"
                className="absolute left-4 grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-md active:scale-95"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
              >
                <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: '#fff' }} />
              </button>
            )}
            <div className="absolute inset-x-0 bottom-0 px-5 pb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-3">Trying on</p>
              <h1 className="mt-1 font-display text-[26px] italic leading-tight text-ink">
                {selectedHairstyle.name}
              </h1>
            </div>
          </div>
        ) : (
          <div className="w-full px-1 pb-2 pt-3">
            {onBack && (
              <button
                onClick={onBack}
                className="mb-5 flex items-center gap-1.5 text-[13px] text-ink-3 active:text-ink-2"
              >
                <IonIcon icon={arrowBackOutline} style={{ fontSize: 17 }} />
                Discover
              </button>
            )}
          </div>
        )}

        {/* ── The ask ───────────────────────────────────────────────────── */}
        <div className="w-full px-1">
          <h2 className="font-display text-[24px] leading-tight text-ink">Add your photo</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            One clear, front-facing photo is all it takes.
          </p>

          {/* Two actions, weighted. The camera is primary because a photo taken
              now is framed for this purpose; a library pick often is not. */}
          <button
            onClick={handleCameraClick}
            className="mt-6 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99]"
          >
            <IonIcon icon={cameraOutline} style={{ fontSize: 20 }} />
            Take a photo
          </button>

          <button
            onClick={handleUploadClick}
            className="mt-2.5 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-medium text-ink ring-1 ring-hairline active:bg-surface-2"
          >
            <IonIcon icon={imagesOutline} style={{ fontSize: 20 }} />
            Choose from library
          </button>

          <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-[12px] leading-relaxed text-ink-3">
            <IonIcon icon={sunnyOutline} style={{ fontSize: 14, marginTop: 1 }} />
            Face the light and keep hair off your face — it is what makes the
            result look like you.
          </p>

          <p className="mt-4 text-center text-[11px] text-ink-3/70">
            AI preview — results are approximations.
          </p>
        </div>

        {/* Trending styles — matches Discover page carousel design */}
        {!selectedHairstyle && trendingStyles.length > 0 && (
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                Trending Now
              </h3>
              <button
                onClick={() => navigate('/?studio_status=discover')}
                className="text-[12px] font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-0.5 transition-colors"
              >
                See all
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto overflow-y-hidden scrollbar-none -mx-4">
              <div className="flex gap-2.5 px-4" style={{ width: 'max-content' }}>
                {trendingStyles.map((style, i) => (
                  <motion.button
                    key={style._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    onClick={() => onStyleSelect?.(style)}
                    className="flex-shrink-0 w-[108px] group text-left"
                    aria-label={`Try ${style.name}`}
                  >
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm shadow-gray-200/50">
                      <img
                        src={style.thumbnail}
                        alt={style.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Price chip */}
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-4.5 py-0.5 bg-black/35 backdrop-blur-sm rounded-full">
                        <Coins className="w-2.5 h-2.5 text-amber-300" />
                        <span className="text-[9px] font-bold text-white">{style.price}</span>
                      </div>

                      {/* Name at bottom */}
                      <div className="absolute bottom-0 inset-x-0 p-2">
                        <p className="text-[11px] font-semibold text-white leading-tight line-clamp-1">
                          {style.name}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. CAMERA VIEW (Web Only) — Full-screen immersive
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      {/* ── Top bar ──────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <button
          onClick={() => {
            setMode('choice');
            setCameraError(null);
          }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="text-sm font-semibold text-white/90 drop-shadow-sm">Take a Selfie</p>
        <div className="w-10 h-10" />
      </div>

      {/* ── Camera feed ─────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <Camera className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-sm text-white/70 leading-relaxed">{cameraError}</p>
            <button
              onClick={() => {
                setMode('choice');
                setCameraError(null);
              }}
              className="mt-6 px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Go Back
            </button>
          </div>
        ) : !isNative ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            onUserMediaError={() =>
              setCameraError(
                'Camera access denied. Please enable permissions in your browser settings.',
              )
            }
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <Camera className="w-12 h-12 text-white/30 mb-3" />
            <p className="text-[14px] text-white/50 font-medium">Opening Camera...</p>
          </div>
        )}

        {/* Face guide overlay */}
        {!cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[55%] aspect-[3/4] rounded-[40%] border-[2px] border-white/20" />
          </div>
        )}
      </div>

      {/* ── Bottom controls ─────────────────────────── */}
      {!cameraError && !isNative && (
        <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center pb-[max(env(safe-area-inset-bottom),24px)] pt-5 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex justify-center items-center gap-10 mb-4">
            <button
              onClick={switchCamera}
              aria-label="Switch camera"
              className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={capturePhoto}
              aria-label="Take photo"
              className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-[58px] h-[58px] rounded-full bg-white" />
            </button>
            <div className="w-12 h-12" />
          </div>
          {/* Tips */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-white/40">Good lighting</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
            <span className="text-[11px] text-white/40">Face the camera</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
            <span className="text-[11px] text-white/40">Neutral expression</span>
          </div>
        </div>
      )}
    </div>
  );
}