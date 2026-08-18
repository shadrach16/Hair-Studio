// AuthModal — the sign-in sheet.
//
// Rebuilt to the app's own design system. What was here: a Google "G" in a grey
// rounded square, bold system-sans headings, a 2x2 grid of emoji benefit chips
// (💇 📸 💾 🔓), a Coins glyph beside "Free looks", a purple Crown and a "Pro
// Benefits" list that promised "Unlimited hairstyle generations" — which no tier
// in the product offers. Grey-on-grey, four accent colours, and a claim the app
// cannot keep, on the screen where a stranger decides whether to trust it.
//
// Now: the lettering does the work. The brand's own penmanship wordmark, an
// editorial line in Fraunces, and reasons written as sentences rather than as
// chips. Surface tokens throughout, one brass rule, one primary action.

import React from 'react';
import GoogleSignInButton from './GoogleSignInButton';
import { IonIcon } from '@ionic/react';
import { closeOutline, sparklesOutline, bookmarkOutline, phonePortraitOutline } from 'ionicons/icons';
import { AnimatePresence, motion } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  /** Kept for call-site compatibility; the Pro list it used to render is gone. */
  showProBenefits?: boolean;
  /** 'default' = generic sign-in, 'credits' = the welcome sheet after a first tap */
  variant?: 'default' | 'credits';
  /** A style the person was looking at, shown so the sheet stays in context. */
  hairstyleThumbnail?: string;
  hairstyleName?: string;
}

/** Plain sentences, not chips. Each is something the account actually does. */
const REASONS = [
  { icon: sparklesOutline, text: 'Two looks a day, free' },
  { icon: bookmarkOutline, text: 'Keep the looks you like' },
  { icon: phonePortraitOutline, text: 'Pick up on any device' },
];

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  variant = 'default',
  hairstyleThumbnail,
  hairstyleName,
}: AuthModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  React.useEffect(() => {
    // Preserve the current studio state so we redirect back here after sign-in
    const currentStatus =
      new URLSearchParams(window.location.search).get('studio_status') || 'discover';
    localStorage.setItem('studio_status', currentStatus);
  }, []);

  const resolvedTitle =
    title || (variant === 'credits' ? 'Start with two looks a day' : 'Save your looks');
  const resolvedDescription =
    description ||
    (variant === 'credits'
      ? 'A free account keeps every look you make, on any device.'
      : 'An account keeps what you make. Browsing needs no sign-in.');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 330 }}
            className="relative w-full max-w-md sm:mx-4"
          >
            <div className="overflow-hidden rounded-t-[28px] bg-surface-2 sm:rounded-[28px]">
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="h-1 w-9 rounded-full bg-hairline" />
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-3 active:scale-95"
              >
                <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
              </button>

              <div className="px-7 pb-9 pt-6">
                {/* The mark. Same PNG the boot beat uses, so the launch screen and
                    this sheet are literally the same lettering. */}
                <img
                  src="/brand/wordmark-light.png"
                  alt="Hair Studio"
                  className="mx-auto h-[38px] w-auto"
                />
                <div className="mx-auto mt-3.5 h-px w-10 bg-brass/40" />

                {/* If they were looking at a style, keep it in the room. */}
                {hairstyleThumbnail && (
                  <div className="mt-6 flex items-center gap-3 rounded-2xl bg-surface p-2.5">
                    <img
                      src={hairstyleThumbnail}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-3">Trying on</p>
                      <p className="truncate text-[14px] text-ink">{hairstyleName}</p>
                    </div>
                  </div>
                )}

                <h2 className="mt-6 text-center font-display text-[26px] leading-tight text-ink">
                  {resolvedTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-[280px] text-center text-[14px] leading-relaxed text-ink-2">
                  {resolvedDescription}
                </p>

                <ul className="mt-6 space-y-3">
                  {REASONS.map((r) => (
                    <li key={r.text} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface">
                        <IonIcon icon={r.icon} style={{ fontSize: 15 }} className="text-brass" />
                      </span>
                      <span className="text-[14px] text-ink-2">{r.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <GoogleSignInButton
                    onSuccess={handleSuccess}
                    className="h-[52px] w-full rounded-full text-[15px] font-semibold"
                  />
                </div>

                <button
                  onClick={onClose}
                  className="mt-3 w-full py-2 text-center text-[13px] text-ink-3"
                >
                  Keep browsing
                </button>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-3">
                  By continuing you agree to our{' '}
                  <a href="/terms" className="underline underline-offset-2">Terms</a> and{' '}
                  <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
