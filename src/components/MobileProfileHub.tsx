// MobileProfileHub — the account screen.
//
// Rebuilt on the design system. What was here: two stat cards (a credit balance
// beside a "Best Streak" trophy), a streak hub, then two white cards of settings
// rows with icons in four different accent colours — amber, purple, grey, red —
// over Tailwind greys rather than the surface tokens. It read as a settings
// screen borrowed from another app.
//
// Now the person is the header, the one number that matters sits under it, and
// everything else is a quiet list. Streaks are gone: they were a habit mechanic
// for a currency the product no longer sells, and the free tier already resets
// daily without anyone maintaining a run.

import React, { useEffect } from 'react';
import { apiService, type User } from '@/lib/api';
import { IonIcon } from '@ionic/react';
import {
  chevronForwardOutline,
  helpCircleOutline,
  logOutOutline,
  giftOutline,
  colorWandOutline,
  personOutline,
  cardOutline,
} from 'ionicons/icons';
import { cn } from '@/lib/utils';
import { BASE_GENERATION_COST } from '@/lib/generationTiers';
import NotificationToggle from '@/components/NotificationToggle';
import { motion } from 'framer-motion';

interface MobileProfileHubProps {
  user: User | null;
  isAuthenticated: boolean;
  onOpenPaywall: () => void;
  onOpenRewards: () => void;
  onShowHelp: () => void;
  onShowAuth: () => void;
  onSignOut: () => void;
  onNavigateToStudio: () => void;
  refreshUser?: () => void;
}

const Row: React.FC<{
  icon: string;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}> = ({ icon, label, sublabel, onClick, danger, trailing }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3.5 rounded-2xl px-2 py-3 text-left transition-colors active:bg-surface"
  >
    <span
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full',
        danger ? 'bg-danger/10' : 'bg-surface'
      )}
    >
      <IonIcon
        icon={icon}
        style={{ fontSize: 18 }}
        className={danger ? 'text-danger' : 'text-brass'}
      />
    </span>
    <span className="min-w-0 flex-1">
      <span className={cn('block text-[15px]', danger ? 'text-danger' : 'text-ink')}>{label}</span>
      {sublabel && <span className="mt-0.5 block truncate text-[12px] text-ink-3">{sublabel}</span>}
    </span>
    {trailing ??
      (!danger && (
        <IonIcon
          icon={chevronForwardOutline}
          style={{ fontSize: 16 }}
          className="shrink-0 text-ink-3"
        />
      ))}
  </button>
);

const Group: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    {title && (
      <h2 className="px-2 pb-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-3">{title}</h2>
    )}
    <div className="rounded-3xl bg-surface-2 p-1.5">{children}</div>
  </section>
);

export default function MobileProfileHub({
  user,
  isAuthenticated,
  onOpenPaywall,
  onOpenRewards,
  onShowHelp,
  onShowAuth,
  onSignOut,
  onNavigateToStudio,
}: MobileProfileHubProps) {
  useEffect(() => {
    apiService.trackEvent('page_view', { page: 'profile_hub' });
  }, []);

  // ── Signed out ───────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex min-h-[62vh] w-full max-w-lg flex-col items-center justify-center px-8 text-center"
      >
        <img src="/brand/wordmark-light.png" alt="Hair Studio" className="h-[34px] w-auto" />
        <div className="mt-3.5 h-px w-10 bg-brass/40" />
        <h1 className="mt-6 font-display text-[26px] leading-tight text-ink">Your profile</h1>
        <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink-2">
          Sign in to keep your looks and pick up on any device. Browsing needs no
          account.
        </p>
        <button
          onClick={onShowAuth}
          className="mt-7 h-[52px] w-full max-w-[300px] rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99]"
        >
          Sign in
        </button>
      </motion.div>
    );
  }

  // ── Signed in ────────────────────────────────────────────────────────
  const looksLeft = Math.floor(Number(user.credits || 0) / BASE_GENERATION_COST);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6"
    >
      {/* ── Who ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center text-center">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-hairline"
          />
        ) : (
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-surface">
            <IonIcon icon={personOutline} style={{ fontSize: 30 }} className="text-ink-3" />
          </span>
        )}
        <h1 className="mt-3.5 font-display text-[24px] leading-tight text-ink">{user.name}</h1>
        <p className="mt-0.5 max-w-full truncate text-[13px] text-ink-2">{user.email}</p>
      </header>

      {/* ── The one number that matters ──────────────────────────────── */}
      <button
        onClick={onOpenPaywall}
        className="flex items-center justify-between rounded-3xl bg-surface-2 px-5 py-4 text-left active:scale-[0.99]"
      >
        <span>
          <span className="block font-display text-[30px] leading-none text-ink">{looksLeft}</span>
          <span className="mt-1 block text-[13px] text-ink-2">
            {looksLeft === 1 ? 'look left' : 'looks left'}
          </span>
        </span>
        <span className="rounded-full bg-brass px-4 py-2 text-[13px] font-semibold text-white">
          Top up
        </span>
      </button>

      {/* ── Do ───────────────────────────────────────────────────────── */}
      <Group>
        <Row
          icon={colorWandOutline}
          label="Try on a style"
          sublabel="Back to the lookbook"
          onClick={onNavigateToStudio}
        />
        <Row
          icon={giftOutline}
          label="Invite friends"
          sublabel="You both get free looks"
          onClick={onOpenRewards}
        />
        <Row
          icon={cardOutline}
          label="Plans and top-ups"
          sublabel="Your looks never expire"
          onClick={onOpenPaywall}
        />
      </Group>

      {/* ── Settings ─────────────────────────────────────────────────── */}
      <Group title="Settings">
        <div className="px-1 py-1">
          <NotificationToggle initialEnabled={user?.preferences?.notifications !== false} />
        </div>
        <Row icon={helpCircleOutline} label="Help and guide" onClick={onShowHelp} />
        <Row icon={logOutOutline} label="Sign out" danger onClick={onSignOut} trailing={<span />} />
      </Group>

      <div className="flex justify-center pb-2">
        <img src="/brand/wordmark-light.png" alt="" className="h-[18px] w-auto opacity-30" />
      </div>
    </motion.div>
  );
}
