// AppHeader.tsx — the app chrome bar, on the verified Retinue pattern.
//
// Flat `bg-surface`, NO title text, NO border, NO blur; owns the top safe-area
// inset so the natively-tinted status bar, this bar and the page read as one
// continuous plane. Menu glyph left, quiet 44x44 actions right.
//
// The menu sheet carries the navigation that used to live in the bottom tab
// bar (Looks, Profile, Rewards, account) — the browse feed is now full-bleed
// and a persistent bottom bar would just eat vertical space from the imagery.

import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  searchOutline, heartOutline, personOutline, giftOutline, logOutOutline,
  chevronForwardOutline, sparklesOutline,
} from 'ionicons/icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LooksChip } from '@/components/ui/LooksChip';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  user: any;
  isAuthenticated: boolean;
  setShowPricing: (show: boolean) => void;
  onShowAuth?: () => void;
  onOpenSearch?: () => void;
  onNavigate?: (dest: 'looks' | 'profile') => void;
  onOpenRewards?: () => void;
  onSignOut?: () => void;
}

/**
 * A menu row.
 *
 * Was a 21px ionicon and a label on a bare button — a settings list. Pinterest's
 * own account menu leads with a soft round token and a chevron, which reads as
 * navigation rather than as preferences, and gives the row a shape at a glance.
 */
const MenuRow: React.FC<{
  icon: string;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, sublabel, onClick, danger }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left transition-colors active:bg-surface"
  >
    <span
      className={cn(
        'grid h-11 w-11 shrink-0 place-items-center rounded-full',
        danger ? 'bg-danger/10' : 'bg-surface'
      )}
    >
      <IonIcon
        icon={icon}
        style={{ fontSize: 19 }}
        className={danger ? 'text-danger' : 'text-brass'}
      />
    </span>
    <span className="min-w-0 flex-1">
      <span className={cn('block text-[15px]', danger ? 'text-danger' : 'text-ink')}>{label}</span>
      {sublabel && <span className="mt-0.5 block truncate text-[12px] text-ink-3">{sublabel}</span>}
    </span>
    {!danger && (
      <IonIcon icon={chevronForwardOutline} style={{ fontSize: 16 }} className="shrink-0 text-ink-3" />
    )}
  </button>
);

const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  isAuthenticated,
  setShowPricing,
  onShowAuth,
  onOpenSearch,
  onNavigate,
  onOpenRewards,
  onSignOut,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasSeenValue = isAuthenticated || Number(user?.credits) > 0;

  return (
    <>
      <header
        className="sticky top-0 z-header flex shrink-0 items-center justify-between bg-surface px-1.5 pb-0.5"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors active:bg-surface-2"
        >
          {/* Three-bar glyph, third bar short — matches the reference weight. */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <rect x="2" y="4.6" width="18" height="2.1" rx="1.05" fill="currentColor" />
            <rect x="2" y="10" width="18" height="2.1" rx="1.05" fill="currentColor" />
            <rect x="2" y="15.4" width="11" height="2.1" rx="1.05" fill="currentColor" />
          </svg>
        </button>

        <span className="flex items-center gap-1">
          {isAuthenticated ? (
            <LooksChip
              credits={Number(user?.credits) || 0}
              visible={hasSeenValue}
              onClick={() => setShowPricing(true)}
            />
          ) : (
            <button
              onClick={() => onShowAuth?.()}
              className="h-9 whitespace-nowrap rounded-full px-3.5 text-label text-ink-2 transition-colors active:bg-surface-2"
            >
              Sign in
            </button>
          )}
          <button
            onClick={() => onOpenSearch?.()}
            aria-label="Search"
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors active:bg-surface-2"
          >
            <IonIcon icon={searchOutline} style={{ fontSize: 22 }} />
          </button>
        </span>
      </header>

      <BottomSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        breakpoints={[0, 0.62]}
        initialBreakpoint={0.62}
      >
        {/* The sheet used to open with a bold sans "Hair Studio" and an email
            underneath, then four flat rows — a settings screen wearing a sheet.
            It now opens on the brand's own lettering, with the identity below it,
            and the rows read as places to go. */}
        <div className="pb-2">
          <div className="flex flex-col items-center pb-5">
            <img src="/brand/wordmark-light.png" alt="Hair Studio" className="h-[30px] w-auto" />
            <p className="mt-2 text-[12px] text-ink-3">
              {isAuthenticated ? user?.email : 'Browsing as a guest'}
            </p>
          </div>

          {!isAuthenticated && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onShowAuth?.();
              }}
              className="mb-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99]"
            >
              <IonIcon icon={sparklesOutline} style={{ fontSize: 17 }} />
              Save your looks
            </button>
          )}

          <div className="space-y-0.5">
            <MenuRow
              icon={heartOutline}
              label="Saved looks"
              sublabel="Everything you kept"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.('looks');
              }}
            />
            <MenuRow
              icon={personOutline}
              label="Profile"
              sublabel="Your plan and settings"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.('profile');
              }}
            />
            <MenuRow
              icon={giftOutline}
              label="Invite friends"
              sublabel="You both get free looks"
              onClick={() => {
                setMenuOpen(false);
                onOpenRewards?.();
              }}
            />
            {isAuthenticated && onSignOut && (
              <>
                <div className="my-2 h-px bg-hairline" />
                <MenuRow
                  icon={logOutOutline}
                  label="Sign out"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                />
              </>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default AppHeader;
