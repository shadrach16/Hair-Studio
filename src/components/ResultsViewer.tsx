import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Share2, Download, RotateCcw, Crown, Bookmark, BookmarkCheck, RefreshCw, Scissors, ArrowUpRight, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ResultsActionSheet } from '@/components/studio/ResultsActionSheet';
import { StarRating } from '@/components/StarRating';
import { apiService } from '@/lib/api';
import { renderShareCard } from '@/lib/shareCard';
import { buildReferralLink } from '@/lib/attribution';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultsViewerProps {
  selectedPhoto: File | null;
  selectedHairstyle: { name: string } | null;
  generationStatus: { generatedImageUrl: string | null } | null;
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
  onShowRewards,
  onShowAuth,
}) => {
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'before' | 'after' | 'compare'>('after');
  const [isAfterImageLoading, setIsAfterImageLoading] = useState(true);
  const [isCreatingCollage, setIsCreatingCollage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingBarberCard, setIsCreatingBarberCard] = useState(false);

  // Compare slider
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [showCompareHint, setShowCompareHint] = useState(false);

  // Save & Rate
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

  // Compare hint â€” show once
  useEffect(() => {
    if (activeTab === 'compare') {
      const seen = localStorage.getItem('hasSeenCompareHint');
      if (!seen) {
        setShowCompareHint(true);
        const t = setTimeout(() => {
          setShowCompareHint(false);
          localStorage.setItem('hasSeenCompareHint', '1');
        }, 2500);
        return () => clearTimeout(t);
      }
    }
  }, [activeTab]);

  /* â”€â”€â”€ Canvas: Before/After Collage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const createCollageImage = useCallback(async (): Promise<Blob | null> => {
    if (!beforeImageUrl || !afterImageUrl) return null;
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      const beforeImg = new Image();
      const afterImg = new Image();
      let loaded = 0;

      const onLoad = () => {
        loaded++;
        if (loaded < 2) return;

        const imgW = Math.max(beforeImg.width, afterImg.width);
        const imgH = Math.max(beforeImg.height, afterImg.height);
        const pad = 24;
        const labelH = 48;

        canvas.width = imgW * 2 + pad * 3;
        canvas.height = imgH + pad * 2 + labelH * 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('Before', pad + imgW / 2, pad + 30);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText('After', pad * 2 + imgW + imgW / 2, pad + 30);

        const yOff = pad + labelH;
        ctx.drawImage(beforeImg, pad, yOff, imgW, imgH);
        ctx.drawImage(afterImg, pad * 2 + imgW, yOff, imgW, imgH);

        if (!isPro) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.fillText('Made with Hair Studio AI  ·  @ShadHairStudio', canvas.width / 2, canvas.height - 12);
        }
        if (selectedHairstyle?.name) {
          ctx.fillStyle = '#1a1a1a';
          ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
          ctx.fillText(selectedHairstyle.name, canvas.width / 2, canvas.height - pad - (isPro ? 0 : 24));
        }

        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      };

      beforeImg.crossOrigin = 'anonymous';
      afterImg.crossOrigin = 'anonymous';
      beforeImg.onload = onLoad;
      afterImg.onload = onLoad;
      beforeImg.onerror = () => resolve(null);
      afterImg.onerror = () => resolve(null);
      beforeImg.src = beforeImageUrl;
      afterImg.src = afterImageUrl;
    });
  }, [beforeImageUrl, afterImageUrl, isPro, selectedHairstyle?.name]);

  /* â”€â”€â”€ Share Collage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ Share Single Image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ Export with tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleExport = useCallback(async (_cleanExport: boolean) => {
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

      // Track export in background (non-blocking)
      apiService.exportImage(afterImageUrl, selectedHairstyle?.name || 'Unknown').catch(() => {});
    } catch (e: any) {
      console.error('Export failed:', e);
      toast.error('Failed to export');
    } finally { setIsExporting(false); }
  }, [afterImageUrl, selectedHairstyle?.name]);

  /* â”€â”€â”€ Save Look â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ Rate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€â”€ Compare Slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    setSliderPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handleSliderMove(e.clientX);
  }, [handleSliderMove]);

  const handleSliderPointerMove = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) handleSliderMove(e.clientX);
  }, [handleSliderMove]);

  const handleSliderPointerUp = useCallback(() => { isDraggingRef.current = false; }, []);

  /* â”€â”€â”€ Canvas: Barber Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const createBarberCard = useCallback(async (): Promise<Blob | null> => {
    if (!afterImageUrl) return null;
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      const W = 1080, H = 1440;
      canvas.width = W;
      canvas.height = H;

      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Draw the generated image filling the entire canvas
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(W / iw, H / ih);
        const sw = iw * scale, sh = ih * scale;
        const ox = (W - sw) / 2, oy = (H - sh) / 2;
        ctx.drawImage(img, ox, oy, sw, sh);

        // Bottom gradient overlay for text readability
        const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);

        // Top subtle gradient for branding
        const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.15);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, W, H * 0.15);

        ctx.textAlign = 'center';

        // Top: small branding
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('HAIR STUDIO AI', W / 2, 48);

        // Bottom section: style name + tagline
        const name = selectedHairstyle?.name || 'New Hairstyle';

        // Style name (large)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
        // Word-wrap if name is too long
        const maxW = W - 120;
        const nameMetrics = ctx.measureText(name);
        if (nameMetrics.width > maxW) {
          // Two-line wrap
          const words = name.split(' ');
          let line1 = '', line2 = '';
          for (const w of words) {
            const test = line1 ? line1 + ' ' + w : w;
            if (ctx.measureText(test).width <= maxW) { line1 = test; }
            else { line2 += (line2 ? ' ' : '') + w; }
          }
          ctx.fillText(line1, W / 2, H - 160);
          ctx.fillText(line2, W / 2, H - 110);
        } else {
          ctx.fillText(name, W / 2, H - 120);
        }

        // Tagline
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '22px system-ui, -apple-system, sans-serif';
        ctx.fillText('Show your stylist this look', W / 2, H - 68);

        // URL
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.fillText('@ShadHairStudio', W / 2, H - 36);

        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      };

      img.onerror = () => resolve(null);
      img.src = afterImageUrl;
    });
  }, [afterImageUrl, selectedHairstyle]);

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
          text: 'Here\'s the style I want - generated with Hair Studio AI',
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

  /* â”€â”€â”€ Loading guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (!beforeImageUrl || !afterImageUrl) {
    return (
      <div className="flex aspect-[4/5] w-full max-h-[70vh] items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-black/[0.04]">
        <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
      </div>
    );
  }

  /* â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="w-full mx-auto overflow-hidden">
      {/* Hero â€” minimal */}
      <div className="text-center pt-4 pb-3 px-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-1">Result</p>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedHairstyle?.name}</h2>
      </div>

      {/* Segmented control */}
      <div className="px-4 mb-4">
        <div className="p-0.5 bg-gray-100 rounded-xl flex" role="tablist" aria-label="Image comparison">
          {(['before', 'compare', 'after'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); triggerHaptic(); }}
              className={cn(
                'flex-1 py-2 px-3 rounded-[10px] text-center text-sm font-semibold transition-all duration-200',
                activeTab === tab
                  ? 'bg-[#1a1a1a] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="image-panel"
            >
              {tab === 'compare' ? 'Compare' : tab === 'before' ? 'Before' : 'After'}
            </button>
          ))}
        </div>
      </div>

      {/* Image panel */}
      <div
        className="relative aspect-[4/5] w-full bg-gray-50 rounded-2xl overflow-hidden ring-1 ring-black/[0.04]"
        id="image-panel"
        role="tabpanel"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'before' && (
            <motion.img
              key="before"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              src={beforeImageUrl}
              alt="Original photo"
              className="w-full h-full object-cover"
            />
          )}

          {activeTab === 'after' && (
            <motion.div key="after" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full">
              {isAfterImageLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10">
                  <p className="text-xs text-gray-400 font-medium">Loading...</p>
                </div>
              )}
              <img
                decoding="async"
                src={afterImageUrl}
                alt={`Generated: ${selectedHairstyle?.name}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: isAfterImageLoading ? 0 : 1 }}
                onLoad={() => setIsAfterImageLoading(false)}
                onError={() => setIsAfterImageLoading(false)}
              />
            </motion.div>
          )}

          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              ref={sliderContainerRef}
              className="relative w-full h-full overflow-hidden touch-none cursor-ew-resize select-none"
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
            >
              {/* Before â€” full, underneath */}
              <img src={beforeImageUrl} alt="Original" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

              {/* After â€” clipped from right */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
                <img src={afterImageUrl} alt="Generated" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              </div>

              {/* Handle */}
              <div className="absolute top-0 bottom-0 w-[2px] bg-white/70 z-10" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1a1a1a] shadow-lg flex items-center justify-center ring-2 ring-white/30">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M5 3L1 8L5 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11 3L15 8L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Labels */}
              <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/40 rounded-lg text-white text-[10px] font-semibold backdrop-blur-sm">Before</span>
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#1a1a1a]/80 rounded-lg text-white text-[10px] font-semibold backdrop-blur-sm">After</span>

              {/* First-time hint */}
              <AnimatePresence>
                {showCompareHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Drag to compare
                    <ChevronRightIcon className="w-3 h-3" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save & Rate strip */}
      {generationId && !isGuest && (
        <div className="flex items-center justify-between px-4 py-3 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mr-1">Rate</span>
            <StarRating value={rating} onChange={handleRate} size="sm" showLabel={false} readonly={isRating} />
          </div>
          <button
            onClick={handleSaveLook}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
              isSaved ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      )}

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        <ResultsActionSheet
          isOpen={true}
          isPro={isPro}
          isGuest={isGuest}
          onShareCollage={handleShareCollage}
          onShareImage={handleShare}
          onExport={handleExport}
          onTryAnother={onTryAnother || (() => {})}
          onRetrySameStyle={onRetrySameStyle}
          onBarberExport={handleBarberExport}
          onUpgrade={onShowPricing || (() => {})}
          onShowAuth={onShowAuth}
          isExporting={isExporting}
          isCreatingCollage={isCreatingCollage}
          isCreatingBarberCard={isCreatingBarberCard}
        />
      </div>

      {/* Desktop actions */}
      <div className="hidden lg:block p-4 mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleShareCollage} disabled={isCreatingCollage} className="h-12 rounded-xl bg-[#1a1a1a] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#2a2a2a] active:scale-[0.98] disabled:opacity-50 transition-all">
            {isCreatingCollage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share Before & After
          </button>
          <button onClick={handleShare} className="h-12 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-[0.98] transition-all">
            <ArrowUpRight className="w-4 h-4" />
            Share Image
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => handleExport(isPro)} disabled={isExporting} className="h-12 rounded-xl bg-gray-50 ring-1 ring-black/[0.04] text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 transition-all">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isPro ? 'HD' : 'Download'}
          </button>
          <button onClick={handleBarberExport} disabled={isCreatingBarberCard} className="h-12 rounded-xl bg-gray-50 ring-1 ring-black/[0.04] text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 transition-all">
            {isCreatingBarberCard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            Stylist Card
          </button>
          {onRetrySameStyle && (
            <button onClick={onRetrySameStyle} className="h-12 rounded-xl bg-gray-50 ring-1 ring-black/[0.04] text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] transition-all">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          )}
        </div>

        {onTryAnother && (
          <button onClick={onTryAnother} className="w-full h-12 rounded-xl text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 hover:text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all">
            <RotateCcw className="w-4 h-4" />
            Try Another Style
          </button>
        )}

        {typeof availableCredits === 'number' && availableCredits < 3 && onShowPricing && (
          <button onClick={onShowPricing} className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-black/[0.04] text-left flex items-center gap-3 hover:bg-gray-100 transition-all">
            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{availableCredits === 0 ? 'Out of credits' : `${availableCredits} credit${availableCredits === 1 ? '' : 's'} left`}</p>
              <p className="text-xs text-gray-400">Get more to keep generating</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
