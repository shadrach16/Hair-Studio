// LooksChip.tsx — the header allowance chip (4.4).
//
// Replaces the coin-count pill. The old pill put credit arithmetic in the
// chrome of every session ("12" next to a coin icon), which trains users to
// think in currency instead of outcomes. This says what they actually have:
// "3 looks today".
//
// Guests see nothing here until they've had a first result — pricing before
// value is what the paywall wall was (3.1). After M5 this reads the daily-units
// allowance directly; until then it maps credits -> looks at the Preview rate.

import { cn } from '@/lib/utils';

/** Credits charged for one Preview/Standard generation (flat tier pricing). */
const CREDITS_PER_LOOK = 2;

export interface LooksChipProps {
  credits: number;
  /** Hidden entirely until the user has seen a result. */
  visible?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LooksChip({ credits, visible = true, onClick, className }: LooksChipProps) {
  if (!visible) return null;

  const looks = Math.floor(Math.max(0, credits) / CREDITS_PER_LOOK);
  const isEmpty = looks <= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isEmpty ? 'No looks left today. Get more.' : `${looks} looks left today`}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 h-8',
        'text-caption text-ink-2 transition-colors active:bg-surface-2',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', isEmpty ? 'bg-ink-3' : 'bg-brass')}
      />
      {isEmpty ? 'Get looks' : `${looks} ${looks === 1 ? 'look' : 'looks'} today`}
    </button>
  );
}

export default LooksChip;
