// ChromeBar.tsx — the strip at the very top of a screen.
//
// Verified Retinue/Nerve pattern: flat `bg-surface` with NO border, NO blur and
// NO title text. Combined with a natively-tinted status bar (see lib/native.ts)
// the clock, this bar and the page become one continuous plane — zero seams,
// which is what actually reads "premium native".
//
// CRITICAL: this bar ALONE owns `env(safe-area-inset-top)`. Anything below it
// must not pad for the status bar again (the reference app shipped a
// double-padding bug doing exactly that).

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Quiet 44×44 round icon button — the standard chrome affordance. */
export const ChromeButton: React.FC<{
  onClick?: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}> = ({ onClick, label, children, className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={cn(
      'grid h-11 w-11 place-items-center rounded-full text-ink',
      'transition-colors active:bg-surface-2',
      className
    )}
  >
    {children}
  </button>
);

export interface ChromeBarProps {
  /** Left slot — the brass wordmark, or a back button on pushed screens. */
  leading?: ReactNode;
  /** Right slot — at most two quiet actions (search, "looks" chip). */
  trailing?: ReactNode;
  className?: string;
}

export function ChromeBar({ leading, trailing, className }: ChromeBarProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between bg-surface px-1.5 pb-0.5',
        className
      )}
      // The one element that owns the status-bar inset.
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex min-w-0 items-center">{leading}</div>
      <div className="flex shrink-0 items-center gap-0.5">{trailing}</div>
    </header>
  );
}

export default ChromeBar;
