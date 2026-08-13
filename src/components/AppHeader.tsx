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
import { searchOutline, heartOutline, personOutline, giftOutline, logOutOutline } from 'ionicons/icons';
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

const MenuRow: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-xl px-2 py-3.5 text-left transition-colors active:bg-surface"
  >
    <IonIcon
      icon={icon}
      style={{ fontSize: 21 }}
      className={danger ? 'text-danger' : 'text-ink-2'}
    />
    <span className={cn('text-body', danger ? 'text-danger' : 'text-ink')}>{label}</span>
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
        breakpoints={[0, 0.5]}
        initialBreakpoint={0.5}
        title="Hair Studio"
        subtitle={isAuthenticated ? user?.email : 'Not signed in'}
      >
        <div className="space-y-0.5">
          <MenuRow
            icon={heartOutline}
            label="Saved looks"
            onClick={() => {
              setMenuOpen(false);
              onNavigate?.('looks');
            }}
          />
          <MenuRow
            icon={personOutline}
            label="Profile"
            onClick={() => {
              setMenuOpen(false);
              onNavigate?.('profile');
            }}
          />
          <MenuRow
            icon={giftOutline}
            label="Free credits & referrals"
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
      </BottomSheet>
    </>
  );
};

export default AppHeader;
