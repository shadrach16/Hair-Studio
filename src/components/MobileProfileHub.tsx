import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { apiService, type User } from '@/lib/api';
import {
  Sparkles,
  Crown,
  Gift,
  HelpCircle,
  Loader2,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  Wand2,
  Trophy,
  ChevronRight,
  CreditCard,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASE_GENERATION_COST } from '@/lib/generationTiers';
import StreakHub from '@/components/StreakHub';
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

interface StreakSummary {
  currentStreak?: number;
  longestStreak?: number;
}

// ─── Settings Row ────────────────────────────────────────────────────────

const SettingsRow: React.FC<{
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onClick: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}> = ({ icon: Icon, iconColor = 'text-gray-400', label, sublabel, onClick, trailing, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3.5 py-3.5 px-1 text-left transition-colors active:bg-gray-50/60 rounded-xl',
      danger && 'text-red-500'
    )}
  >
    <span className={cn(
      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
      danger ? 'bg-red-50' : 'bg-gray-50'
    )}>
      <Icon className={cn('h-[18px] w-[18px]', danger ? 'text-red-400' : iconColor)} />
    </span>
    <span className="flex-1 min-w-0">
      <span className={cn('text-[14px] font-medium', danger ? 'text-red-500' : 'text-gray-800')}>{label}</span>
      {sublabel && <span className="block text-[12px] text-gray-400 mt-0.5 truncate">{sublabel}</span>}
    </span>
    {trailing || (
      <ChevronRight className={cn('h-4 w-4 flex-shrink-0', danger ? 'text-red-300' : 'text-gray-300')} />
    )}
  </button>
);

const Divider = () => <div className="h-px bg-gray-100 mx-1" />;

// ─── Stat Card ──────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  loading?: boolean;
}> = ({ label, value, icon: Icon, loading }) => (
  <div className="flex-1 rounded-2xl bg-white p-4 ring-1 ring-black/[0.04] shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </span>
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">
      {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-300" /> : value}
    </p>
  </div>
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
  refreshUser,
}: MobileProfileHubProps) {
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);

  useEffect(() => {
    apiService.trackEvent('page_view', { page: 'profile_hub' });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setStreak(null);
      return;
    }

    let active = true;

    const loadStreak = async () => {
      setLoadingStreak(true);
      try {
        const result = await apiService.getStreakStatus();
        if (active && result.success && result.data) {
          setStreak(result.data);
        }
      } finally {
        if (active) {
          setLoadingStreak(false);
        }
      }
    };

    void loadStreak();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // ── Signed-out state ─────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6 shadow-sm">
          <UserCircle className="w-9 h-9 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-[260px] leading-relaxed">
          Sign in to keep your looks, save your favourites, and earn streak rewards.
        </p>
        <button
          onClick={onShowAuth}
          className="mt-8 flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-white text-gray-800 text-sm font-semibold shadow-lg shadow-gray-900/8 ring-1 ring-black/[0.08] active:scale-[0.97] transition-transform"
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M9.827,24 C9.827,22.476 10.08,21.014 10.532,19.644 L2.623,13.604 C1.082,16.734 0.214,20.26 0.214,24 C0.214,27.737 1.081,31.261 2.62,34.388 L10.525,28.337 C10.077,26.973 9.827,25.517 9.827,24" fill="#FBBC05"/><path d="M23.714,10.133 C27.025,10.133 30.016,11.307 32.366,13.227 L39.202,6.4 C35.036,2.773 29.695,0.533 23.714,0.533 C14.427,0.533 6.445,5.844 2.623,13.604 L10.532,19.644 C12.355,14.112 17.549,10.133 23.714,10.133" fill="#EB4335"/><path d="M23.714,37.867 C17.549,37.867 12.355,33.888 10.532,28.356 L2.623,34.395 C6.445,42.156 14.427,47.467 23.714,47.467 C29.445,47.467 34.918,45.431 39.025,41.618 L31.518,35.814 C29.4,37.149 26.732,37.867 23.714,37.867" fill="#34A853"/><path d="M46.145,24 C46.145,22.613 45.932,21.12 45.611,19.733 L23.714,19.733 L23.714,28.8 L36.318,28.8 C35.688,31.891 33.972,34.268 31.518,35.814 L39.025,41.618 C43.339,37.614 46.145,31.649 46.145,24" fill="#4285F4"/></svg>
          Sign in with Google
        </button>
      </motion.div>
    );
  }

  // ── Signed-in state ──────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-lg flex-col gap-5 px-2 py-5"
    >
      {/* ── User identity ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3.5">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/[0.06] shadow-sm"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <UserCircle className="h-7 w-7 text-gray-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[16px] font-bold text-gray-900">{user.name}</p>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
              user.isPro
                ? 'bg-purple-50 text-purple-600'
                : 'bg-gray-100 text-gray-500'
            )}>
              {user.isPro ? 'Pro' : 'Free'}
            </span>
          </div>
          <p className="truncate text-[13px] text-gray-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        {/* Was label "Credits" with `credits.toFixed(1)` beside a coin — a
            decimal balance in the retired currency, on a top-level screen, with
            the division left to the reader. Same conversion the header chip and
            the paywall use, so the three can never disagree. */}
        <StatCard
          label="Looks left"
          value={String(Math.floor(Number(user.credits || 0) / BASE_GENERATION_COST))}
          icon={Sparkles}
        />
        <StatCard
          label="Best Streak"
          value={streak?.longestStreak ?? 0}
          icon={Trophy}
          loading={loadingStreak}
        />
      </div>

      {/* ── Streak hub ───────────────────────────────────────────────── */}
      <StreakHub onCreditChange={() => refreshUser?.()} />

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-2 ring-1 ring-black/[0.04] shadow-sm">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">Account</p>
        <SettingsRow
          icon={CreditCard}
          iconColor="text-amber-500"
          label={user.isPro ? 'Buy more looks' : 'Buy looks'}
          sublabel="Top up any time — they never expire"
          onClick={onOpenPaywall}
        />
        <Divider />
        {user.isPro && (
          <>
            <SettingsRow
              icon={Crown}
              iconColor="text-purple-500"
              label="Manage subscription"
              sublabel="View or change your Pro plan"
              onClick={onOpenPaywall}
            />
            <Divider />
          </>
        )}
        <SettingsRow
          icon={Gift}
          iconColor="text-amber-500"
          label="Rewards center"
          sublabel="Referrals, streaks, and bonuses"
          onClick={onOpenRewards}
        />
        <Divider />
        <SettingsRow
          icon={Wand2}
          iconColor="text-amber-500"
          label="Try on a style"
          onClick={onNavigateToStudio}
        />
      </div>

      {/* ── Settings ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-2 ring-1 ring-black/[0.04] shadow-sm">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">Settings</p>
        <div className="px-1 py-1">
          <NotificationToggle
            initialEnabled={user?.preferences?.notifications !== false}
          />
        </div>
        <Divider />
        <SettingsRow
          icon={HelpCircle}
          iconColor="text-gray-400"
          label="Help & guide"
          onClick={onShowHelp}
        />
        <Divider />
        <SettingsRow
          icon={LogOut}
          label="Sign out"
          onClick={onSignOut}
          danger
          trailing={<span />}
        />
      </div>

      {/* Bottom spacing for tab bar */}
      <div className="h-4" />
    </motion.div>
  );
}