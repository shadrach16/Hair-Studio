// ResultsViewer — the result screen (M4 §6.1).
//
// This is where "doesn't feel AI-generated" is won: people post what makes
// THEM look good, so the result gets the whole screen and the chrome gets out
// of the way.
//
// What changed from the previous version:
//  - Full-bleed. The result was a 4:5 card inside a scroll container inside the
//    app shell — a card-in-a-card, with the photo occupying maybe half the
//    screen. It now covers everything (fixed inset-0), controls float over it.
//  - The before/after segmented control is gone. Three tabs to look at two
//    images is tool UI. Instead: press and hold anywhere to peek at the
//    original, or tap Compare for a draggable divider.
//  - Style name is set in Fraunces italic over the image like a lookbook
//    caption, not stacked above it in a bold sans heading.
//  - The desktop action grid is gone — this app ships mobile-only.
//  - ~60 lines of dead canvas code (createCollageImage) removed: it was
//    superseded by lib/shareCard.ts and never called.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon } from '@ionic/react';
import {
  shareOutline,
  downloadOutline,
  bookmarkOutline,
  bookmark,
  cutOutline,
  refreshOutline,
  closeOutline,
  swapHorizontalOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';
import { apiService } from '@/lib/api';
import { renderShareCard } from '@/lib/shareCard';
import { buildReferralLink } from '@/lib/attribution';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultsViewerProps {
  selectedPhoto: File | null;
  selectedHairstyle: { name: string } | null;
  generationStatus: { generatedImageUrl: string | null; identityScore?: number | null } | null;
  generationId?: string | null;
  referralCode?: string;
  isPro?: boolean;
  isGuest?: boolean;
  availableCredits?: number;
  onTryAnother?: () => void;
  onRetrySameStyle?: () => void;
  onShowPricing?: () => void;
  onShowRewards?: () => void;
  onShowAuth?: () => void;
}

const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  try { if (Capacitor.isNativePlatform()) await Haptics.impact({ style }); } catch {}
};

// A free half-stop of perceived quality. The model's output is flat-ish out of
// the box; a touch of contrast and warmth is what a phone camera's own pipeline
// would do anyway, and it is applied on DISPLAY only — exports use the original.
const ENHANCE = 'contrast(1.04) saturate(1.06) brightness(1.02)';

// identityPreservation from services/outputQuality.js is scored 0-100 against
// the original selfie. 80 is deliberately above the delivery thresholds (35/45/55)
// — the line should mean "this genuinely looks like you", not "this shipped".
const LIKENESS_THRESHOLD = 80;

const ResultsViewer: React.FC<ResultsViewerProps> = ({
  selectedPhoto,
  generationStatus,
  generationId,
  selectedHairstyle,
  referralCode,
  isPro = false,
  isGuest = false,
  availableCredits,
  onTryAnother,
  onRetrySameStyle,
  onShowPricing,
  onShowAuth,
}) => {
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [isAfterImageLoading, setIsAfterImageLoading] = useState(true);
  const [isCreatingCollage, setIsCreatingCollage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingBarberCard, setIsCreatingBarberCard] = useState(false);

  // Compare: `peek` is press-and-hold (the fast, discoverable gesture);
  // `compare` is the draggable divider for a considered look.
  const [peek, setPeek] = useState(false);
  const [compare, setCompare] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const pressStart = useRef<{ x: number; t: number } | null>(null);
  const [showCompareHint, setShowCompareHint] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (selectedPhoto) {
      objectUrl = URL.createObjectURL(selectedPhoto);
      setBeforeImageUrl(objectUrl);
    } else {
      setBeforeImageUrl(null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [selectedPhoto]);

  const afterImageUrl = generationStatus?.generatedImageUrl;

  useEffect(() => {
    if (afterImageUrl) setIsAfterImageLoading(true);
  }, [afterImageUrl]);

  // Teach the hold gesture once. Shown on the result itself rather than as a
  // coach-mark overlay, so it never blocks the reveal.
  useEffect(() => {
    if (isAfterImageLoading) return;
    if (localStorage.getItem('hasSeenCompareHint')) return;
    setShowCompareHint(true);
    const t = setTimeout(() => {
      setShowCompareHint(false);
      localStorage.setItem('hasSeenCompareHint', '1');
    }, 3200);
    return () => clearTimeout(t);
  }, [isAfterImageLoading]);

  /* ─── Stylist card ──────────────────────────────────────────────────────── */
  const createBarberCard = useCallback(async (): Promise<Blob | null> => {
    if (!afterImageUrl) return null;
    return renderShareCard('clean', {
      afterUrl: afterImageUrl,
      styleName: selectedHairstyle?.name,
      hideWatermark: false,
    });
  }, [afterImageUrl, selectedHairstyle?.name]);

  /* ─── Share: before & after ─────────────────────────────────────────────── */
  const handleShareCollage = async () => {
    if (!beforeImageUrl || !afterImageUrl) { toast.error('Images not ready'); return; }
    setIsCreatingCollage(true);
    const tid = toast.loading('Creating before & after...');
    try {
      // Editorial before/after card instead of the old white side-by-side with
      // sans "Before/After" labels — that read as a tool's output, not something
      // anyone would post.
      const blob = await renderShareCard('beforeAfter', {
        afterUrl: afterImageUrl,
        beforeUrl: beforeImageUrl,
        styleName: selectedHairstyle?.name,
        hideWatermark: isPro,
      });
      if (!blob) { toast.dismiss(tid); toast.error('Failed to create collage'); setIsCreatingCollage(false); return; }

      const title = 'Check out my transformation!';
      // Real deep link (deferred-install aware). https://hairstudio.app does not
      // exist — every shared referral link was pointing at a dead domain.
      const refLink = referralCode ? `\n\nTry it: ${buildReferralLink(referralCode)}` : '';
      const text = `Before & After: I tried '${selectedHairstyle?.name || 'new'}' with Hair Studio AI!${refLink}`;

      if (Capacitor.isNativePlatform()) {
        const b64 = await blobToBase64(blob);
        const fn = `collage_${Date.now()}.jpg`;
        await Filesystem.writeFile({ path: fn, data: b64, directory: Directory.Cache });
        const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: fn });
        toast.dismiss(tid);
        await Share.share({ title, text, dialogTitle: 'Share Transformation', files: [uri] });
        apiService.trackEvent('shared', { surface: 'collage', hairstyle: selectedHairstyle?.name, channel: '@ShadHairStudio' }).catch(() => {});
        setTimeout(async () => { try { await Filesystem.deleteFile({ path: fn, directory: Directory.Cache }); } catch {} }, 2000);
      } else {
        const file = new File([blob], 'transformation.jpg', { type: 'image/jpeg' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          toast.dismiss(tid);
          await navigator.share({ title, text, files: [file] });
        } else {
          toast.dismiss(tid);
          downloadBlob(blob, `transformation_${Date.now()}.jpg`);
          try { await navigator.clipboard.writeText(text); toast.success('Downloaded! Caption copied.'); } catch { toast.success('Downloaded!'); }
        }
      }
    } catch (e: any) {
      toast.dismiss(tid);
      if (isShareCancel(e)) toast.info('Share cancelled'); else toast.error('Could not share collage');
    } finally { setIsCreatingCollage(false); }
  };

  /* ─── Share: the look ───────────────────────────────────────────────────── */
  const handleShare = async () => {
    if (!afterImageUrl) { toast.error('Image not available'); return; }
    const title = 'Check out my new look!';
    const refLink = referralCode ? `\n\nFree credits: ${buildReferralLink(referralCode)}` : '';
    const text = `I tried '${selectedHairstyle?.name || 'new'}' with Hair Studio AI!${refLink}`;
    const tid = toast.loading('Preparing...');
    try {
      // Editorial card, not the raw render: the exported image is the user's
      // photo set like a lookbook page, which is what people are willing to
      // post. Falls back to the raw image if the card can't be drawn.
      const card = await renderShareCard('editorial', {
        afterUrl: afterImageUrl,
        styleName: selectedHairstyle?.name,
        hideWatermark: isPro,
      });

      if (Capacitor.isNativePlatform()) {
        const blob = card || (await (await fetch(afterImageUrl)).blob());
        const b64 = await blobToBase64(blob);
        const fn = `hairstyle_${Date.now()}.${card ? 'png' : 'jpg'}`;
        await Filesystem.writeFile({ path: fn, data: b64, directory: Directory.Cache });
        const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: fn });
        toast.dismiss(tid);
        await Share.share({ title, text, dialogTitle: 'Share New Look', files: [uri] });
        apiService.trackEvent('shared', { surface: 'result', hairstyle: selectedHairstyle?.name, channel: '@ShadHairStudio' }).catch(() => {});
        setTimeout(async () => { try { await Filesystem.deleteFile({ path: fn, directory: Directory.Cache }); } catch {} }, 2000);
        return;
      }
      const blob = card || (await (await fetch(afterImageUrl)).blob());
      const file = new File([blob], card ? 'hairstyle.png' : 'hairstyle.jpg', {
        type: card ? 'image/png' : 'image/jpeg',
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        toast.dismiss(tid);
        await navigator.share({ title, text, files: [file] });
        return;
      }
      toast.dismiss(tid);
      downloadBlob(blob, `hairstyle_${selectedHairstyle?.name || 'result'}_${Date.now()}.jpg`);
      try { await navigator.clipboard.writeText(text); toast.success('Downloaded! Caption copied.'); } catch { toast.success('Downloaded!'); }
    } catch (e: any) {
      toast.dismiss(tid);
      if (isShareCancel(e)) toast.info('Share cancelled'); else toast.error('Could not share');
    }
  };

  /* ─── Export ────────────────────────────────────────────────────────────── */
  const handleExport = useCallback(async () => {
    if (!afterImageUrl) { toast.error('Image not available'); return; }
    setIsExporting(true);
    triggerHaptic();
    try {
      const fname = `Hair_Studio_${selectedHairstyle?.name || 'result'}_${Date.now()}.jpg`.replace(/\s+/g, '_');

      if (Capacitor.isNativePlatform()) {
        const resp = await fetch(afterImageUrl);
        const blob = await resp.blob();
        const b64 = await blobToBase64(blob);
        // Save to public Downloads folder so user can find it in file manager / gallery
        try {
          await Filesystem.writeFile({ path: `Download/HairStudio/${fname}`, data: b64, directory: Directory.ExternalStorage, recursive: true });
        } catch {
          // Fallback to Documents if ExternalStorage fails
          await Filesystem.writeFile({ path: fname, data: b64, directory: Directory.Documents, recursive: true });
        }
        toast.success('Saved to Downloads/HairStudio', { description: 'Check your gallery or file manager' });
      } else {
        const resp = await fetch(afterImageUrl);
        const blob = await resp.blob();
        downloadBlob(blob, fname);
        toast.success('Image downloaded');
      }

      apiService.exportImage(afterImageUrl, selectedHairstyle?.name || 'Unknown').catch(() => {});
    } catch (e: any) {
      console.error('Export failed:', e);
      toast.error('Failed to export');
    } finally { setIsExporting(false); }
  }, [afterImageUrl, selectedHairstyle?.name]);

  /* ─── Stylist card export ───────────────────────────────────────────────── */
  const handleBarberExport = useCallback(async () => {
    setIsCreatingBarberCard(true);
    triggerHaptic(ImpactStyle.Medium);
    try {
      const blob = await createBarberCard();
      if (!blob) { toast.error('Failed to create stylist card'); return; }
      if (Capacitor.isNativePlatform()) {
        const b64 = await blobToBase64(blob);
        const fn = `stylist-card-${Date.now()}.jpg`;
        await Filesystem.writeFile({ path: fn, data: b64, directory: Directory.Cache, recursive: true });
        const { uri } = await Filesystem.getUri({ path: fn, directory: Directory.Cache });
        await Share.share({
          title: `${selectedHairstyle?.name || 'Hairstyle'} - Show Your Stylist`,
          text: "Here's the style I want - generated with Hair Studio AI",
          dialogTitle: 'Share Stylist Card',
          files: [uri],
        });
        toast.success('Stylist card shared!');
        setTimeout(async () => { try { await Filesystem.deleteFile({ path: fn, directory: Directory.Cache }); } catch {} }, 2000);
      } else {
        downloadBlob(blob, `stylist-card-${selectedHairstyle?.name || 'hairstyle'}.jpg`);
        toast.success('Stylist card downloaded!');
      }
    } catch (e: any) {
      if (isShareCancel(e)) toast.info('Share cancelled');
      else { console.error('Stylist card export failed:', e); toast.error('Failed to export stylist card'); }
    } finally { setIsCreatingBarberCard(false); }
  }, [createBarberCard, selectedHairstyle]);

  /* ─── Save & rate ───────────────────────────────────────────────────────── */
  const handleSaveLook = useCallback(async () => {
    if (!generationId || isGuest || isSaving) return;
    setIsSaving(true);
    triggerHaptic();
    try {
      if (isSaved) {
        setIsSaved(false);
        toast.success('Removed from saved looks');
      } else {
        const r = await apiService.saveLook(generationId, { title: selectedHairstyle?.name || 'My Look' });
        if (r.success) { setIsSaved(true); toast.success('Saved to your looks!'); }
        else toast.error(r.message || 'Failed to save');
      }
    } catch { toast.error('Failed to save look'); }
    finally { setIsSaving(false); }
  }, [generationId, isGuest, isSaving, isSaved, selectedHairstyle?.name]);

  const handleRate = useCallback(async (newRating: number) => {
    if (!generationId || isGuest) return;
    setIsRating(true);
    try {
      const r = await apiService.rateGeneration(generationId, newRating);
      if (r.success) { setRating(newRating); triggerHaptic(ImpactStyle.Medium); }
      else toast.error(r.message || 'Failed to rate');
    } catch { toast.error('Failed to save rating'); }
    finally { setIsRating(false); }
  }, [generationId, isGuest]);

  /* ─── Compare gestures ──────────────────────────────────────────────────── */
  const moveDivider = useCallback((clientX: number) => {
    const el = sliderContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSliderPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pressStart.current = { x: e.clientX, t: Date.now() };
    if (compare) {
      isDraggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      moveDivider(e.clientX);
    } else {
      // Press and hold to see the original.
      setPeek(true);
      setShowCompareHint(false);
    }
  }, [compare, moveDivider]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (compare && isDraggingRef.current) moveDivider(e.clientX);
  }, [compare, moveDivider]);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setPeek(false);
    pressStart.current = null;
  }, []);

  /* ─── Loading guard ─────────────────────────────────────────────────────── */
  if (!beforeImageUrl || !afterImageUrl) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B0B0B]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
      </div>
    );
  }

  const showingBefore = peek;

  return (
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-[#0B0B0B]">
      {/* ─── Image plane ─────────────────────────────────────────────────── */}
      <div
        ref={sliderContainerRef}
        className={cn('absolute inset-0 touch-none', compare && 'cursor-ew-resize')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Original, underneath */}
        <img
          src={beforeImageUrl}
          alt="Your original photo"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Result on top. In compare mode it is clipped by the divider; on a
            press-and-hold it lifts entirely so the original shows through. */}
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            clipPath: compare ? `inset(0 0 0 ${sliderPosition}%)` : undefined,
            opacity: showingBefore ? 0 : 1,
          }}
        >
          {isAfterImageLoading && (
            <div className="absolute inset-0 z-10 animate-pulse bg-[#141414]" />
          )}
          <img
            src={afterImageUrl}
            alt={`Your look: ${selectedHairstyle?.name || ''}`}
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: isAfterImageLoading ? 0 : 1, filter: ENHANCE }}
            onLoad={() => setIsAfterImageLoading(false)}
            onError={() => setIsAfterImageLoading(false)}
          />
        </div>

        {/* Divider — a brass hairline, not a chrome slider widget */}
        {compare && (
          <div
            className="absolute inset-y-0 z-10 w-px bg-brass"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brass shadow-lg">
              <IonIcon icon={swapHorizontalOutline} style={{ fontSize: 20, color: '#fff' }} />
            </div>
          </div>
        )}
      </div>

      {/* Scrims. Two soft gradients rather than panels, so the photo still reads
          edge to edge but the controls stay legible on a light result. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

      {/* ─── Top row ─────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
      >
        <button
          onClick={() => { triggerHaptic(); onTryAnother?.(); }}
          aria-label="Close"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur-md active:scale-95"
        >
          <IonIcon icon={closeOutline} style={{ fontSize: 22, color: '#fff' }} />
        </button>

        <button
          onClick={() => { triggerHaptic(); setCompare((c) => !c); setShowCompareHint(false); }}
          className={cn(
            'h-10 rounded-full px-4 text-[13px] font-medium backdrop-blur-md active:scale-95',
            compare ? 'bg-brass text-white' : 'bg-black/35 text-white'
          )}
        >
          {compare ? 'Done' : 'Compare'}
        </button>
      </div>

      {/* "Before" marker while peeking or comparing */}
      <AnimatePresence>
        {(showingBefore || compare) && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-md"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 62px)' }}
          >
            Before
          </motion.span>
        )}
      </AnimatePresence>

      {/* ─── Bottom: caption + actions ───────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 px-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }}
      >
        {/* Hold-to-compare hint, shown once */}
        <AnimatePresence>
          {showCompareHint && !compare && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 text-center text-[12px] text-white/70"
            >
              Hold the photo to see your original
            </motion.p>
          )}
        </AnimatePresence>

        {/* Lookbook caption */}
        <h1 className="font-display text-[26px] italic leading-tight text-white">
          {selectedHairstyle?.name || 'Your look'}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-[12px] text-white/55">
            AI preview — results are approximations
          </p>
          {/* Shown only when the output-quality scorer actually rated identity
              preservation highly against the original selfie. It is a real
              measurement, not a badge — so it stays absent rather than
              degrading to a lower grade when the score is mediocre. */}
          {typeof generationStatus?.identityScore === 'number' &&
            generationStatus.identityScore >= LIKENESS_THRESHOLD && (
              <span className="flex items-center gap-1 text-[12px] text-brass">
                <IonIcon icon={checkmarkCircle} style={{ fontSize: 14 }} />
                Likeness verified
              </span>
            )}
        </div>

        {/* Primary action */}
        <button
          onClick={handleShareCollage}
          disabled={isCreatingCollage}
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99] disabled:opacity-60"
        >
          {isCreatingCollage ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <IonIcon icon={shareOutline} style={{ fontSize: 19 }} />
          )}
          Share your look
        </button>

        {/* Secondary row — quiet glyphs, no competing fills */}
        <div className="mt-2 flex items-center justify-between">
          <SecondaryAction
            icon={isSaved ? bookmark : bookmarkOutline}
            label={isSaved ? 'Saved' : 'Save'}
            active={isSaved}
            disabled={isSaving || isGuest || !generationId}
            onClick={handleSaveLook}
          />
          <SecondaryAction
            icon={downloadOutline}
            label="Download"
            busy={isExporting}
            onClick={handleExport}
          />
          <SecondaryAction
            icon={cutOutline}
            label="Stylist"
            busy={isCreatingBarberCard}
            onClick={handleBarberExport}
          />
          <SecondaryAction
            icon={refreshOutline}
            label="Retry"
            onClick={() => { triggerHaptic(); (onRetrySameStyle || onTryAnother)?.(); }}
          />
        </div>

        {/* Rating sits BELOW the actions, not next to the caption. A row of empty
            outline stars right under the style name read louder than the Share
            button, and shares are what actually grow the app. */}
        {generationId && !isGuest && (
          <div className="mt-2 flex items-center justify-center gap-2.5">
            <span className="text-[11px] text-white/45">Rate this look</span>
            <StarRating value={rating} onChange={handleRate} size="sm" showLabel={false} readonly={isRating} />
          </div>
        )}

        {/* One contextual nudge at a time — never stack a sign-in and an upsell */}
        {isGuest && onShowAuth ? (
          <button
            onClick={() => { triggerHaptic(); onShowAuth(); }}
            className="mt-3 w-full text-center text-[13px] text-white/70 underline underline-offset-4"
          >
            Sign in to save this look
          </button>
        ) : !isPro && typeof availableCredits === 'number' && availableCredits < 3 && onShowPricing ? (
          <button
            onClick={() => { triggerHaptic(); onShowPricing(); }}
            className="mt-3 w-full text-center text-[13px] text-white/70 underline underline-offset-4"
          >
            {availableCredits === 0 ? 'Out of looks — get more' : `${availableCredits} left — get more`}
          </button>
        ) : null}
      </div>
    </div>
  );
};

/* ─── Bits ────────────────────────────────────────────────────────────────── */

const SecondaryAction: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  busy?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, active, busy, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled || busy}
    className={cn(
      'flex flex-1 flex-col items-center gap-1 py-2.5 active:scale-95 disabled:opacity-35',
      active ? 'text-brass' : 'text-white/80'
    )}
  >
    {busy ? (
      <span className="h-[22px] w-[22px] animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
    ) : (
      <IonIcon icon={icon} style={{ fontSize: 22 }} />
    )}
    <span className="text-[11px]">{label}</span>
  </button>
);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isShareCancel(e: any): boolean {
  return e.name === 'AbortError' || e.message?.toLowerCase().includes('cancel');
}

export default React.memo(ResultsViewer);
