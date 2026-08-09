// ScreenHeader.tsx — one header for every screen.
//
// Ported from the pattern used in the Retinue/Nerve apps: a thin, translucent
// bar that sits over content, with the screen title in the editorial serif and
// optional leading (back) / trailing (action) slots. Consistency here is a
// large part of why an app reads as "designed" rather than assembled.

import React from 'react';
import { cn } from '@/lib/utils';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  /** Rendered on the right — keep to ONE action for a calm header. */
  action?: React.ReactNode;
  /** Blur/translucency over scrolling content. */
  translucent?: boolean;
  className?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  action,
  translucent = true,
  className,
}) => (
  <header
    className={cn(
      'sticky top-0 z-30 flex items-center gap-3 px-4',
      'pt-[var(--safe-area-top)] h-[calc(var(--header-height)+var(--safe-area-top))]',
      translucent
        ? 'bg-surface/85 backdrop-blur-xl border-b border-hairline'
        : 'bg-surface border-b border-hairline',
      className
    )}
  >
    {onBack && (
      <button
        onClick={onBack}
        aria-label="Back"
        className="-ml-1 w-9 h-9 flex items-center justify-center rounded-full text-ink"
      >
        {/* Chevron drawn inline: no icon-set dependency for the most-used control */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    )}

    <div className="flex-1 min-w-0">
      {title && (
        <h1 className="font-display text-title text-ink truncate leading-tight">{title}</h1>
      )}
      {subtitle && <p className="text-caption text-ink-2 truncate">{subtitle}</p>}
    </div>

    {action && <div className="flex-shrink-0">{action}</div>}
  </header>
);

export default ScreenHeader;
