// RewardsCenterModal — one sheet, one job: invite a friend.
//
// It was four tabs. Earn (watch an ad for 0.25 of a credit, which is an eighth
// of a look, capped at two a day — four days of adverts for one try-on), Streaks,
// Referrals, and a credit ledger. Three of those existed to make a currency feel
// like a game, and the currency is gone: the free tier gives two looks a day
// without anyone earning anything.
//
// What is left is the one that compounds. Referrals bring users, the invite is a
// real artefact people send to friends, and it costs nothing to run.
//
// Removed with it: the rewarded-ad surface (AdService is still in the codebase
// and can be brought back behind a better rate), the streak hub, and the ledger
// table. If the ledger is wanted again it belongs on Profile, not behind a tab
// in a rewards centre.

import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api';
import { buildReferralLink } from '@/lib/attribution';
import { BASE_GENERATION_COST } from '@/lib/generationTiers';
import AuthModal from '@/components/AuthModal';
import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  copyOutline,
  shareSocialOutline,
  peopleOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPaywall?: () => void;
}

interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  creditsEarned: number;
}

const SURFACE = '#FAF8F5';
const INK = '#1C1917';
const BRASS = '#B6892F';

/* ── The invite card ────────────────────────────────────────────────────────
   This is the only thing in the product a stranger sees before they install, so
   it is the one export that has to look like the app. The old card was charcoal
   with an amber glow, "💇 HAIR STUDIO", "A I  T R Y - O N", a 96px code on an
   amber gradient and "🎁 You both get free credits" — the retired warning-yellow,
   emoji as branding, and a currency the app no longer speaks. §6.2: exports are
   emoji-free and editorial. */
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

async function buildInviteCard(code: string): Promise<Blob | null> {
  try {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const cx = W / 2;

    // The display face is bundled, but canvas will silently fall back to a
    // system serif if it is not resolved before the first fillText.
    try {
      await (document as any).fonts?.load?.('600 88px "Fraunces Variable"');
      await (document as any).fonts?.ready;
    } catch {
      /* fall back to Georgia below */
    }
    const display = '"Fraunces Variable", Fraunces, Georgia, serif';
    const ui = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

    ctx.fillStyle = SURFACE;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    // Wordmark, drawn as the app draws it: the display serif, brass, quiet.
    ctx.fillStyle = BRASS;
    ctx.font = `600 46px ${display}`;
    ctx.fillText('Hair Studio', cx, 168);
    ctx.fillStyle = BRASS;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(cx - 34, 196, 68, 2);
    ctx.globalAlpha = 1;

    ctx.fillStyle = INK;
    ctx.font = `600 84px ${display}`;
    ctx.fillText('Braids, locs', cx, 430);
    ctx.fillText('and fades —', cx, 528);
    ctx.fillText('on your face', cx, 626);

    ctx.fillStyle = '#57534E';
    ctx.font = `400 32px ${ui}`;
    ctx.fillText('See the style before you sit in the chair.', cx, 700);

    const cardX = 140;
    const cardY = 800;
    const cardW = W - 280;
    const cardH = 280;
    roundRect(ctx, cardX, cardY, cardW, cardH, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E7E2DC';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#A8A29E';
    ctx.font = `600 24px ${ui}`;
    ctx.letterSpacing = '4px';
    ctx.fillText('INVITE CODE', cx, cardY + 76);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = INK;
    ctx.font = `600 86px ${display}`;
    ctx.fillText(code, cx, cardY + 176);

    ctx.fillStyle = '#57534E';
    ctx.font = `400 27px ${ui}`;
    ctx.fillText('We both get free looks', cx, cardY + 232);

    ctx.fillStyle = '#A8A29E';
    ctx.font = `400 26px ${ui}`;
    ctx.fillText('Tap the link to get the app', cx, 1230);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
  } catch {
    return null;
  }
}

/* ── The sheet ─────────────────────────────────────────────────────────────── */

function InviteBody({ onAuthClick }: { onAuthClick: () => void }) {
  const { isAuthenticated } = useAuth();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appUrl = import.meta.env.VITE_APP_URL || 'https://app.hairstudio.ai';

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getReferralInfo();
        if (active && result.success) setInfo(result.data);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const code = info?.referralCode;
  const link = code ? buildReferralLink(code) : appUrl;

  const handleCopy = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        toast.success('Invite link copied');
        return;
      }
    } catch {
      /* permission denied */
    }
    toast.error('Clipboard is not available on this device.');
  }, [link]);

  const handleShare = useCallback(async () => {
    const text = code
      ? `Try Hair Studio — braids, locs and fades on your selfie. Use my code ${code} and we both get free looks: ${link}`
      : `Try Hair Studio: ${link}`;
    try {
      const blob = code ? await buildInviteCard(code) : null;

      if (blob && Capacitor.isNativePlatform()) {
        const b64 = await blobToBase64(blob);
        const fn = `hairstudio_invite_${Date.now()}.png`;
        await Filesystem.writeFile({ path: fn, data: b64, directory: Directory.Cache });
        const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: fn });
        await Share.share({ title: 'Hair Studio', text, url: link, files: [uri], dialogTitle: 'Invite a friend' });
        setTimeout(async () => {
          try {
            await Filesystem.deleteFile({ path: fn, directory: Directory.Cache });
          } catch {}
        }, 3000);
        return;
      }

      if (blob && (navigator as any).share) {
        const file = new File([blob], 'hairstudio_invite.png', { type: 'image/png' });
        if ((navigator as any).canShare?.({ files: [file] })) {
          await (navigator as any).share({ title: 'Hair Studio', text, url: link, files: [file] });
          return;
        }
      }

      await Share.share({ title: 'Hair Studio', text, url: link });
    } catch {
      await handleCopy();
    }
  }, [code, link, handleCopy]);

  if (!isAuthenticated) {
    return (
      <div className="px-1 pb-4 pt-2 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface">
          <IonIcon icon={peopleOutline} style={{ fontSize: 24 }} className="text-brass" />
        </span>
        <h3 className="mt-4 font-display text-[24px] leading-tight text-ink">Invite a friend</h3>
        <p className="mx-auto mt-2 max-w-[270px] text-[14px] leading-relaxed text-ink-2">
          You both get free looks. Sign in to get your invite code.
        </p>
        <button
          onClick={onAuthClick}
          className="mt-6 h-[50px] w-full rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99]"
        >
          Sign in
        </button>
      </div>
    );
  }

  const looksEarned = Math.floor(Number(info?.creditsEarned || 0) / BASE_GENERATION_COST);

  return (
    <div className="px-1 pb-4 pt-1">
      <div className="text-center">
        <h3 className="font-display text-[26px] leading-tight text-ink">Invite a friend</h3>
        <p className="mx-auto mt-1.5 max-w-[280px] text-[14px] leading-relaxed text-ink-2">
          Send them your code. When they try their first look, you both get free
          looks.
        </p>
      </div>

      {/* The code, treated as the object it is rather than as a form field. */}
      <div className="mt-6 rounded-3xl bg-surface p-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3">Your code</p>
        {isLoading ? (
          <div className="mx-auto mt-3 h-9 w-32 animate-pulse rounded-lg bg-hairline" />
        ) : (
          <p className="mt-2 font-display text-[34px] leading-none text-ink">{code || '—'}</p>
        )}
        <button
          onClick={handleCopy}
          disabled={!code}
          className="mx-auto mt-4 flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2 text-[13px] text-ink-2 ring-1 ring-hairline active:scale-95 disabled:opacity-40"
        >
          <IonIcon icon={copyOutline} style={{ fontSize: 15 }} />
          Copy link
        </button>
      </div>

      <button
        onClick={handleShare}
        disabled={!code}
        className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99] disabled:opacity-40"
      >
        <IonIcon icon={shareSocialOutline} style={{ fontSize: 18 }} />
        Share invite
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface p-4 text-center">
          <IonIcon icon={peopleOutline} style={{ fontSize: 18 }} className="text-ink-3" />
          <p className="mt-1 font-display text-[22px] leading-none text-ink">
            {info?.referralCount || 0}
          </p>
          <p className="mt-1 text-[11px] text-ink-3">Friends joined</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 text-center">
          <IonIcon icon={sparklesOutline} style={{ fontSize: 18 }} className="text-ink-3" />
          {/* The API returns CREDITS; showing it unconverted under a "looks"
              label would double the number they think they earned. */}
          <p className="mt-1 font-display text-[22px] leading-none text-ink">{looksEarned}</p>
          <p className="mt-1 text-[11px] text-ink-3">Looks earned</p>
        </div>
      </div>
    </div>
  );
}

export default function RewardsCenterModal({ isOpen, onClose }: RewardsCenterModalProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 330 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-surface-2 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[28px]"
            >
              <div className="flex justify-center pt-3">
                <div className="h-1 w-9 rounded-full bg-hairline" />
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-3 active:scale-95"
              >
                <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
              </button>

              <div className="px-6 pb-8 pt-6">
                <InviteBody onAuthClick={() => setShowAuthModal(true)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
