// AppHeader.tsx — the app chrome bar (M2 §4.1/§4.3/§4.4).
//
// Rebuilt on the verified Retinue/Nerve pattern: a FLAT bar on --surface with
// no border, no blur and no title text, so the natively-tinted status bar, this
// bar and the page read as one continuous plane (see lib/native.ts).
//
// Removed here, deliberately:
//  - the avatar DROPDOWN MENU — a mouse pattern. Its items (Credits, Rewards,
//    Help, Sign out) all already exist on the Profile tab, which is where
//    native apps put them.
//  - the hamburger DRAWER (Sidebar) — replaced by the three tabs.
//  - the coin-count pill — replaced by the quiet "N looks today" chip, so the
//    chrome talks about outcomes rather than currency.

import React from 'react';
import { Capacitor } from '@capacitor/core';
import { ChromeBar } from '@/components/ui/ChromeBar';
import { LooksChip } from '@/components/ui/LooksChip';

// Account actions (sign out, help, rewards, delete) intentionally live on the
// Profile tab, not in the chrome — so this component no longer takes them.
interface AppHeaderProps {
  user: any;
  isAuthenticated: boolean;
  setShowPricing: (show: boolean) => void;
  onShowAuth?: () => void;
}

const LOGO_URL =
  'https://res.cloudinary.com/djpcokxvn/image/upload/v1777118970/HairStudio/app_logo_premium.png';

const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  isAuthenticated,
  setShowPricing,
  onShowAuth,
}) => {
  // The user has "seen value" once they hold any credits; guests with an empty
  // wallet get no pricing chrome at all (3.1 — value before pricing).
  const hasSeenValue = isAuthenticated || Number(user?.credits) > 0;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-surface focus:text-ink focus:underline"
      >
        Skip to main content
      </a>

      <ChromeBar
        className="sticky top-0 z-header w-full"
        leading={
          <div className="flex items-center gap-2">
            {/* The hamburger drawer is gone: this is a mobile-only app and the
                three tabs replace it entirely. */}
            <a
              href={Capacitor.isNativePlatform() ? undefined : '/'}
              className="flex items-center gap-2 pl-1.5"
            >
              <img
                className="w-8 h-8 rounded-full object-cover"
                src={LOGO_URL}
                alt="Hair Studio home"
              />
              {/* Wordmark in the editorial serif — the one place the brand
                  speaks in the chrome. */}
              <span className="font-display text-title-sm text-ink tracking-tight">
                Hair Studio
              </span>
            </a>
          </div>
        }
        trailing={
          isAuthenticated ? (
            <LooksChip
              credits={Number(user?.credits) || 0}
              visible={hasSeenValue}
              onClick={() => setShowPricing(true)}
            />
          ) : (
            // Text pill, not the 44x44 icon button — a label needs width or it
            // wraps ("Sign / in"). Quiet by design: signing in is not the
            // primary action on the discovery screen.
            <button
              type="button"
              onClick={() => onShowAuth?.()}
              className="h-9 whitespace-nowrap rounded-full px-3.5 text-label text-ink-2 transition-colors active:bg-surface-2"
            >
              Sign in
            </button>
          )
        }
      />
    </>
  );
};

export default AppHeader;
